import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "logo_protection_enabled";
const SETTING_KEY = "logo_protection_enabled";
const AUTO_MODE_KEY = "logo_auto_mode";

function readCache(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(CACHE_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  } catch {
    return null;
  }
}

async function fetchProtectionAndAutoMode(): Promise<{ enabled: boolean; autoMode: boolean } | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [SETTING_KEY, AUTO_MODE_KEY]);
  if (!data) return null;
  const map = new Map(data.map((r: any) => [r.key, r.value]));
  return {
    enabled: map.get(SETTING_KEY) === "true",
    autoMode: map.get(AUTO_MODE_KEY) === "true",
  };
}

export function useLogoProtectionSetting(): boolean {
  // Default to false (disabled) — protection is opt-in via admin panel.
  const [enabled, setEnabled] = useState<boolean>(() => {
    const cached = readCache();
    return cached === null ? false : cached;
  });

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const applyResult = (res: { enabled: boolean; autoMode: boolean } | null) => {
      if (cancelled || !res) return;
      try {
        sessionStorage.setItem(CACHE_KEY, res.enabled ? "true" : "false");
      } catch {}
      setEnabled(res.enabled);

      if (res.autoMode && !interval) {
        interval = setInterval(async () => {
          const r = await fetchProtectionAndAutoMode();
          if (cancelled || !r) return;
          try {
            sessionStorage.setItem(CACHE_KEY, r.enabled ? "true" : "false");
          } catch {}
          setEnabled(r.enabled);
          if (!r.autoMode && interval) {
            clearInterval(interval);
            interval = null;
          }
        }, 10_000);
      }
    };

    fetchProtectionAndAutoMode().then(applyResult);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return enabled;
}

export function clearLogoProtectionCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}
