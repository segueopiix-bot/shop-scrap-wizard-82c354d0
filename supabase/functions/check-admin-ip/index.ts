// Server-side IP allowlist check for the admin panel.
// Public (no JWT) — returns { allowed: boolean, ip: string }.
const ALLOWED_IPS = [
  "187.73.199.177",
  "187.73.196.224",
  "187.73.203.157",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const xff = req.headers.get("x-forwarded-for") || "";
  const realIp = req.headers.get("x-real-ip") || "";
  const clientIp = (xff.split(",")[0] || realIp || "").trim();

  console.log(`Checking IP: "${clientIp}" against list:`, ALLOWED_IPS);

  // Use a more robust check by trimming and lowercasing just in case
  const isAllowed = ALLOWED_IPS.some(allowedIp => 
    clientIp === allowedIp.trim()
  );

  return new Response(JSON.stringify({ allowed: isAllowed, ip: clientIp }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
