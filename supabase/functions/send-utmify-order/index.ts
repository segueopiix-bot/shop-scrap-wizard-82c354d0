import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UTMIFY_API_TOKEN = Deno.env.get('UTMIFY_API_TOKEN');
    if (!UTMIFY_API_TOKEN) {
      throw new Error('UTMIFY_API_TOKEN not configured');
    }

    const body = await req.json();
    const {
      orderId,
      paymentMethod,
      status,
      customer,
      products,
      totalPriceInCents,
      trackingParameters,
    } = body;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const utmifyPayload = {
      orderId: orderId || `ORDER-${Date.now()}`,
      platform: 'GSuplementos',
      paymentMethod: paymentMethod || 'pix',
      status: status || 'waiting_payment',
      createdAt: now,
      approvedDate: status === 'paid' ? now : null,
      refundedAt: null,
      customer: {
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || null,
        document: customer?.cpf || customer?.document || null,
        country: 'BR',
      },
      products: (products || []).map((p: any, idx: number) => ({
        id: p.id || `product-${idx}`,
        name: p.name || '',
        planId: null,
        planName: null,
        quantity: p.quantity || 1,
        priceInCents: Math.round((p.price || 0) * 100),
      })),
      trackingParameters: {
        src: trackingParameters?.src || null,
        sck: trackingParameters?.sck || null,
        utm_source: trackingParameters?.utm_source || null,
        utm_campaign: trackingParameters?.utm_campaign || null,
        utm_medium: trackingParameters?.utm_medium || null,
        utm_content: trackingParameters?.utm_content || null,
        utm_term: trackingParameters?.utm_term || null,
      },
      commission: {
        totalPriceInCents: totalPriceInCents || 0,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalPriceInCents || 0,
        currency: 'BRL',
      },
    };

    console.log('Sending order to Utmify:', JSON.stringify(utmifyPayload));

    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(utmifyPayload),
    });

    const responseText = await response.text();
    console.log('Utmify response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Utmify API error: ${response.status} - ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending order to Utmify:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
