import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

type State = { status: "checking" } | { status: "allowed" } | { status: "blocked"; ip: string };

export default function AdminIpGate({ children }: Props) {
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-admin-ip");
        if (cancelled) return;
        if (error) {
          setState({ status: "blocked", ip: "desconhecido" });
          return;
        }
        if (data?.allowed) setState({ status: "allowed" });
        else setState({ status: "blocked", ip: data?.ip || "desconhecido" });
      } catch {
        if (!cancelled) setState({ status: "blocked", ip: "desconhecido" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.status === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="text-xl font-bold mb-2">Acesso bloqueado</h1>
          <p className="text-sm text-muted-foreground">
            Este painel está restrito a IPs autorizados.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Seu IP: <span className="font-mono">{state.ip}</span>
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
