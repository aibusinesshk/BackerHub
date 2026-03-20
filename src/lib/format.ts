export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatMarkup(markup: number): string {
  return `${markup.toFixed(2)}x`;
}

export function formatDate(dateStr: string, locale: string = 'en'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const localeMap: Record<string, string> = {
    'zh-TW': 'zh-TW',
    'zh-HK': 'zh-HK',
    en: 'en-US',
  };
  return date.toLocaleDateString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
