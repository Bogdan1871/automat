import { CurrencyRates } from '../types';

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: CurrencyRates
): number {
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

  const amountInBase = amount / rates[from];
  const amountInTarget = amountInBase * rates[to];
  return Number(amountInTarget.toFixed(2)); // 2 decimals for money
}
