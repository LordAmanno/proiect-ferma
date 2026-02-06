import { useState, useEffect } from 'react';
import { fetchJson } from '../api/client';

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  description?: string;
  relatedCropId?: string;
}

export interface FinancialSummary {
  income: number;
  expense: number;
  net: number;
}

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJson<Transaction[]>('/transactions'),
      fetchJson<FinancialSummary>('/transactions/summary')
    ])
      .then(([txData, summaryData]) => {
        setTransactions(txData);
        setSummary(summaryData);
      })
      .catch(err => {
        console.error('Failed to fetch finance data:', err);
        setError('Failed to load financial data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await fetchJson<Transaction>('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update summary locally to avoid refetching
      setSummary(prev => {
        const amount = newTransaction.amount;
        if (newTransaction.type === 'Income') {
          return { ...prev, income: prev.income + amount, net: prev.net + amount };
        } else {
          return { ...prev, expense: prev.expense + amount, net: prev.net - amount };
        }
      });
      
      return newTransaction;
    } catch (err) {
      console.error('Failed to add transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await fetchJson(`/transactions/${id}`, { method: 'DELETE' });
      
      const txToDelete = transactions.find(t => t.id === id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      if (txToDelete) {
        setSummary(prev => {
          const amount = txToDelete.amount;
          if (txToDelete.type === 'Income') {
            return { ...prev, income: prev.income - amount, net: prev.net - amount };
          } else {
            return { ...prev, expense: prev.expense - amount, net: prev.net + amount };
          }
        });
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const updatedTx = await fetchJson<Transaction>(`/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      setTransactions(prev => prev.map(t => t.id === transaction.id ? updatedTx : t));
      
      const oldTx = transactions.find(t => t.id === transaction.id);
      if (oldTx) {
        setSummary(prev => {
          let { income, expense } = prev;
          
          // Remove old
          if (oldTx.type === 'Income') income -= oldTx.amount;
          else expense -= oldTx.amount;
          
          // Add new
          if (updatedTx.type === 'Income') income += updatedTx.amount;
          else expense += updatedTx.amount;
          
          return { income, expense, net: income - expense };
        });
      }
      
      return updatedTx;
    } catch (err) {
      console.error('Failed to update transaction:', err);
      throw err;
    }
  };

  return { transactions, summary, loading, error, addTransaction, deleteTransaction, updateTransaction };
}
