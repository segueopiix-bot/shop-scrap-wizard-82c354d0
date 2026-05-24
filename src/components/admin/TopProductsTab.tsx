import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type StatusFilter = "paid" | "all";

interface Row {
  key: string;
  name: string;
  variant?: string;
  qty: number;
  revenueCents: number;
  orders: number;
  image?: string;
}

export default function TopProductsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("paid");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase.from("orders").select("items, status, amount_cents").limit(5000);
      if (statusFilter === "paid") q = q.eq("status", "paid");
      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        setRows([]);
        setLoading(false);
        return;
      }

      const map = new Map<string, Row>();
      for (const o of data || []) {
        const items = Array.isArray((o as any).items) ? (o as any).items : [];
        for (const it of items) {
          const name = it.name || it.title || it.product_name || it.id || "Produto";
          const variant = it.variant || it.variantKey || "";
          const qty = Number(it.quantity || it.qty || 1) || 1;
          const unitCents =
            Number(it.price_cents) ||
            (it.price ? Math.round(Number(it.price) * 100) : 0);
          const key = `${name}__${variant}`;
          const existing = map.get(key);
          if (existing) {
            existing.qty += qty;
            existing.revenueCents += unitCents * qty;
            existing.orders += 1;
          } else {
            map.set(key, {
              key,
              name,
              variant: variant || undefined,
              qty,
              revenueCents: unitCents * qty,
              orders: 1,
              image: it.image,
            });
          }
        }
      }

      const sorted = Array.from(map.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 20);
      setRows(sorted);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ranking dos 20 produtos mais vendidos.
        </p>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Apenas pagos</SelectItem>
            <SelectItem value="all">Todos pedidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead className="text-right">Qtd vendida</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum produto vendido ainda
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={r.key}>
                  <TableCell className="font-bold">{i + 1}</TableCell>
                  <TableCell className="max-w-[360px] truncate">{r.name}</TableCell>
                  <TableCell>
                    {r.variant ? <Badge variant="outline">{r.variant}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{r.qty}</TableCell>
                  <TableCell className="text-right">{r.orders}</TableCell>
                  <TableCell className="text-right">{formatBRL(r.revenueCents)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
