import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FREEPAY_API_URL = "https://api.freepaybrasil.com/v1/payment-transaction/create";
const BLACKCAT_API_URL = "https://api.blackcatpagamentos.com/v1/transactions";
const IRONPAY_API_URL = "https://api.ironpayapp.com.br/api/public/v1/transactions";
const SKALEPAY_API_URL = "https://api.conta.skalepay.com.br/v1/transactions";
const AVENPAYMENTS_API_URL = "https://api.avenpayments.com/v1/payment";
const KLIVOPAY_API_URL = "https://api.klivopay.com.br/api/public/v1/transactions";
const KLIVOPAY_OFFER_HASH = "6wbegywf4e";
const KLIVOPAY_PRODUCT_HASH = "b0uk6yxoiw";
const IRONPAY_PRODUCT_HASH = "dhax2fql90";
const IRONPAY_OFFER_HASH = "uqftytyrci";
const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
const PUSHCUT_PENDING_URL = "https://api.pushcut.io/kXDRvo3PGVEtZP-rSrB8Q/notifications/Pendente%20Comercial";

async function sendPushcut(url: string, title: string, text: string) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text }),
    });
    console.log('Pushcut response:', res.status, await res.text());
  } catch (e) {
    console.error('Pushcut send failed:', e);
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

async function sendToUtmify(data: {
  orderId: string;
  status: string;
  customer: any;
  items: any[];
  totalInCents: number;
  trackingParameters?: any;
  approvedDate?: string | null;
}) {
  const UTMIFY_API_TOKEN = Deno.env.get('UTMIFY_API_TOKEN');
  if (!UTMIFY_API_TOKEN) {
    console.warn('UTMIFY_API_TOKEN not configured, skipping');
    return;
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const tp = data.trackingParameters || {};

  const payload = {
    orderId: data.orderId,
    platform: 'GSuplementos',
    paymentMethod: 'pix',
    status: data.status,
    createdAt: now,
    approvedDate: data.approvedDate || null,
    refundedAt: null,
    customer: {
      name: data.customer?.name || '',
      email: data.customer?.email || '',
      phone: data.customer?.phone || null,
      document: data.customer?.cpf || data.customer?.document || null,
      country: 'BR',
    },
    products: (data.items || []).map((p: any, idx: number) => ({
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
      totalPriceInCents: data.totalInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: data.totalInCents,
      currency: 'BRL',
    },
  };

  try {
    console.log('Sending to Utmify:', JSON.stringify(payload));
    const res = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('Utmify response:', res.status, text);
  } catch (e) {
    console.error('Utmify send failed:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, customer, items, shipping, trackingParameters } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Bloqueio por IP
    const clientIp =
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      '';
    if (clientIp) {
      const { data: blocked } = await supabaseAdmin
        .from('blocked_ips').select('ip').eq('ip', clientIp).maybeSingle();
      if (blocked) {
        console.log('Blocked IP attempt:', clientIp);
        return new Response(
          JSON.stringify({ error: 'Não foi possível processar o pedido. Entre em contato com o suporte.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }


    // Gateway selecionado no painel admin (app_settings.active_gateway)
    let activeGateway = 'freepay';
    try {
      const { data: gwSetting } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'active_gateway')
        .maybeSingle();
      if (gwSetting?.value) {
        activeGateway = String(gwSetting.value).replace(/"/g, '');
      }
    } catch (e) {
      console.error('Failed to load active_gateway, fallback freepay', e);
    }
    
    // Low-balance protection: if amount is very low (e.g. testing) or gateway fails repeatedly,
    // we could implement rotation here, but for now we trust the admin choice.
    console.log(`Using gateway from admin settings: ${activeGateway} (amount R$${amount})`);

    const phoneDigits = (customer.phone || '').replace(/\D/g, '');
    const cpfDigits = (customer.cpf || '').replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('+') ? phoneDigits : `+55${phoneDigits}`;
    const ip = clientIp || "187.22.45.90";

    let apiUrl = FREEPAY_API_URL;
    let authHeader = '';
    let ironpayMode = false;
    let skalepayMode = false;
    let avenMode = false;
    let klivopayMode = false;

    if (activeGateway === 'ironpay') {
      const IRONPAY_API_TOKEN = Deno.env.get('IRONPAY_API_TOKEN');
      if (!IRONPAY_API_TOKEN) throw new Error('IRONPAY_API_TOKEN not configured');
      apiUrl = `${IRONPAY_API_URL}?api_token=${encodeURIComponent(IRONPAY_API_TOKEN)}`;
      ironpayMode = true;
    } else if (activeGateway === 'blackcat') {
      const BLACKCAT_API_KEY = Deno.env.get('BLACKCAT_API_KEY');
      if (!BLACKCAT_API_KEY) throw new Error('BLACKCAT_API_KEY not configured');
      apiUrl = BLACKCAT_API_URL;
      authHeader = `Basic ${btoa(`${BLACKCAT_API_KEY}:x`)}`;
    } else if (activeGateway === 'skalepay') {
      const SKALEPAY_SECRET_KEY = Deno.env.get('SKALEPAY_SECRET_KEY');
      if (!SKALEPAY_SECRET_KEY) throw new Error('SKALEPAY_SECRET_KEY not configured');
      apiUrl = SKALEPAY_API_URL;
      authHeader = `Basic ${btoa(`${SKALEPAY_SECRET_KEY}:x`)}`;
      skalepayMode = true;
    } else if (activeGateway === 'avenpayments') {
      const AVENPAYMENTS_API_KEY = Deno.env.get('AVENPAYMENTS_API_KEY');
      if (!AVENPAYMENTS_API_KEY) throw new Error('AVENPAYMENTS_API_KEY not configured');
      apiUrl = AVENPAYMENTS_API_URL;
      authHeader = `Bearer ${AVENPAYMENTS_API_KEY}`;
      avenMode = true;
    } else if (activeGateway === 'klivopay') {
      const KLIVOPAY_API_TOKEN = Deno.env.get('KLIVOPAY_API_TOKEN');
      if (!KLIVOPAY_API_TOKEN) throw new Error('KLIVOPAY_API_TOKEN not configured');
      apiUrl = KLIVOPAY_API_URL;
      klivopayMode = true;
    } else {
      const FREEPAY_PUBLIC_KEY = Deno.env.get('FREEPAY_PUBLIC_KEY');
      const FREEPAY_SECRET_KEY = Deno.env.get('FREEPAY_SECRET_KEY');
      if (!FREEPAY_PUBLIC_KEY || !FREEPAY_SECRET_KEY) {
        throw new Error('FREEPAY credentials not configured');
      }
      authHeader = `Basic ${btoa(`${FREEPAY_PUBLIC_KEY}:${FREEPAY_SECRET_KEY}`)}`;
    }

    const amountCents = Math.round(amount * 100);

    const webhookByGateway: Record<string, string> = {
      ironpay: 'ironpay-webhook',
      skalepay: 'skalepay-webhook',
      freepay: 'freepay-webhook',
      blackcat: 'freepay-webhook',
      avenpayments: 'avenpayments-webhook',
      klivopay: 'klivopay-webhook',
    };
    const postbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${webhookByGateway[activeGateway] || 'ironpay-webhook'}`;

    // Disguise product name for Skale/FreePay when item is in "Suplementos" category
    const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    const disguiseName = (item: any): string => {
      const cat = String(item?.category || '').toLowerCase();
      if ((activeGateway === 'skalepay' || activeGateway === 'freepay' || activeGateway === 'blackcat')
          && cat.includes('suplemento')) {
        return `Suplementos-saude-beleza#${randomCode()}`;
      }
      return item.name;
    };

    const payload: any = ironpayMode ? {
      amount: amountCents,
      payment_method: "pix",
      offer_hash: IRONPAY_OFFER_HASH,
      product_hash: IRONPAY_PRODUCT_HASH,
      postback_url: postbackUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: formattedPhone.replace(/\D/g, ''),
        document: cpfDigits,
      },
      cart: items.map((item: any) => ({
        product_hash: IRONPAY_PRODUCT_HASH,
        offer_hash: IRONPAY_OFFER_HASH,
        title: item.name,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true,
        operation_type: 1,
      })),
      tracking: trackingParameters || null,
    } : skalepayMode ? {
      amount: amountCents,
      paymentMethod: "pix",
      postbackUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: formattedPhone,
        document: {
          type: cpfDigits.length > 11 ? "cnpj" : "cpf",
          number: cpfDigits,
        },
      },
      items: items.map((item: any) => ({
        title: disguiseName(item),
        unitPrice: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true,
      })),
      pix: { expiresInDays: 1 },
      ip,
      metadata: JSON.stringify({ source: 'checkout', orderRef: `order-${Date.now()}` }),
    } : avenMode ? {
      amount: amountCents,
      currency: "BRL",
      method: "PIX",
      description: `Pedido ${Date.now()}`,
      externalRef: `order-${Date.now()}`,
      notificationUrl: postbackUrl,
      payer: {
        name: customer.name,
        taxId: cpfDigits,
        email: customer.email,
        phone: phoneDigits,
      },
      items: items.map((item: any) => ({
        quantity: item.quantity,
        name: disguiseName(item),
        price: Math.round(item.price * 100),
        type: "PHYSICAL",
      })),
      delivery: {
        fee: 0,
        address: {
          name: customer.name,
          street: shipping?.street || shipping?.address || customer?.address || 'Rua Principal',
          number: shipping?.number || customer?.number || 'S/N',
          complement: shipping?.complement || customer?.complement || '',
          district: shipping?.neighborhood || shipping?.district || customer?.neighborhood || 'Centro',
          city: shipping?.city || customer?.city || 'São Paulo',
          state: shipping?.state || customer?.state || 'SP',
          zipCode: (shipping?.zipCode || shipping?.cep || shipping?.postalCode || customer?.cep || '01001000').toString().replace(/\D/g, ''),
          country: 'BR',
        },
      },
    } : klivopayMode ? {
      api_token: Deno.env.get('KLIVOPAY_API_TOKEN'),
      amount: amountCents,
      offer_hash: KLIVOPAY_OFFER_HASH,
      payment_method: "pix",
      postback_url: postbackUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: phoneDigits,
        document: cpfDigits,
      },
      cart: items.map((item: any) => ({
        title: disguiseName(item),
        name: disguiseName(item),
        quantity: item.quantity,
        price: Math.round(item.price * 100),
        unit_price: Math.round(item.price * 100),
        product_hash: KLIVOPAY_PRODUCT_HASH,
        operation_type: 1,
        tangible: false,
      })),
      tracking: trackingParameters || null,
    } : {
      amount: Math.round(amount * 100),
      payment_method: "pix",
      postbackUrl,
      postback_url: postbackUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: formattedPhone,
        document: {
          type: cpfDigits.length > 11 ? "cnpj" : "cpf",
          number: cpfDigits,
        },
      },
      items: items.map((item: any) => ({
        title: disguiseName(item),
        unit_price: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true,
      })),
      ip,
      metadata: { source: 'checkout', orderRef: `order-${Date.now()}` },
    };

    console.log(`Sending to ${activeGateway}:`, JSON.stringify(payload));

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authHeader) reqHeaders['Authorization'] = authHeader;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`${activeGateway} response:`, response.status, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'Resposta inválida do gateway' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: data?.message || 'Erro ao criar PIX', details: data }),
        { status: response.status >= 400 && response.status < 500 ? 400 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AvenPayments returns the PIX payload nested under `data` (e.g. { id, ..., data: { method, copypaste } }).
    // Other gateways may wrap the entire transaction under `data`. We need to handle both cases without
    // accidentally treating the inner PIX payload as the transaction itself.
    const looksLikeTransaction = (obj: any) =>
      obj && typeof obj === 'object' && (obj.id || obj.hash || obj.transactionId || obj.paymentId || obj.status);
    const transaction = looksLikeTransaction(data) ? data : (data?.data || data);
    const pix =
      transaction?.pix ||
      transaction?.pixData ||
      transaction?.payment?.pix ||
      (transaction?.data && !looksLikeTransaction(transaction.data) ? transaction.data : null) ||
      {};
    const transactionId = transaction?.hash || transaction?.id || transaction?.transactionId || transaction?.paymentId || `PIX-${Date.now()}`;
    const pixQrCode = pix?.qr_code || pix?.qrCode || pix?.pix_qr_code || pix?.qrcode || pix?.image || transaction?.pix_qr_code || "";
    const pixCopyPaste = pix?.copypaste || pix?.copy_paste || pix?.copyPaste || pix?.emv || pix?.payload || pix?.brCode || pix?.brcode || pix?.pix_qr_code || pix?.qrcode || transaction?.pix_copy_paste || transaction?.pix_qr_code || pixQrCode;
    console.log('Extracted PIX:', { transactionId, hasCopyPaste: !!pixCopyPaste, copyPastePreview: String(pixCopyPaste).slice(0, 40) });

    // Save order
    try {
      const fwd = req.headers.get('x-forwarded-for') || '';
      const customerIp = fwd.split(',')[0].trim()
        || req.headers.get('cf-connecting-ip')
        || req.headers.get('x-real-ip')
        || null;
      await supabaseAdmin.from('orders').insert({
        transaction_id: String(transactionId),
        gateway: activeGateway,
        status: 'pending',
        amount_cents: Math.round(amount * 100),
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_phone: customer?.phone,
        customer_document: customer?.cpf || customer?.document,
        customer_ip: customerIp,
        items,
        shipping,
        tracking_parameters: trackingParameters,
        pix_copy_paste: pixCopyPaste,
      });
    } catch (e) { console.error('order insert failed', e); }


    // Send "waiting_payment" (Pix gerado) to Utmify
    sendToUtmify({
      orderId: String(transactionId),
      status: 'waiting_payment',
      customer,
      items,
      totalInCents: Math.round(amount * 100),
      trackingParameters,
    });

    // Pushcut: PIX gerado
    sendPushcut(
      PUSHCUT_PENDING_URL,
      'PIX Gerado',
      `R$ ${(amount).toFixed(2).replace('.', ',')} • ${customer?.name || ''}`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        transactionId,
        pix: {
          qr_code: pixQrCode,
          copia_e_cola: pixCopyPaste,
          qr_code_base64: pix?.qr_code_base64 || '',
        },
        copyPasteCode: pixCopyPaste,
        qrCode: pixQrCode,
        qrCodeBase64: pix?.qr_code_base64 || '',
        status: transaction?.status || 'pending',
        amount: Math.round(amount * 100),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});