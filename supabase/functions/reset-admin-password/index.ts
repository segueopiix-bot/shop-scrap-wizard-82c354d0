import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*" };
Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return new Response(JSON.stringify(data.users.map(u => ({ id: u.id, email: u.email }))), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
