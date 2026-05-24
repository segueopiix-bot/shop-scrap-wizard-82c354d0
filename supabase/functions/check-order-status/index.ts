import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let transactionId = url.searchParams.get('transactionId');
    if (!transactionId && (req.method === 'POST')) {
      try {
        const body = await req.json();
        transactionId = body?.transactionId || body?.transaction_id || null;
      } catch { /* ignore */ }
    }
    if (!transactionId) {
      return new Response(JSON.stringify({ ok: false, error: 'transactionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('orders')
      .select('transaction_id, status, amount_cents, paid_at, items')
      .eq('transaction_id', String(transactionId))
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!data) {
      return new Response(JSON.stringify({ ok: true, status: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ok: true,
      status: data.status,
      paidAt: data.paid_at,
      amountCents: data.amount_cents,
      items: data.items,
      transactionId: data.transaction_id,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
