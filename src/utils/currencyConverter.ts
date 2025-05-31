import { CurrencyRates } from '../types';

/**
 * Convert an amount from source currency to target currency using rates.
 * - All rates are relative to a common base (e.g., USD).
 * - Example: If rates are { USD: 1, EUR: 0.93 }, 1 USD = 0.93 EUR.
 *
 * @param amount - The amount to convert.
 * @param from - Source currency code (e.g., 'USD').
 * @param to - Target currency code (e.g., 'EUR').
 * @param rates - Rates map (currency code -> rate as number).
 * @returns Converted amount (number).
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: CurrencyRates
): number {
  // Defensive: handle missing or zero rates
  if (
    typeof amount !== 'number' ||
    !from ||
    !to ||
    typeof rates[from] !== 'number' ||
    typeof rates[to] !== 'number' ||
    rates[from] === 0
  ) {
    throw new Error('Invalid currency conversion parameters');
  }

  if (from === to) {
    return amount;
  }

  // Convert to base (e.g., USD), then to target
  // amount_in_base = amount / rates[from]
  // amount_in_target = amount_in_base * rates[to]
  const amountInBase = amount / rates[from];
  const amountInTarget = amountInBase * rates[to];
  return Number(amountInTarget.toFixed(2)); // 2 decimals for money
}
