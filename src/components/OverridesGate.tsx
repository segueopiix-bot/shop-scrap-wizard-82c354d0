import { useEffect, useState } from "react";
import { loadAndApplyOverrides, overridesAreLoaded } from "@/lib/productOverrides";

interface Props {
  children: React.ReactNode;
}

/**
 * Loads pricing/name/variant overrides from the backend BEFORE rendering
 * the app, so a hard refresh on any page always shows the latest admin data
 * (not the stale static catalog).
 */
const OverridesGate = ({ children }: Props) => {
  const [ready, setReady] = useState(overridesAreLoaded());

  useEffect(() => {
    if (ready) return;
    loadAndApplyOverrides()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#29ABE2] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
};

export default OverridesGate;
