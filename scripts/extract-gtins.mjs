#!/usr/bin/env node
/**
 * Tenta extrair GTIN/EAN de produtos via Firecrawl search.
 * Estratégia: busca "<nome> EAN" no Google e procura 13 dígitos
 * começando com 789/790 (prefixo Brasil) nos snippets.
 */
import fs from "node:fs";
import path from "node:path";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_KEY) { console.error("FIRECRAWL_API_KEY missing"); process.exit(1); }

const LIMIT = parseInt(process.argv[2] || "10", 10);
const src = fs.readFileSync("src/data/products.ts", "utf8");
const blocks = [...src.matchAll(/\{\s*id:\s*"([^"]+)",[\s\S]*?\}/g)];
const products = [];
for (const b of blocks) {
  const name = b[0].match(/name:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  if (name) products.push({ id: b[1], name });
}
const seen = new Set();
const unique = products.filter(p => seen.has(p.id) ? false : (seen.add(p.id), true));
const sample = unique.slice(0, LIMIT);

console.log(`Testando ${sample.length} produtos de ${unique.length}\n`);

const EAN_RE = /\b(789\d{10}|790\d{10})\b/g;

async function searchOne(p) {
  // Limpa nome de prefixos promocionais entre () ou []
  const cleanName = p.name.replace(/[\[\(][^\]\)]+[\]\)]/g, "").trim().slice(0, 80);
  const query = `${cleanName} EAN codigo de barras`;
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 5 }),
  });
  const data = await res.json();
  const eans = new Set();
  for (const r of data?.data?.web || []) {
    const text = `${r.title || ""} ${r.description || ""}`;
    for (const m of text.matchAll(EAN_RE)) eans.add(m[1]);
  }
  return { ...p, cleanName, eans: [...eans] };
}

const results = [];
for (const p of sample) {
  try {
    const r = await searchOne(p);
    results.push(r);
    console.log(`${r.eans.length ? "✅" : "❌"} ${r.id.padEnd(35)} ${r.eans.join(",") || "—"}`);
  } catch (e) {
    console.log(`⚠️  ${p.id} erro: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 800));
}

const hits = results.filter(r => r.eans.length).length;
console.log(`\nTaxa de acerto: ${hits}/${results.length} (${Math.round(100*hits/results.length)}%)`);
fs.writeFileSync("/tmp/gtin-test.json", JSON.stringify(results, null, 2));
