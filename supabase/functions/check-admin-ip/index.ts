// Server-side IP allowlist check for the admin panel.
// Public (no JWT) — returns { allowed: boolean, ip: string }.
const ALLOWED_IPS = new Set<string>([
  "187.73.199.177",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const xff = req.headers.get("x-forwarded-for") || "";
  const realIp = req.headers.get("x-real-ip") || "";
  // x-forwarded-for can be a comma-separated chain; first entry = original client
  const ip = (xff.split(",")[0] || realIp || "").trim();

  const allowed = ALLOWED_IPS.has(ip);

  return new Response(JSON.stringify({ allowed, ip }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
