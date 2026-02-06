import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  const { session } = useAuth();
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.access_token) {
        fetchDocuments();
    }
  }, [session]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/financedocuments`, {
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      
      // Transform URLs to be absolute if needed, though backend sends relative /api/...
      const dataWithFullUrls = data.map((doc: FinanceDocument) => ({
        ...doc,
        publicUrl: `${API_BASE_URL}${doc.publicUrl.replace('/api/financedocuments', '/financedocuments')}?access_token=${session?.access_token}` 
      }));

      setDocuments(dataWithFullUrls);
      setError(null); // Clear error on success
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
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload document');
      
      const newDoc = await response.json();
      
      // Fix URL for the new doc too
      const docWithUrl = {
        ...newDoc,
        publicUrl: `${API_BASE_URL}${newDoc.publicUrl.replace('/api/financedocuments', '/financedocuments')}?access_token=${session?.access_token}`
      };

      setDocuments(prev => [docWithUrl, ...prev].sort((a, b) => 
        new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
      ));
      
      return docWithUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/financedocuments/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        }
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
