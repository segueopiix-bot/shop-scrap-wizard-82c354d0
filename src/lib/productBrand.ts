import type { Product } from "@/data/products";

const BRANDS = [
  "Max Titanium",
  "Masterway",
  "Giants Nutrition",
  "Soldiers Nutrition",
  "Dux Human Health",
  "Vitafor",
  "Dark Lab",
  "Vhita",
  "Dr. Peanut",
  "Wella",
  "Everlast",
  "FTW",
];

export function getBrand(product: Pick<Product, "name">): string {
  const n = product.name;
  for (const b of BRANDS) {
    if (n.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return "Growth";
}
