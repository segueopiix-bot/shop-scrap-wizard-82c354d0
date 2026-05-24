import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "lgpd_cookie_consent";

const CookieConsent = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const decide = (value: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] sm:px-4 sm:pb-4 animate-in slide-in-from-bottom-4 fade-in">
      <div className="mx-auto max-w-3xl border-t border-border bg-background p-4 shadow-2xl sm:rounded-xl sm:border sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Sua privacidade importa
                </h3>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  Conforme a LGPD (Lei 13.709/2018)
                </p>
              </div>
              <button
                onClick={() => decide("essential")}
                aria-label="Fechar"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Usamos cookies para fazer o site funcionar, medir desempenho e personalizar ofertas.
              Você decide o que aceitar — pode mudar depois em{" "}
              <Link to="/paginas/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
                Privacidade
              </Link>
              .
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => decide("essential")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:text-sm"
              >
                Recusar opcionais
              </button>
              <button
                onClick={() => decide("all")}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:text-sm"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;