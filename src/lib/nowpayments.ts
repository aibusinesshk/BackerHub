/**
 * NOWPayments API client for automated crypto payment processing.
 *
 * Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
 *
 * Flow:
 *  1. User initiates deposit → we create an invoice via NOWPayments API
 *  2. NOWPayments returns a unique pay_address for that invoice
 *  3. User sends crypto to pay_address
 *  4. NOWPayments sends IPN (webhook) when payment is confirmed
 *  5. We auto-credit the user's wallet balance
 */

const API_BASE = 'https://api.nowpayments.io/v1';

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error('NOWPAYMENTS_API_KEY is not configured');
  return key;
}

function getIpnSecret(): string {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) throw new Error('NOWPAYMENTS_IPN_SECRET is not configured');
  return secret;
}

// Map our coin IDs to NOWPayments currency codes
const COIN_MAP: Record<string, string> = {
  usdt: 'usdttrc20',   // USDT on Tron
  usdc: 'usdctrc20',   // USDC on Tron
  btc: 'btc',
  eth: 'eth',
};

export interface CreatePaymentParams {
  /** Amount in USD */
  priceAmount: number;
  /** Our internal coin id: usdt, usdc, btc, eth */
  payCurrency: string;
  /** Our internal order/reference ID */
  orderId: string;
  /** Description shown to user */
  orderDescription?: string;
  /** URL for IPN callback */
  ipnCallbackUrl: string;
}

export interface NowPaymentInvoice {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  expiration_estimate_date: string;
}

export interface NowPaymentStatus {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  outcome_amount: number;
  outcome_currency: string;
  purchase_id: string;
  updated_at: string;
}

/**
 * Create a payment via NOWPayments.
 * Returns a unique pay_address the user should send crypto to.
 */
export async function createPayment(params: CreatePaymentParams): Promise<NowPaymentInvoice> {
  const payCurrency = COIN_MAP[params.payCurrency];
  if (!payCurrency) {
    throw new Error(`Unsupported currency: ${params.payCurrency}`);
  }

  const res = await fetch(`${API_BASE}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription || `BackerHub deposit ${params.orderId}`,
      ipn_callback_url: params.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`NOWPayments API error (${res.status}): ${error}`);
  }

  return res.json();
}

/**
 * Check the status of an existing payment.
 */
export async function getPaymentStatus(paymentId: string): Promise<NowPaymentStatus> {
  const res = await fetch(`${API_BASE}/payment/${paymentId}`, {
    headers: { 'x-api-key': getApiKey() },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`NOWPayments status error (${res.status}): ${error}`);
  }

  return res.json();
}

/**
 * Get minimum payment amount for a given currency.
 */
export async function getMinimumAmount(currencyFrom: string): Promise<number> {
  const payCurrency = COIN_MAP[currencyFrom] || currencyFrom;
  const res = await fetch(
    `${API_BASE}/min-amount?currency_from=${payCurrency}&currency_to=usd`,
    { headers: { 'x-api-key': getApiKey() } }
  );

  if (!res.ok) return 0;
  const data = await res.json();
  return data.min_amount ?? 0;
}

/**
 * Verify IPN (Instant Payment Notification) webhook signature.
 *
 * NOWPayments signs the webhook body with HMAC-SHA512 using the IPN secret.
 * The signature is in the `x-nowpayments-sig` header.
 */
export async function verifyIpnSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = getIpnSecret();

  // Use Web Crypto API (available in Node 18+ and Edge runtime)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  // NOWPayments sorts the JSON keys before signing
  const sorted = sortObject(JSON.parse(rawBody));
  const signedData = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(JSON.stringify(sorted))
  );

  const computedSig = Array.from(new Uint8Array(signedData))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSig === signature;
}

/**
 * Recursively sort object keys (NOWPayments requirement for signature verification).
 */
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      const val = obj[key];
      result[key] =
        val && typeof val === 'object' && !Array.isArray(val)
          ? sortObject(val as Record<string, unknown>)
          : val;
      return result;
    }, {});
}

/** Payment statuses from NOWPayments */
export const PAYMENT_STATUSES = {
  WAITING: 'waiting',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  SENDING: 'sending',
  PARTIALLY_PAID: 'partially_paid',
  FINISHED: 'finished',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
} as const;

/**
 * Check if a payment status means the payment is fully completed.
 */
export function isPaymentComplete(status: string): boolean {
  return status === PAYMENT_STATUSES.FINISHED;
}

/**
 * Check if a payment is still in progress (not failed/expired).
 */
export function isPaymentPending(status: string): boolean {
  return [
    PAYMENT_STATUSES.WAITING,
    PAYMENT_STATUSES.CONFIRMING,
    PAYMENT_STATUSES.CONFIRMED,
    PAYMENT_STATUSES.SENDING,
  ].includes(status as any);
}
