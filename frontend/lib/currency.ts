/**
 * FLOXA Work — Currency & International Monetary Standards Engine
 * Complies with ISO 4217 standards and locale-aware monetary formatting.
 * Strictly non-custodial: conversions are approximate display estimates only.
 */

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMeta> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
};

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) — UAE Dirham' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) — Australian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) — Singapore Dollar' },
];

// Indicative rates relative to USD (1.0 USD baseline) for approximate client/talent display
const INDICATIVE_USD_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  CAD: 1.38,
  AUD: 1.54,
  SGD: 1.34,
};

/**
 * Get safe currency symbol from ISO code.
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const cleanCode = (currency || 'USD').toUpperCase().trim();
  return SUPPORTED_CURRENCIES[cleanCode]?.symbol || cleanCode;
}

/**
 * Format monetary amount with locale-aware Intl.NumberFormat.
 * Handles NaN, null, undefined, negative values, and zero safely.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD',
  options?: {
    compact?: boolean;
    hideDecimals?: boolean;
    showCode?: boolean;
  }
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const cleanCode = (currency || 'USD').toUpperCase().trim();
  const meta = SUPPORTED_CURRENCIES[cleanCode] || {
    code: cleanCode,
    symbol: cleanCode,
    locale: 'en-US',
    decimals: 2,
  };

  if (isNaN(numericAmount) || amount === null || amount === undefined) {
    return `${meta.symbol}0`;
  }

  try {
    const formatter = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: options?.hideDecimals || numericAmount % 1 === 0 ? 0 : meta.decimals,
      maximumFractionDigits: options?.hideDecimals ? 0 : meta.decimals,
      notation: options?.compact ? 'compact' : 'standard',
    });

    let formatted = formatter.format(numericAmount);
    if (options?.showCode && !formatted.includes(meta.code)) {
      formatted = `${formatted} ${meta.code}`;
    }
    return formatted;
  } catch {
    // Fallback if browser Intl locale fails
    const fixed = options?.hideDecimals || numericAmount % 1 === 0
      ? Math.round(numericAmount).toLocaleString('en-US')
      : numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${meta.symbol}${fixed}${options?.showCode ? ` ${meta.code}` : ''}`;
  }
}

/**
 * Transparent approximate conversion for display preferences.
 * Does NOT alter contractual value.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): {
  amount: number;
  formatted: string;
  rate: number;
  isApproximate: boolean;
} {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();

  if (from === to) {
    return {
      amount,
      formatted: formatCurrency(amount, from),
      rate: 1.0,
      isApproximate: false,
    };
  }

  const rateFrom = INDICATIVE_USD_RATES[from] || 1.0;
  const rateTo = INDICATIVE_USD_RATES[to] || 1.0;

  // Convert via USD bridge
  const usdAmount = amount / rateFrom;
  const converted = usdAmount * rateTo;
  const rate = rateTo / rateFrom;

  return {
    amount: Math.round(converted * 100) / 100,
    formatted: `~${formatCurrency(converted, to)}`,
    rate: Math.round(rate * 10000) / 10000,
    isApproximate: true,
  };
}

