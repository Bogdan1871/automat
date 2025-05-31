import { parseInvoiceXls } from '../utils/xlsParser';
import { validateInvoiceRecords } from '../utils/validation';
import fs from 'fs/promises';

export async function processInvoiceFile(filePath: string) {
  try {
    const parsedData = await parseInvoiceXls(filePath);

    const invoicesData = validateInvoiceRecords(
      parsedData.rows,
      parsedData.currencyRates
    );

    return {
      invoicingMonth: parsedData.invoicingMonth,
      currencyRates: parsedData.currencyRates,
      invoicesData,
    };
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}
