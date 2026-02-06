import { useState, useEffect } from 'react';
import { fetchJson } from '../api/client';

export interface Worker {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<Worker[]>('/workers')
      .then(setWorkers)
      .catch(err => {
        console.error('Failed to fetch workers:', err);
        setError('Failed to load workers.');
      })
      .finally(() => setLoading(false));
  }, []);

  return { workers, loading, error };
}
