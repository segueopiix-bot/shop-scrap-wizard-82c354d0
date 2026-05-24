#!/usr/bin/env node
/**
 * Removes all "sale" pricing across the catalog. For each product:
 *  - if originalPrice is set, keep the LOWEST price (min(price, originalPrice))
 *  - delete originalPrice and discount fields
 *  - rebuild installment from the new single price (12x)
 * Same for variantPrices in productDescriptions.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function rewriteProducts() {
  const p = path.join(ROOT, "src/data/products.ts");
  let src = fs.readFileSync(p, "utf8");

  // Match each product object block (top-level array entries)
  const blockRe = /\{\s*"?id"?\s*:\s*"([^"]+)"[\s\S]*?\n\s{2}\}/g;
  let changed = 0;
  src = src.replace(blockRe, (block) => {
    const priceM = block.match(/("?price"?\s*:\s*)([\d.]+)/);
    const origM = block.match(/("?originalPrice"?\s*:\s*)([\d.]+)/);
    if (!priceM) return block;
    const price = parseFloat(priceM[2]);
    const orig = origM ? parseFloat(origM[2]) : null;
    const finalPrice = orig != null && orig < price ? orig : price;

    let out = block;
    if (orig != null) {
      // Update price to lowest
      out = out.replace(/("?price"?\s*:\s*)[\d.]+/, `$1${finalPrice}`);
      // Drop originalPrice & discount lines entirely
      out = out.replace(/\s*"?originalPrice"?\s*:\s*[\d.]+\s*,?/g, "");
      out = out.replace(/\s*"?discount"?\s*:\s*\d+\s*,?/g, "");
      // Rebuild installment
      const inst = `R$ ${(finalPrice / 12).toFixed(2).replace(".", ",")}`;
      out = out.replace(/("?installment"?\s*:\s*")[^"]*(")/g, `$1${inst}$2`);
      changed++;
    } else if (finalPrice !== price) {
      out = out.replace(/("?price"?\s*:\s*)[\d.]+/, `$1${finalPrice}`);
    }
    return out;
  });
  fs.writeFileSync(p, src);
  console.log(`products.ts: normalized ${changed} products`);
}

function rewriteDescriptions() {
  const p = path.join(ROOT, "src/data/productDescriptions.ts");
  if (!fs.existsSync(p)) return;
  let src = fs.readFileSync(p, "utf8");
  // variantPrices: { "key": { price: X, originalPrice: Y } }
  let changed = 0;
  src = src.replace(/\{\s*price\s*:\s*([\d.]+)\s*,\s*originalPrice\s*:\s*([\d.]+)\s*\}/g, (_, pStr, oStr) => {
    const lo = Math.min(parseFloat(pStr), parseFloat(oStr));
    changed++;
    return `{ price: ${lo} }`;
  });
  // also handle quoted-key form
  src = src.replace(/\{\s*"price"\s*:\s*([\d.]+)\s*,\s*"originalPrice"\s*:\s*([\d.]+)\s*\}/g, (_, pStr, oStr) => {
    const lo = Math.min(parseFloat(pStr), parseFloat(oStr));
    changed++;
    return `{ "price": ${lo} }`;
  });
  fs.writeFileSync(p, src);
  console.log(`productDescriptions.ts: normalized ${changed} variant prices`);
}

rewriteProducts();
rewriteDescriptions();
