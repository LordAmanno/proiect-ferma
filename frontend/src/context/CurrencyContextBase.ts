import { createContext } from 'react';

export type CurrencyCode = 'EUR' | 'USD' | 'RON' | 'GBP' | 'MDL' | 'BGN' | 'CZK' | 'DKK' | 'HUF' | 'PLN' | 'SEK';

export interface CurrencyContextType {
  currency: CurrencyCode;
  loading: boolean;
  error: string | null;
  formatMoney: (amount: number) => string;
  convert: (amount: number) => number;
  setCurrency: (currency: CurrencyCode) => void;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);
