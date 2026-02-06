import { createContext } from 'react';

export type CurrencyCode = 'EUR';

export interface CurrencyContextType {
  currency: CurrencyCode;
  loading: boolean;
  error: string | null;
  formatMoney: (amount: number) => string;
  convert: (amount: number) => number;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);
