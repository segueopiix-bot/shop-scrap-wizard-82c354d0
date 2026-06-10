// Utmify / Meta Ads pixel event helpers
// The pixels are loaded globally via index.html

declare global {
  interface Window {
    pixelId?: string;
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    utmify?: {
      track?: (event: string, data?: Record<string, any>) => void;
    };
    pintrk?: (...args: any[]) => void;
    ttq?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
}

export function trackPageView() {
  try {
    window.fbq?.('track', 'PageView');
  } catch (e) {
    console.warn('Tracking PageView failed', e);
  }
}

function waitForFbq(callback: () => void, retries = 10) {
  if (window.fbq) {
    callback();
  } else if (retries > 0) {
    setTimeout(() => waitForFbq(callback, retries - 1), 300);
  } else {
    console.warn('fbq not available after retries');
  }
}

export function trackInitiateCheckout(value?: number, items?: Array<{ name: string; quantity: number; price: number }>) {
  try {
    waitForFbq(() => {
      window.fbq?.('track', 'InitiateCheckout', {
        value,
        currency: 'BRL',
        content_type: 'product',
        contents: items?.map(i => ({ id: i.name, quantity: i.quantity })),
      });
      console.log('InitiateCheckout (Meta) fired', { value });
    });
    window.gtag?.('event', 'begin_checkout', {
      currency: 'BRL',
      value,
      items: items?.map(i => ({ item_name: i.name, quantity: i.quantity, price: i.price })),
    });
  } catch (e) {
    console.warn('Tracking InitiateCheckout failed', e);
  }
}

export function trackPurchase(value: number, items?: Array<{ name: string; quantity: number; price: number }>) {
  try {
    // 1. Meta (Facebook)
    window.fbq?.('track', 'Purchase', {
      value,
      currency: 'BRL',
      content_type: 'product',
      contents: items?.map(i => ({ id: i.name, quantity: i.quantity })),
    });

    // 2. Google Analytics
    window.gtag?.('event', 'purchase', {
      currency: 'BRL',
      value,
      transaction_id: `txn_${Date.now()}`,
      items: items?.map(i => ({ item_name: i.name, quantity: i.quantity, price: i.price })),
    });

    // 3. TikTok
    window.ttq?.track('CompletePayment', {
      contents: items?.map(i => ({
        content_name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      value,
      currency: 'BRL',
    });

    // 4. Pinterest
    window.pintrk?.('track', 'checkout', {
      value,
      order_quantity: items?.reduce((acc, i) => acc + i.quantity, 0),
      currency: 'BRL'
    });

    console.log('Purchase events fired (Meta, GA4, TikTok, Pinterest)', { value });
  } catch (e) {
    console.warn('Tracking Purchase failed', e);
  }
}

export function trackGoogleAdsPurchase(value: number, transactionId?: string) {
  try {
    const txnId = transactionId || `txn_${Date.now()}`;
    window.gtag?.('event', 'conversion', {
      send_to: 'AW-18159074501/NRZSCKuqlawcEMX59dJD',
      value,
      currency: 'BRL',
      transaction_id: txnId,
    });
    window.gtag?.('event', 'conversion', {
      send_to: 'AW-18166029882/RMy_CICk660cELq8ntZD',
      value,
      currency: 'BRL',
      transaction_id: txnId,
    });
    console.log('Google Ads conversion fired', { value, transactionId: txnId });
  } catch (e) {
    console.warn('Tracking Google Ads Purchase failed', e);
  }
}


