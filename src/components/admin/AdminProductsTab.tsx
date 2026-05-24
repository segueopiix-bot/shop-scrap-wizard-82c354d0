import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { products as allProducts } from "@/data/products";
import { productDescriptions } from "@/data/productDescriptions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, RotateCcw, Trash2 } from "lucide-react";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

interface VariantInput {
  key: string;
  price: string;
  originalPrice: string;
}

export default function AdminProductsTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "suplementos" | "cosmeticos">("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      if (categoryFilter === "suplementos" && !cat.startsWith("suplementos")) return false;
      if (categoryFilter === "cosmeticos" && !cat.startsWith("cosmeticos")) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.includes(q)) return false;
      return true;
    });
  }, [search, categoryFilter, reloadKey]);

  const pageSize = 20;
  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const counts = useMemo(() => {
    let s = 0, c = 0;
    for (const p of allProducts) {
      const cat = (p.category || "").toLowerCase();
      if (cat.startsWith("suplementos")) s++;
      else if (cat.startsWith("cosmeticos")) c++;
    }
    return { suplementos: s, cosmeticos: c, all: allProducts.length };
  }, [reloadKey]);

  const handleDeleteCustom = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("custom_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído. Recarregue para refletir.");
    setReloadKey((k) => k + 1);
  };

  const filterBtn = (key: "all" | "suplementos" | "cosmeticos", label: string, count: number) => (
    <button
      type="button"
      onClick={() => { setCategoryFilter(key); setPage(0); }}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        categoryFilter === key
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-foreground border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar produto por nome ou ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-sm"
        />
        <Button onClick={() => setAdding(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-1 h-4 w-4" /> Adicionar produto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterBtn("all", "Todos", counts.all)}
        {filterBtn("suplementos", "Suplementos", counts.suplementos)}
        {filterBtn("cosmeticos", "Cosméticos", counts.cosmeticos)}
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} produto(s) — página {page + 1} de {totalPages}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="p-2">Imagem</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => {
              const desc = productDescriptions[p.id];
              const isCustom = p.id.startsWith("custom-");
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded object-contain bg-white"  loading="lazy"/>
                  </td>
                  <td className="p-2 max-w-xs">
                    <div className="font-medium line-clamp-2">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="p-2 text-xs">{p.category}</td>
                  <td className="p-2 whitespace-nowrap font-medium">
                    {formatBRL(p.price)}
                    {desc?.variantPrices && (
                      <div className="text-[10px] text-muted-foreground">
                        {Object.keys(desc.variantPrices).length} variante(s)
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditing(p.id)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {isCustom && (
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCustom(p.id)}>
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>

      {editing && (
        <EditProductDialog
          productId={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
      {adding && (
        <AddProductDialog
          onClose={() => setAdding(false)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

/* ---------------------- Edit dialog ---------------------- */

function EditProductDialog({
  productId,
  onClose,
  onSaved,
}: {
  productId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const product = allProducts.find((p) => p.id === productId);
  const desc = productDescriptions[productId];

  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() || "");
  const [installment, setInstallment] = useState(product?.installment || "");
  const [discount, setDiscount] = useState(product?.discount?.toString() || "");

  const initialVariants: VariantInput[] = desc?.variantPrices
    ? Object.entries(desc.variantPrices).map(([k, v]) => ({
        key: k,
        price: v.price.toString(),
        originalPrice: v.originalPrice?.toString() || "",
      }))
    : desc?.variants
    ? desc.variants.map((k) => ({ key: k, price: product?.price.toString() || "", originalPrice: "" }))
    : [];
  const [variants, setVariants] = useState<VariantInput[]>(initialVariants);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [existingHidden, setExistingHidden] = useState<string[]>([]);
  const initialKeysRef = useMemo(() => initialVariants.map((v) => v.key), []);

  // Load existing hidden_variants from DB so we don't lose them on re-save.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("product_overrides")
        .select("hidden_variants, name")
        .eq("product_id", productId)
        .maybeSingle();
      if (data?.hidden_variants) setExistingHidden(data.hidden_variants as string[]);
      if (data?.name) setName(data.name as string);
    })();
  }, [productId]);

  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const removeVariantRow = (i: number) => {
    const v = variants[i];
    if (v.key && initialKeysRef.includes(v.key)) {
      setRemovedKeys((prev) => (prev.includes(v.key) ? prev : [...prev, v.key]));
    }
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const removeAllVariants = () => {
    if (!confirm("Remover TODAS as variações deste produto?")) return;
    setRemovedKeys(["*"]);
    setVariants([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const priceNum = parseFloat(price.replace(",", ".")) || product.price;
      const origNum = originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null;

      // Merge previously persisted hidden_variants with what was removed this session.
      const mergedHidden = removedKeys.includes("*") || existingHidden.includes("*")
        ? ["*"]
        : Array.from(new Set([...existingHidden, ...removedKeys]));

      const { error: e1 } = await supabase.from("product_overrides").upsert({
        product_id: productId,
        name: name.trim() || null,
        price: priceNum,
        original_price: origNum,
        installment: installment || null,
        discount: discount ? parseInt(discount) : null,
        active: true,
        hidden_variants: mergedHidden,
        updated_at: new Date().toISOString(),
      });
      if (e1) throw e1;

      // Delete variant overrides for removed keys
      if (mergedHidden.includes("*")) {
        await supabase
          .from("variant_price_overrides")
          .delete()
          .eq("product_id", productId);
      } else if (mergedHidden.length > 0) {
        await supabase
          .from("variant_price_overrides")
          .delete()
          .eq("product_id", productId)
          .in("variant_key", mergedHidden);
      }



      // Variants
      for (const v of variants) {
        if (!v.key || !v.price) continue;
        const vp = parseFloat(v.price.replace(",", ".")) || 0;
        const vop = v.originalPrice ? parseFloat(v.originalPrice.replace(",", ".")) : null;
        const { error: e2 } = await supabase
          .from("variant_price_overrides")
          .upsert(
            {
              product_id: productId,
              variant_key: v.key,
              price: vp,
              original_price: vop,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "product_id,variant_key" }
          );
        if (e2) throw e2;
      }

      toast.success("Preços atualizados! Recarregue a loja para ver as mudanças.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Resetar para o preço original do código?")) return;
    setSaving(true);
    await supabase.from("product_overrides").delete().eq("product_id", productId);
    await supabase.from("variant_price_overrides").delete().eq("product_id", productId);
    toast.success("Override removido. Recarregue a loja.");
    onSaved();
    onClose();
    setSaving(false);
  };


  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar preço — {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome do produto</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome exibido na loja" />
          </div>
          <div className="col-span-2">
            <Label>Preço (R$)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Parcelamento (texto)</Label>
            <Input
              value={installment}
              onChange={(e) => setInstallment(e.target.value)}
              placeholder="auto: preço/12"
            />
          </div>
          <div>
            <Label>Desconto %</Label>
            <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0-99" />
          </div>
        </div>

        {(variants.length > 0 || initialKeysRef.length > 0) && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Variantes</Label>
              {variants.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeAllVariants}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Remover todas
                </Button>
              )}
            </div>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label className="text-[10px]">Variante</Label>
                  <Input
                    value={v.key}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i].key = e.target.value;
                      setVariants(next);
                    }}
                  />
                </div>
                <div className="col-span-5">
                  <Label className="text-[10px]">Preço</Label>
                  <Input
                    value={v.price}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i].price = e.target.value;
                      setVariants(next);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariantRow(i)}
                    className="w-full"
                    title="Remover esta variante"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants([...variants, { key: "", price: "", originalPrice: "" }])}
            >
              <Plus className="mr-1 h-3 w-3" /> Variante
            </Button>
            {removedKeys.length > 0 && (
              <p className="text-[11px] text-red-600">
                {removedKeys.includes("*")
                  ? "Todas as variantes serão removidas ao salvar."
                  : `Variantes a remover: ${removedKeys.join(", ")}`}
              </p>
            )}
          </div>
        )}


        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="mr-1 h-3 w-3" /> Resetar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Add dialog ---------------------- */

function AddProductDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !category || !price || !image) {
      toast.error("Preencha nome, categoria, preço e imagem");
      return;
    }
    setSaving(true);
    try {
      const id = "custom-" + slugify(name) + "-" + Date.now().toString(36).slice(-4);
      const priceNum = parseFloat(price.replace(",", "."));
      const origNum = originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null;
      const variantPrices: Record<string, { price: number; originalPrice?: number }> = {};
      for (const v of variants) {
        if (!v.key || !v.price) continue;
        variantPrices[v.key] = {
          price: parseFloat(v.price.replace(",", ".")),
          ...(v.originalPrice
            ? { originalPrice: parseFloat(v.originalPrice.replace(",", ".")) }
            : {}),
        };
      }
      const { error } = await supabase.from("custom_products").insert({
        id,
        name,
        category,
        price: priceNum,
        original_price: origNum,
        image,
        images: [image],
        description: description || null,
        variant_prices: Object.keys(variantPrices).length ? variantPrices : null,
        active: true,
      });
      if (error) throw error;
      toast.success("Produto criado! Recarregue a loja para vê-lo.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar novo produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria * (slug)</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ex: cosmeticos-cabelos-shampoo"
              />
            </div>
            <div>
              <Label>Preço (R$) *</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label>Imagem (URL) *</Label>
            <div className="flex gap-3 items-start">
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="h-20 w-20 rounded border object-contain bg-white shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
          <div>
            <Label>Descrição (HTML)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="<p>Descrição do produto...</p>"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Variantes (opcional)</Label>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Input
                    placeholder="Nome (ex: 500ml)"
                    value={v.key}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i].key = e.target.value;
                      setVariants(next);
                    }}
                  />
                </div>
                <div className="col-span-6">
                  <Input
                    placeholder="Preço"
                    value={v.price}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i].price = e.target.value;
                      setVariants(next);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants([...variants, { key: "", price: "", originalPrice: "" }])}
            >
              <Plus className="mr-1 h-3 w-3" /> Variante
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? "Salvando..." : "Criar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
