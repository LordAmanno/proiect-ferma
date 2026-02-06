import { useState, useEffect } from 'react';
import { fetchJson } from '../api/client';

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<InventoryItem[]>('/inventory')
      .then(setItems)
      .catch(err => {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory from server.');
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const newItem = await fetchJson<InventoryItem>('/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Failed to add inventory item:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const itemToUpdate = items.find(i => i.id === id);
      if (!itemToUpdate) throw new Error('Item not found');

      const updatedItem = await fetchJson<InventoryItem>(`/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemToUpdate, ...updates }),
      });
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      console.error('Failed to update inventory item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetchJson(`/inventory/${id}`, {
        method: 'DELETE',
      });
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete inventory item:', err);
      throw err;
    }
  };

  return { items, loading, error, addItem, updateItem, deleteItem };
}
