import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';

export interface FinanceDocument {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  documentDate: string;
  uploadedAt: string;
  publicUrl: string;
}

export function useFinanceDocuments() {
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/financedocuments`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, date: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', date);

    try {
      const response = await fetch(`${API_BASE_URL}/financedocuments/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload document');
      
      const newDoc = await response.json();
      setDocuments(prev => [newDoc, ...prev].sort((a, b) => 
        new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
      ));
      
      return newDoc;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/financedocuments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments
  };
}
