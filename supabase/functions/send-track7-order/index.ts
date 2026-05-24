import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TRACK7_API_URL = "https://track7.app/api/v1/orders";

// Itens internos do checkout que NÃO devem ir para a Track7
const EXCLUDED_PATTERNS = [
  /ajuste de valor do pedido/i,
  /ajuste de taxa de envio/i,
  /taxa de envio/i,
  /correios/i,
];

function isExcludedItem(p: any) {
  const name = String(p?.name || p?.title || p?.product_name || '').trim();
  if (!name) return false;
  return EXCLUDED_PATTERNS.some((re) => re.test(name));
}

const onlyDigits = (v: any) => String(v || '').replace(/\D/g, '');

async function sendOne(admin: any, order: any, apiKey: string) {
  const s = order.shipping || {};
  const items = (order.items || [])
    .filter((p: any) => !isExcludedItem(p))
    .map((p: any) => ({
      name: String(p.name || p.title || 'Produto'),
      quantity: Number(p.quantity || p.qty || 1),
      price: Number(p.price || 0),
    }));

  if (items.length === 0) {
    return { ok: false, status: 0, response: { error: 'nenhum produto válido para enviar' } };
  }

  const total = items.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0);

  const payload = {
    transaction_id: String(order.transaction_id),
    customer: {
      name: order.customer_name || '',
      email: order.customer_email || '',
      phone: onlyDigits(order.customer_phone),
      document: onlyDigits(order.customer_document),
    },
    address: {
      street: s.street || s.address || '',
      number: String(s.number || 'S/N'),
      complement: s.complement || '',
      neighborhood: s.neighborhood || s.district || '',
      city: s.city || '',
      state: String(s.state || '').toUpperCase().slice(0, 2),
      zipcode: onlyDigits(s.zipcode || s.zipCode || s.cep || s.postalCode),
    },
    products: items,
    total: Number(total.toFixed(2)),
  };

  const res = await fetch(TRACK7_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }

  console.log(`Track7 [${order.transaction_id}]:`, res.status, text);

  if (res.ok) {
    await admin.from('orders')
      .update({ track7_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }

  return { ok: res.ok, status: res.status, response: body, sent: payload };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const isInternal = token === serviceKey;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceKey,
    );

    if (!isInternal) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData, error: userErr } = await userClient.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: roles } = await admin
        .from('user_roles').select('role').eq('user_id', userData.user.id);
      if (!(roles || []).some((r: any) => r.role === 'admin')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    const TRACK7_API_KEY = Deno.env.get('TRACK7_API_KEY');
    if (!TRACK7_API_KEY) {
      return new Response(JSON.stringify({ error: 'TRACK7_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json().catch(() => ({}));
    const { orderId, bulk, dayStart, dayEnd } = payload;

    // BULK: envia todos os pedidos pagos ainda não enviados
    if (bulk) {
      let query = admin
        .from('orders')
        .select('*')
        .eq('status', 'paid')
        .is('track7_sent_at', null);

      if (dayStart && dayEnd) {
        // Filtra por paid_at OU created_at no intervalo do dia
        query = query.or(
          `and(paid_at.gte.${dayStart},paid_at.lte.${dayEnd}),and(paid_at.is.null,created_at.gte.${dayStart},created_at.lte.${dayEnd})`
        );
      }

      const { data: pendingOrders, error: listErr } = await query
        .order('created_at', { ascending: true })
        .limit(500);

      if (listErr) {
        return new Response(JSON.stringify({ ok: false, error: listErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any[] = [];
      let success = 0;
      let failed = 0;
      for (const o of (pendingOrders || [])) {
        try {
          const r = await sendOne(admin, o, TRACK7_API_KEY);
          if (r.ok) success++; else failed++;
          results.push({ orderId: o.id, transaction_id: o.transaction_id, ...r });
        } catch (e) {
          failed++;
          results.push({ orderId: o.id, ok: false, error: String(e) });
        }
      }

      return new Response(JSON.stringify({
        ok: true, bulk: true,
        total: (pendingOrders || []).length,
        success, failed, results,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ÚNICO
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: fetchErr } = await admin
      .from('orders').select('*').eq('id', orderId).maybeSingle();
    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendOne(admin, order, TRACK7_API_KEY);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-track7-order error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
