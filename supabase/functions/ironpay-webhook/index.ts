import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
const PUSHCUT_APPROVED_URL = "https://api.pushcut.io/kXDRvo3PGVEtZP-rSrB8Q/notifications/Aprovado%20Merchant";
async function sendPushcutApproved(order: any) {
  try {
    const amount = ((order?.amount_cents || 0) / 100).toFixed(2).replace('.', ',');
    const res = await fetch(PUSHCUT_APPROVED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'PIX Aprovado',
        text: `R$ ${amount} • ${order?.customer_name || ''}`,
      }),
    });
    console.log('Pushcut approved:', res.status, await res.text());
  } catch (e) { console.error('Pushcut approved failed:', e); }
}

async function sendUtmifyPaid(order: any) {
  const UTMIFY_API_TOKEN = Deno.env.get('UTMIFY_API_TOKEN');
  if (!UTMIFY_API_TOKEN) return;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const createdAt = order.created_at
    ? new Date(order.created_at).toISOString().replace('T', ' ').slice(0, 19)
    : now;
  const tp = order.tracking_parameters || {};
  const payload = {
    orderId: order.transaction_id,
    platform: 'GSuplementos',
    paymentMethod: 'pix',
    status: 'paid',
    createdAt,
    approvedDate: now,
    refundedAt: null,
    customer: {
      name: order.customer_name || '',
      email: order.customer_email || '',
      phone: order.customer_phone || null,
      document: order.customer_document || null,
      country: 'BR',
    },
    products: (order.items || []).map((p: any, idx: number) => ({
      id: p.id || `product-${idx}`,
      name: p.name || '',
      planId: null,
      planName: null,
      quantity: p.quantity || 1,
      priceInCents: Math.round((p.price || 0) * 100),
    })),
    trackingParameters: {
      src: tp.src || null,
      sck: tp.sck || null,
      utm_source: tp.utm_source || null,
      utm_campaign: tp.utm_campaign || null,
      utm_medium: tp.utm_medium || null,
      utm_content: tp.utm_content || null,
      utm_term: tp.utm_term || null,
    },
    commission: {
      totalPriceInCents: order.amount_cents,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount_cents,
      currency: 'BRL',
    },
  };
  try {
    const res = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': UTMIFY_API_TOKEN },
      body: JSON.stringify(payload),
    });
    console.log('Utmify paid response:', res.status, await res.text());
  } catch (e) {
    console.error('Utmify paid failed:', e);
  }
}


async function maybeAutoSendTrack7(admin: any, order: any) {
  try {
    const { data: setting } = await admin
      .from('app_settings').select('value').eq('key', 'track7_auto_send').maybeSingle();
    const cfg: any = setting?.value;
    if (!cfg?.enabled || !cfg?.enabled_at) return;
    if (order.track7_sent_at) return;
    if (new Date(order.created_at) < new Date(cfg.enabled_at)) return;
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-track7-order`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ orderId: order.id }),
    });
    console.log('Track7 auto-send:', res.status, await res.text());
  } catch (e) { console.error('Track7 auto-send failed:', e); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('ironpay webhook payload:', JSON.stringify(body));

    const data = body?.data || body;
    const transactionId =
      data?.hash || data?.id || data?.transaction || body?.hash || body?.id;
    const status =
      data?.payment_status || data?.status || body?.payment_status || body?.status;

    if (!transactionId) {
      return new Response(JSON.stringify({ ok: false, error: 'missing transaction id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const paidStatuses = ['paid', 'approved', 'authorized', 'completed'];
    const isPaid = paidStatuses.includes(String(status).toLowerCase());

    if (isPaid) {
      const { data: updated, error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('transaction_id', String(transactionId))
        .select()
        .maybeSingle();

      if (error) {
        console.error('order update error:', error);
      } else if (updated) {
        await sendUtmifyPaid(updated);
        await sendPushcutApproved(updated);
        await maybeAutoSendTrack7(supabaseAdmin, updated);
      }
    } else {
      // Update status text but keep pending semantics
      await supabaseAdmin
        .from('orders')
        .update({ status: String(status || 'pending') })
        .eq('transaction_id', String(transactionId));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('webhook error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});