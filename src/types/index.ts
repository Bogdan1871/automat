// Currency rates are dynamic: key is the currency code, value is the rate (number)
export type CurrencyRates = Record<string, number>;

// An invoice record (row from the file), add more fields if your XLS has more
export interface InvoiceRecord {
  customer: string;
  custNo: string;
  projectType: string;
  quantity: number;
  pricePerItem: number;
  itemPriceCurrency: string;
  totalPrice: number;
  invoiceCurrency: string;
  invoiceNumber?: string; // optional, may be empty
  status: string;
  [key: string]: any; // for additional columns
  validationErrors: string[]; // populated during validation
  invoiceTotal?: number;      // calculated field
}

// Result after parsing file
export interface ParsedInvoiceData {
  invoicingMonth: string;
  currencyRates: CurrencyRates;
  rows: InvoiceRecord[];
}

// API response structure
export interface InvoiceApiResponse {
  invoicingMonth: string;
  currencyRates: CurrencyRates;
  invoicesData: InvoiceRecord[];
}
