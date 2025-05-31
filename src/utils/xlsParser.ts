import XLSX from 'xlsx';
import fs from 'fs/promises';
import { ParsedInvoiceData, InvoiceRecord, CurrencyRates } from '../types';

function parseCurrencyRates(rows: any[][]): CurrencyRates {
  const rates: CurrencyRates = {};
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (row && row[0] && typeof row[1] !== 'undefined') {
      const m = String(row[0]).trim().match(/^([A-Z]{3})\s*Rate$/i);
      if (m && !isNaN(Number(row[1]))) {
        rates[m[1].toUpperCase()] = Number(row[1]);
      }
    }
  }
  return rates;
}

// "Sep 2023" -> "2023-09"
function extractMonth(cell: string): string {
  let match = cell.match(/(\d{4}-\d{2})/);
  if (match) return match[1];

  match = cell.match(/^([A-Za-z]{3,})[ \-]?(\d{4})$/);
  if (match) {
    const monthAbbr = match[1].toLowerCase().slice(0, 3);
    const year = match[2];
    const monthMap: { [k: string]: string } = {
      jan: '01', feb: '02', mar: '03', apr: '04',
      may: '05', jun: '06', jul: '07', aug: '08',
      sep: '09', oct: '10', nov: '11', dec: '12'
    };
    if (monthMap[monthAbbr]) return `${year}-${monthMap[monthAbbr]}`;
  }
  return '';
}

export async function parseInvoiceXls(filePath: string): Promise<ParsedInvoiceData> {
  const fileBuffer = await fs.readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    header: 1,
    raw: false
  });

  let invoicingMonth = '';
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    for (const cell of rows[i]) {
      const found = extractMonth(String(cell ?? '').trim());
      if (found) {
        invoicingMonth = found;
        break;
      }
    }
    if (invoicingMonth) break;
  }
  if (!invoicingMonth) {
    throw new Error('Could not extract invoicingMonth (YYYY-MM) from the first cells of the file');
  }

  const currencyRates = parseCurrencyRates(rows);

  let headerRowRaw: string[] | undefined;
  let headerRowIdx = -1;
  let startIdx = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i].map((h: any) => String(h || '').trim());
    const customerIdx = row.findIndex((h: string) => h.toLowerCase().includes('customer'));
    const custNoIdx = row.findIndex((h: string) => h.toLowerCase().includes('cust no'));
    const projectTypeIdx = row.findIndex((h: string) => h.toLowerCase().includes('project type'));
    if (customerIdx !== -1 && custNoIdx !== -1 && projectTypeIdx !== -1) {
      headerRowRaw = row;
      headerRowIdx = i;
      startIdx = customerIdx;
      break;
    }
  }
  if (!headerRowRaw || startIdx === -1) {
    throw new Error('Could not find Customer column in header row');
  }
  const endIdx = headerRowRaw.length - 1;
  const headerRow = headerRowRaw.slice(startIdx, endIdx + 1);

  const dataRows = rows.slice(headerRowIdx + 1);

  const records: InvoiceRecord[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const rowArr = dataRows[i] as (string | number | undefined)[];
    // Stop at first empty row or footer
    if (!rowArr || rowArr.length === 0 || rowArr.every(cell => cell === '' || cell === undefined)) {
      break;
    }
    const firstCell = String(rowArr[startIdx] || '').toLowerCase();
    if (firstCell.startsWith('total') || firstCell.startsWith('project type')) {
      break;
    }

    const record: Record<string, any> = {};
    const rowSlice = rowArr.slice(startIdx, startIdx + headerRow.length);
    for (let j = 0; j < headerRow.length; j++) {
      let key = headerRow[j];
      let value = typeof rowSlice[j] !== 'undefined' && rowSlice[j] !== null ? rowSlice[j] : '';
      // Header aliases for validator compatibility
      if (key.toLowerCase() === 'invoice total price') key = 'Total Price';
      record[key] = value;
    }
    record.validationErrors = [];
    records.push(record as InvoiceRecord);
  }

  return {
    invoicingMonth,
    currencyRates,
    rows: records,
  };
}
