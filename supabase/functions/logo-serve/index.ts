import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOGO_OFFICIAL_URL = "https://www.lojas-epoca.store/assets/full-logo-CBRmo0EX.png";
const LOGO_SECONDARY_URL = "https://i.ibb.co/rG5wx0fY/03d6063fdfe7dfe11c84d1a1619e51a90f0eaede.webp";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("forbidden", { status: 403, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("logo_tokens")
      .select("token, expires_at, metadata")
      .eq("token", token)
      .maybeSingle();

    if (error || !data || new Date(data.expires_at).getTime() <= Date.now()) {
      // Delete if exists (expired)
      if (data) await supabase.from("logo_tokens").delete().eq("token", token);
      return new Response("forbidden", { status: 403, headers: corsHeaders });
    }

    // Fetch the actual image
    const logoType = (data.metadata as any)?.type || "official";
    const logoToFetch = logoType === "secondary" ? LOGO_SECONDARY_URL : LOGO_OFFICIAL_URL;
    const imgRes = await fetch(logoToFetch);
    if (!imgRes.ok) {
      return new Response("upstream error", { status: 502, headers: corsHeaders });
    }
    const bytes = new Uint8Array(await imgRes.arrayBuffer());

    // Single-use: delete after serving
    await supabase.from("logo_tokens").delete().eq("token", token);

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
