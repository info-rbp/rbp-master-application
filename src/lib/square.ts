import crypto from 'node:crypto';

const squareApiVersion = '2025-01-23';

function getSquareApiBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com/v2'
    : 'https://connect.squareupsandbox.com/v2';
}

function getAccessToken() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Square access token is not configured.');
  }
  return token;
}

async function squareRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getSquareApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      'Square-Version': squareApiVersion,
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & { errors?: Array<{ detail?: string }> };
  if (!response.ok) {
    const detail = body.errors?.map((error) => error.detail).filter(Boolean).join(', ');
    throw new Error(detail || `Square request failed (${response.status}).`);
  }

  return body;
}

export async function createSquareSubscriptionPaymentLink(input: {
  idempotencyKey: string;
  subscriptionPlanVariationId: string;
  locationId: string;
  customerId?: string;
  checkoutRedirectUrl?: string;
  metadata: Record<string, unknown>;
}) {
  const payload: Record<string, unknown> = {
    idempotency_key: input.idempotencyKey,
    quick_pay: {
      name: 'Membership Subscription',
      location_id: input.locationId,
      price_money: {
        amount: 100,
        currency: 'USD',
      },
    },
    checkout_options: {
      redirect_url: input.checkoutRedirectUrl,
      allow_tipping: false,
      custom_fields: [],
      subscription_plan_id: input.subscriptionPlanVariationId,
    },
    pre_populated_data: {
      buyer_email: undefined,
    },
    payment_note: JSON.stringify(input.metadata),
  };

  if (input.customerId) {
    payload.checkout_options = {
      ...(payload.checkout_options as Record<string, unknown>),
      customer_id: input.customerId,
    };
  }

  const response = await squareRequest<{ payment_link?: { id?: string; url?: string } }>('/online-checkout/payment-links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: response.payment_link?.id,
    url: response.payment_link?.url,
  };
}

export function verifySquareWebhookSignature(input: {
  body: string;
  signature: string | null;
  notificationUrl: string;
}) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey || !input.signature) return false;
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(input.notificationUrl + input.body);
  const digest = hmac.digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(input.signature));
}

export function resolveSquareLocationId(planLocationId?: string | null) {
  return planLocationId || process.env.SQUARE_LOCATION_ID || '';
}
