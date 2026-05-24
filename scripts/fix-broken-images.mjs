#!/usr/bin/env node
/**
 * Downloads images for products that still reference broken/external hosts
 * (Vtex legacy with spaces in filenames, Supabase external bucket) and rewrites
 * src/data/products.ts to point at /products/<file>.jpg.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public/products");
fs.mkdirSync(OUT_DIR, { recursive: true });

const productsPath = path.join(ROOT, "src/data/products.ts");
let src = fs.readFileSync(productsPath, "utf8");

const PROBLEM_HOSTS = ["tisvtkymwswqezauylmu.supabase.co", "epocacosmeticos.vteximg.com.br"];
const urls = new Set();
const urlRe = /"(https?:\/\/[^"]+)"/g;
for (const m of src.matchAll(urlRe)) {
  const u = m[1];
  if (PROBLEM_HOSTS.some((h) => u.includes(h))) urls.add(u);
}
console.log(`Found ${urls.size} URLs to fix`);

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const mapping = {};
for (const u of urls) {
  try {
    const fetchUrl = encodeURI(u);
    const filename = path.basename(decodeURIComponent(new URL(fetchUrl).pathname));
    const hash = crypto.createHash("md5").update(u).digest("hex").slice(0, 8);
    const ext = (filename.match(/\.(jpe?g|png|webp)$/i)?.[1] || "jpg").toLowerCase();
    const safe = slugify(filename.replace(/\.(jpe?g|png|webp)(\.jpg)?$/i, "")) + `-${hash}.${ext.replace("jpeg", "jpg")}`;
    const dest = path.join(OUT_DIR, safe);
    const localUrl = `https://lojas-epoca.store/products/${safe}`;
    if (!fs.existsSync(dest)) {
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        console.warn(`  ✗ ${res.status} ${u}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`  ✓ ${safe}`);
    }
    mapping[u] = localUrl;
  } catch (e) {
    console.warn(`  ✗ ${e.message} ${u}`);
  }
}

// Rewrite source
let count = 0;
for (const [from, to] of Object.entries(mapping)) {
  const re = new RegExp(`"${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g");
  src = src.replace(re, () => { count++; return `"${to}"`; });
}
fs.writeFileSync(productsPath, src);
console.log(`Rewrote ${count} URL references. ${Object.keys(mapping).length}/${urls.size} downloaded.`);
