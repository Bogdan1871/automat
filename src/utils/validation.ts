import { InvoiceRecord, CurrencyRates } from '../types';
import { convertCurrency } from './currencyConverter';

// List of normalized mandatory fields
const mandatoryFields = [
  'customer',
  'cust no',
  'project type',
  'quantity',
  'price per item',
  'item price currency',
  'total price',
  'invoice currency',
  'status'
];

// Helper: normalize keys for comparison (case, spaces)
function normalizeKey(key: string): string {
  return key.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Validates and enriches all invoice records.
 * Populates .validationErrors (array of strings) for each record.
 * If valid, calculates .invoiceTotal (converted into invoice currency).
 */
export function validateInvoiceRecords(
  records: any[],
  currencyRates: CurrencyRates
): InvoiceRecord[] {
  return records.map((orig) => {
    // Shallow clone to avoid mutation
    const record = { ...orig } as InvoiceRecord;
    const errors: string[] = [];

    // 1. Check all mandatory fields
    for (const field of mandatoryFields) {
      const actualKey = Object.keys(record).find(
        (k) => normalizeKey(k) === field
      );
      if (!actualKey || record[actualKey] === '' || record[actualKey] == null) {
        errors.push(`Missing mandatory field: ${field}`);
      }
    }

    // 2. Validate numbers and types
    const qKey = Object.keys(record).find((k) => normalizeKey(k) === 'quantity');
    const priceKey = Object.keys(record).find((k) => normalizeKey(k) === 'price per item');
    const totalPriceKey = Object.keys(record).find((k) => normalizeKey(k) === 'total price');
    const itemPriceCurrencyKey = Object.keys(record).find((k) => normalizeKey(k) === 'item price currency');
    const invoiceCurrencyKey = Object.keys(record).find((k) => normalizeKey(k) === 'invoice currency');
    const statusKey = Object.keys(record).find((k) => normalizeKey(k) === 'status');
    const invoiceNumberKey = Object.keys(record).find((k) => normalizeKey(k).includes('invoice'));

    const quantity = qKey ? Number(record[qKey]) : NaN;
    const pricePerItem = priceKey ? Number(record[priceKey]) : NaN;
    const totalPrice = totalPriceKey ? Number(record[totalPriceKey]) : NaN;
    const itemPriceCurrency = itemPriceCurrencyKey ? record[itemPriceCurrencyKey] : '';
    const invoiceCurrency = invoiceCurrencyKey ? record[invoiceCurrencyKey] : '';
    const status = statusKey ? String(record[statusKey]).toLowerCase() : '';
    const invoiceNumber = invoiceNumberKey ? record[invoiceNumberKey] : '';

    if (qKey && (isNaN(quantity) || quantity <= 0)) {
      errors.push('Quantity must be a positive number');
    }
    if (priceKey && (isNaN(pricePerItem) || pricePerItem < 0)) {
      errors.push('Price Per Item must be a non-negative number');
    }
    if (totalPriceKey && (isNaN(totalPrice) || totalPrice < 0)) {
      errors.push('Total Price must be a non-negative number');
    }

    // 3. Check currencies exist in rates
    if (itemPriceCurrency && !currencyRates[itemPriceCurrency]) {
      errors.push(`Unknown item price currency: ${itemPriceCurrency}`);
    }
    if (invoiceCurrency && !currencyRates[invoiceCurrency]) {
      errors.push(`Unknown invoice currency: ${invoiceCurrency}`);
    }

    // 4. Check price calculation (optionally)
    if (
      typeof quantity === 'number' &&
      typeof pricePerItem === 'number' &&
      typeof totalPrice === 'number' &&
      !isNaN(quantity) && !isNaN(pricePerItem) && !isNaN(totalPrice)
    ) {
      const expectedTotal = Number((quantity * pricePerItem).toFixed(2));
      if (Math.abs(totalPrice - expectedTotal) > 0.01) {
        errors.push(
          `Total Price (${totalPrice}) does not match Quantity x Price Per Item (${expectedTotal})`
        );
      }
    }

    // 5. Only process relevant records: a) status "ready" or b) invoice number filled
    if (!(status === 'ready' || (invoiceNumber && String(invoiceNumber).trim() !== ''))) {
      errors.push('Row is not relevant (status is not "ready" and invoice number missing)');
    }

    // 6. Calculate invoiceTotal if everything else passes
    let invoiceTotal: number | undefined = undefined;
    if (
      totalPriceKey &&
      invoiceCurrency &&
      itemPriceCurrency &&
      !isNaN(totalPrice) &&
      currencyRates[itemPriceCurrency] &&
      currencyRates[invoiceCurrency]
    ) {
      try {
        invoiceTotal = convertCurrency(
          totalPrice,
          itemPriceCurrency,
          invoiceCurrency,
          currencyRates
        );
      } catch (e) {
        errors.push('Currency conversion failed: ' + (e as Error).message);
      }
    }

    // Finalize validationErrors and invoiceTotal
    record.validationErrors = errors;
    if (typeof invoiceTotal === 'number' && errors.length === 0) {
      record.invoiceTotal = invoiceTotal;
    }

    return record;
  });
}
