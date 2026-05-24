import { supabase } from "@/integrations/supabase/client";
import { products as productsArray, type Product } from "@/data/products";
import type { ProductDescription } from "@/data/productDescriptions";

export interface ProductOverrideRow {
  product_id: string;
  name: string | null;
  price: number | null;
  original_price: number | null;
  installment: string | null;
  discount: number | null;
  active: boolean;
  hidden_variants: string[] | null;
}


export interface VariantOverrideRow {
  product_id: string;
  variant_key: string;
  price: number;
  original_price: number | null;
}

export interface CustomProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  installment: string | null;
  discount: number | null;
  image: string;
  images: string[];
  description: string | null;
  variant_prices: Record<string, { price: number; originalPrice?: number }> | null;
  active: boolean;
}

const formatInstallment = (price: number) =>
  `R$ ${(price / 12).toFixed(2).replace(".", ",")}`;

let overridesLoaded = false;

/** Fetch all overrides/custom products from DB and patch the in-memory catalog. */
export async function loadAndApplyOverrides(): Promise<void> {
  try {
    const [poRes, voRes, cpRes] = await Promise.all([
      supabase.from("product_overrides").select("*").eq("active", true),
      supabase.from("variant_price_overrides").select("*"),
      supabase.from("custom_products").select("*").eq("active", true),
    ]);

    const productOverrides = (poRes.data || []) as unknown as ProductOverrideRow[];
    const variantOverrides = (voRes.data || []) as unknown as VariantOverrideRow[];
    const customProducts = (cpRes.data || []) as unknown as CustomProductRow[];

    // Load descriptions if we have any kind of override (product, variant, or custom)
    const needsDescriptions =
      productOverrides.length > 0 || variantOverrides.length > 0 || customProducts.length > 0;
    const productDescriptions = needsDescriptions
      ? (await import("@/data/productDescriptions")).productDescriptions
      : ({} as Record<string, ProductDescription>);

    // Track which (product, variant) pairs have explicit variant overrides so
    // they win over the product-level override below.
    const variantOverrideKeys = new Set(
      variantOverrides.map((v) => `${v.product_id}::${v.variant_key}`),
    );

    // 1. Apply product-level overrides (mutate in place). When the product has
    // variants, also propagate the override to each variant's price so the
    // product page (which reads variantPrices first) stays in sync.
    const byId = new Map(productsArray.map((p) => [p.id, p]));
    for (const ov of productOverrides) {
      const p = byId.get(ov.product_id);
      if (!p) continue;
      if (ov.name && ov.name.trim()) p.name = ov.name.trim();
      if (ov.price != null) p.price = Number(ov.price);
      if (ov.original_price != null) p.originalPrice = Number(ov.original_price);
      if (ov.installment) p.installment = ov.installment;
      else if (ov.price != null) p.installment = formatInstallment(Number(ov.price));
      if (ov.discount != null) p.discount = ov.discount;

      const desc = productDescriptions[ov.product_id];
      const hidden = new Set(ov.hidden_variants || []);
      const hideAll = hidden.has("*");

      if (desc) {
        if (hideAll) {
          // Remove all variants
          delete desc.variants;
          delete desc.variantPrices;
          delete desc.variantImages;
          delete desc.variantLabel;
          p.hasVariants = false;
        } else if (hidden.size > 0) {
          if (desc.variants) desc.variants = desc.variants.filter((v) => !hidden.has(v));
          if (desc.variantPrices) {
            const vp = { ...desc.variantPrices };
            for (const k of hidden) delete vp[k];
            desc.variantPrices = vp;
          }
          if (desc.variantImages) {
            const vi = { ...desc.variantImages };
            for (const k of hidden) delete vi[k];
            desc.variantImages = vi;
          }
          const remaining = desc.variants?.length || Object.keys(desc.variantPrices || {}).length;
          if (!remaining) p.hasVariants = false;
        }
      }

      if (desc?.variantPrices) {
        const vp = { ...desc.variantPrices };
        for (const key of Object.keys(vp)) {
          if (variantOverrideKeys.has(`${ov.product_id}::${key}`)) continue;
          vp[key] = {
            ...vp[key],
            ...(ov.price != null ? { price: Number(ov.price) } : {}),
            ...(ov.original_price != null
              ? { originalPrice: Number(ov.original_price) }
              : {}),
          };
        }
        desc.variantPrices = vp;
      }
    }


    // 2. Variant overrides: mutate productDescriptions[product_id].variantPrices
    const byProduct: Record<string, VariantOverrideRow[]> = {};
    for (const vo of variantOverrides) {
      (byProduct[vo.product_id] ||= []).push(vo);
    }
    for (const [pid, list] of Object.entries(byProduct)) {
      const desc = productDescriptions[pid];
      if (!desc) continue;
      const vp = { ...(desc.variantPrices || {}) };
      for (const v of list) {
        vp[v.variant_key] = {
          price: Number(v.price),
          ...(v.original_price != null ? { originalPrice: Number(v.original_price) } : {}),
        };
      }
      desc.variantPrices = vp;
    }

    // 3. Insert custom products into the array + descriptions
    for (const cp of customProducts) {
      const existingIdx = productsArray.findIndex((p) => p.id === cp.id);
      const product: Product = {
        id: cp.id,
        name: cp.name,
        image: cp.image,
        images: Array.isArray(cp.images) && cp.images.length ? cp.images : [cp.image],
        price: Number(cp.price),
        originalPrice: cp.original_price != null ? Number(cp.original_price) : undefined,
        discount: cp.discount ?? undefined,
        installment: cp.installment || formatInstallment(Number(cp.price)),
        hasVariants: !!cp.variant_prices && Object.keys(cp.variant_prices).length > 0,
        category: cp.category,
      };
      if (existingIdx >= 0) productsArray[existingIdx] = product;
      else productsArray.push(product);

      const variants = cp.variant_prices ? Object.keys(cp.variant_prices) : undefined;
      const desc: ProductDescription = {
        slug: cp.id,
        descriptionHtml: cp.description || `<p>${cp.name}</p>`,
        ...(variants && variants.length
          ? {
              variants,
              variantLabel: "Tamanho",
              variantPrices: cp.variant_prices as ProductDescription["variantPrices"],
            }
          : {}),
      };
      productDescriptions[cp.id] = desc;
    }

    overridesLoaded = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[productOverrides] failed to load", err);
    overridesLoaded = true; // don't block the app
  }
}

export const overridesAreLoaded = () => overridesLoaded;
