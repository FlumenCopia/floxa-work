/**
 * FLOXA Work — Backend Currency Utilities
 * ISO 4217 validation, formatting, and conversion standards.
 */

export const SUPPORTED_CURRENCIES: Record<string, { code: string; symbol: string; decimals: number }> = {
  INR: { code: 'INR', symbol: '₹', decimals: 2 },
  USD: { code: 'USD', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2 },
};

export function isValidCurrency(code?: string): boolean {
  if (!code) return false;
  return Boolean(SUPPORTED_CURRENCIES[code.toUpperCase().trim()]);
}

export function sanitizeCurrency(code?: string, defaultCurrency: string = 'USD'): string {
  if (!code) return defaultCurrency;
  const upper = code.toUpperCase().trim();
  return SUPPORTED_CURRENCIES[upper] ? upper : defaultCurrency;
}

export function getCurrencySymbol(code: string = 'USD'): string {
  const upper = (code || 'USD').toUpperCase().trim();
  return SUPPORTED_CURRENCIES[upper]?.symbol || upper;
}

export function formatCurrencyServer(amount: number, code: string = 'USD'): string {
  const symbol = getCurrencySymbol(code);
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedNumber} ${code}`;
}

