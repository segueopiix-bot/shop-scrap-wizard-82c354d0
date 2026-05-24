import { useRef, useState } from "react";
import { Upload, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadProofProps {
  transactionId?: string;
}

const UploadProof = ({ transactionId }: UploadProofProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 20MB)");
      return;
    }
    setUploading(true);
    try {
      const rawExt = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const ext = rawExt || (file.type.includes("pdf") ? "pdf" : "jpg");
      const safeId = (transactionId || "anon").replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        });
      if (upErr) throw upErr;
      // Store the storage path; admins generate a signed URL on demand.
      if (transactionId) {
        try {
          await supabase.rpc("attach_payment_proof", {
            _transaction_id: transactionId,
            _proof_url: path,
          });
        } catch (rpcErr) {
          console.warn("attach_payment_proof failed (upload ok):", rpcErr);
        }
      }
      setDone(true);
      toast.success("Comprovante enviado! Vamos agilizar a liberação do seu pedido.");
    } catch (err: any) {
      console.error("upload proof error:", err);
      const msg = err?.message || err?.error_description || "Falha ao enviar comprovante. Tente novamente.";
      toast.error(msg);
    } finally {
      setUploading(false);
      // permite reanexar se necessário
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border-2 p-5 text-center" style={{ borderColor: "#ff4747", backgroundColor: "#ff47471a" }}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: "#ff4747" }}>
        <Upload className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-extrabold text-foreground mb-1">Já pagou? Envie o comprovante</h3>
      <p className="text-xs text-muted-foreground mb-4 px-2">
        Se o sistema demorar para confirmar, anexe aqui o print/PDF do Pix para agilizar a liberação do seu pedido.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={uploading || done}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-70"
        style={{ backgroundColor: "#ff4747" }}
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
        ) : done ? (
          <><Check className="h-4 w-4" /> Comprovante enviado</>
        ) : (
          <><Upload className="h-4 w-4" /> ANEXAR COMPROVANTE</>
        )}
      </button>
    </div>
  );
};

export default UploadProof;