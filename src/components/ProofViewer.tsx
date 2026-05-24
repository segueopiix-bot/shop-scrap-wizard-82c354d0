import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  /** Either a storage path inside the payment-proofs bucket, or a full URL (legacy rows). */
  url: string;
}

export default function ProofViewer({ url }: Props) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isFullUrl = /^https?:\/\//i.test(url);

  useEffect(() => {
    if (!open) return;
    if (isFullUrl) {
      setSignedUrl(url);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(url, 60 * 10)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          console.error("signed url error", error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, url, isFullUrl]);

  const effective = signedUrl || "";
  const isPdf = /\.pdf($|\?)/i.test(effective);

  const handleDownload = async () => {
    if (!effective) return;
    try {
      const res = await fetch(effective);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = effective.split("/").pop()?.split("?")[0] || "comprovante";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(effective, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
      >
        <FileText className="w-3 h-3" /> Ver
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante de pagamento</DialogTitle>
          </DialogHeader>
          <div className="w-full max-h-[70vh] overflow-auto rounded border bg-muted/30 flex items-center justify-center">
            {loading || !effective ? (
              <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : isPdf ? (
              <iframe src={effective} className="w-full h-[70vh]" title="Comprovante PDF" />
            ) : (
              <img src={effective} alt="Comprovante" className="max-w-full h-auto"  loading="lazy"/>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!effective}
              onClick={() => effective && window.open(effective, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> Abrir em nova aba
            </Button>
            <Button size="sm" disabled={!effective} onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
