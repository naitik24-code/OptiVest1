import React, { createContext, useContext, useState } from 'react';


export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate_vs_usd: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rate_vs_usd: 1.0 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate_vs_usd: 83.50 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rate_vs_usd: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rate_vs_usd: 0.78 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate_vs_usd: 155.20 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate_vs_usd: 1.52 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate_vs_usd: 1.36 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate_vs_usd: 0.90 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate_vs_usd: 1.35 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate_vs_usd: 7.81 },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
  convertAmount: (amount: number) => number;
  currentCurrencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  formatAmount: (val) => `$${val.toLocaleString()}`,
  convertAmount: (val) => val,
  currentCurrencyInfo: SUPPORTED_CURRENCIES.USD,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('optivest_preferred_currency') || 'USD';
  });

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      localStorage.setItem('optivest_preferred_currency', code);
    }
  };

  const info = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;

  const convertAmount = (amountUsd: number): number => {
    return amountUsd * info.rate_vs_usd;
  };

  const formatAmount = (amountUsd: number): string => {
    const val = convertAmount(amountUsd);
    return `${info.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount, currentCurrencyInfo: info }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
