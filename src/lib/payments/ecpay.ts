import crypto from 'crypto';

const ECPAY_MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || '2000132'; // Test merchant
const ECPAY_HASH_KEY = process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9';
const ECPAY_HASH_IV = process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS';
const ECPAY_API_URL = process.env.ECPAY_API_URL || 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

function dotNetUrlEncode(str: string): string {
  // ECPay uses .NET URL encoding (uppercase %XX, space as %20 not +)
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/%2d/gi, '-')
    .replace(/%5f/gi, '_')
    .replace(/%2e/gi, '.')
    .toLowerCase();
}

export function generateCheckMacValue(params: Record<string, string>): string {
  // 1. Sort params alphabetically by key
  const sortedKeys = Object.keys(params).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // 2. Build query string
  const queryString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

  // 3. Wrap with HashKey and HashIV
  const raw = `HashKey=${ECPAY_HASH_KEY}&${queryString}&HashIV=${ECPAY_HASH_IV}`;

  // 4. URL encode (.NET style)
  const encoded = dotNetUrlEncode(raw);

  // 5. SHA256 hash and uppercase
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

export function buildPaymentForm(
  amount: number,
  referenceNumber: string,
  returnUrl: string,
  clientBackUrl: string,
): { actionUrl: string; params: Record<string, string> } {
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const params: Record<string, string> = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: referenceNumber.replace(/-/g, '').substring(0, 20),
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: String(Math.round(amount)),
    TradeDesc: 'BackHub Wallet Deposit',
    ItemName: 'Wallet Deposit',
    ReturnURL: returnUrl,
    ClientBackURL: clientBackUrl,
    ChoosePayment: 'ALL',
    EncryptType: '1',
  };

  params.CheckMacValue = generateCheckMacValue(params);

  return {
    actionUrl: ECPAY_API_URL,
    params,
  };
}

export function verifyCallback(params: Record<string, string>): boolean {
  const receivedMac = params.CheckMacValue;
  if (!receivedMac) return false;

  // Remove CheckMacValue from params for verification
  const verifyParams = { ...params };
  delete verifyParams.CheckMacValue;

  const calculatedMac = generateCheckMacValue(verifyParams);
  return calculatedMac === receivedMac;
}
