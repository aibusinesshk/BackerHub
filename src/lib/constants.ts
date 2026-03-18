export const SITE_NAME = 'BackerHub';
export const SITE_TAGLINE = 'Back Players. Share Victories.';
export const PLATFORM_FEE_PERCENT = 2;

export const NAV_LINKS = [
  { href: '/marketplace', labelKey: 'nav.marketplace' },
  { href: '/about', labelKey: 'nav.about' },
] as const;

export const PAYMENT_METHODS = {
  taiwan: [
    { id: 'ecpay', name: 'ECPay', nameZh: '綠界' },
    { id: 'newebpay', name: 'NewebPay', nameZh: '藍新' },
    { id: 'linepay', name: 'LINE Pay', nameZh: 'LINE Pay' },
    { id: 'jkopay', name: 'JKoPay', nameZh: '街口支付' },
    { id: 'bank-tw', name: 'Bank Transfer', nameZh: '銀行轉帳' },
  ],
  hongkong: [
    { id: 'alipayhk', name: 'AlipayHK', nameZh: '支付寶香港' },
    { id: 'octopus', name: 'Octopus', nameZh: '八達通' },
    { id: 'payme', name: 'PayMe', nameZh: 'PayMe' },
    { id: 'fps', name: 'FPS', nameZh: '轉數快' },
    { id: 'wechatpay', name: 'WeChat Pay', nameZh: '微信支付' },
  ],
  international: [
    { id: 'visa', name: 'Visa', nameZh: 'Visa' },
    { id: 'mastercard', name: 'Mastercard', nameZh: 'Mastercard' },
    { id: 'jcb', name: 'JCB', nameZh: 'JCB' },
    { id: 'btc', name: 'Bitcoin', nameZh: '比特幣' },
    { id: 'eth', name: 'Ethereum', nameZh: '以太幣' },
    { id: 'usdt', name: 'USDT', nameZh: 'USDT' },
  ],
} as const;

// Wallet limits
export const MIN_DEPOSIT = 100; // Minimum deposit in base currency units
export const MAX_DEPOSIT = 1000000; // Maximum single deposit
export const MIN_WITHDRAWAL = 100; // Minimum withdrawal
export const MAX_WITHDRAWAL = 500000; // Maximum single withdrawal
export const MAX_PENDING_WITHDRAWALS = 3; // Max concurrent pending withdrawals

// Bank details for receiving deposits (Taiwan)
export const PLATFORM_BANK_DETAILS = {
  bankName: '國泰世華銀行',
  bankNameEn: 'Cathay United Bank',
  bankCode: '013',
  accountNumber: '0000-0000-0000-0000', // TODO: Replace with real account
  accountHolder: 'BackerHub Co., Ltd.',
  accountHolderZh: 'BackerHub 有限公司',
} as const;

// Taiwan common banks for withdrawal
export const TW_BANKS = [
  { code: '004', name: '台灣銀行', nameEn: 'Bank of Taiwan' },
  { code: '005', name: '土地銀行', nameEn: 'Land Bank' },
  { code: '006', name: '合作金庫', nameEn: 'TCB Bank' },
  { code: '007', name: '第一銀行', nameEn: 'First Bank' },
  { code: '008', name: '華南銀行', nameEn: 'Hua Nan Bank' },
  { code: '009', name: '彰化銀行', nameEn: 'CHB' },
  { code: '012', name: '台北富邦', nameEn: 'Taipei Fubon' },
  { code: '013', name: '國泰世華', nameEn: 'Cathay United' },
  { code: '017', name: '兆豐銀行', nameEn: 'Mega Bank' },
  { code: '048', name: '王道銀行', nameEn: 'O-Bank' },
  { code: '081', name: '匯豐銀行', nameEn: 'HSBC' },
  { code: '808', name: '玉山銀行', nameEn: 'E.SUN Bank' },
  { code: '812', name: '台新銀行', nameEn: 'Taishin Bank' },
  { code: '822', name: '中信銀行', nameEn: 'CTBC Bank' },
] as const;
