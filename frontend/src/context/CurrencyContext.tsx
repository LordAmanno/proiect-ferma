import { } from 'react';
import type { ReactNode } from 'react';
import { CurrencyContext, type CurrencyCode } from './CurrencyContextBase';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const currency: CurrencyCode = 'EUR';
  const loading = false;
  const error: string | null = null;

  const convert = (amount: number): number => {
    return amount;
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, loading, error, formatMoney, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};
