import { useState, useEffect } from 'react';
import { fetchJson } from '../api/client';

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  fieldId?: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  status: 'Planted' | 'Growing' | 'Ready to Harvest' | 'Harvested';
}

export interface Field {
  id: string;
  name: string;
  areaHectares: number;
  locationCoordinates?: string;
  soilType?: string;
  status: string;
}

export function useCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJson<Crop[]>('/crops'),
      fetchJson<Field[]>('/fields')
    ])
      .then(([cropsData, fieldsData]) => {
        setCrops(cropsData);
        setFields(fieldsData);
      })
      .catch(err => {
        console.error('Failed to fetch crops/fields:', err);
        setError('Failed to load crops data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const addCrop = async (crop: Omit<Crop, 'id'>) => {
    try {
      const newCrop = await fetchJson<Crop>('/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crop),
      });
      setCrops(prev => [...prev, newCrop]);
      return newCrop;
    } catch (err) {
      console.error('Failed to add crop:', err);
      throw err;
    }
  };

  return { crops, fields, loading, error, addCrop };
}
