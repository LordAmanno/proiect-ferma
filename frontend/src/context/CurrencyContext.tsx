import { useState, useEffect, type ReactNode } from 'react';
import { CurrencyContext, type CurrencyCode } from './CurrencyContextBase';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('currency') as CurrencyCode) || 'EUR';
  });
  const loading = false;
  const error: string | null = null;

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
  };

  const convert = (amount: number): number => {
    return amount;
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, loading, error, formatMoney, convert, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
