export const SITE_NAME = 'BackerHub';
export const SITE_TAGLINE = 'Back Players. Share Victories.';
export const PLATFORM_FEE_PERCENT = 2;

export const NAV_LINKS = [
  { href: '/marketplace', labelKey: 'nav.marketplace' },
  { href: '/about', labelKey: 'nav.about' },
] as const;

// Crypto payment methods
export const CRYPTO_COINS = [
  { id: 'usdt', name: 'USDT', nameZh: 'USDT', network: 'TRC-20', icon: '₮' },
  { id: 'usdc', name: 'USDC', nameZh: 'USDC', network: 'TRC-20', icon: '$' },
  { id: 'btc', name: 'Bitcoin', nameZh: '比特幣', network: 'BTC', icon: '₿' },
  { id: 'eth', name: 'Ethereum', nameZh: '以太幣', network: 'ERC-20', icon: 'Ξ' },
] as const;

// Payment badges shown on landing page and footer
export const PAYMENT_BADGES = ['USDT', 'USDC', 'Bitcoin', 'Ethereum'] as const;

// Platform wallet address for receiving deposits
export const PLATFORM_WALLET = {
  address: process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || 'TJYMpMCx4goDn6yWUnrSJaLb8uXtoFains',
  network: 'Tron (TRC-20)',
  networkShort: 'TRC-20',
} as const;

// Wallet limits (in USD)
export const MIN_DEPOSIT = 10;
export const MAX_DEPOSIT = 100000;
export const MIN_WITHDRAWAL = 10;
export const MAX_WITHDRAWAL = 50000;
export const MAX_PENDING_WITHDRAWALS = 3;
