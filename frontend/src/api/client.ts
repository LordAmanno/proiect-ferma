export const API_BASE_URL = 'http://localhost:5221/api';

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error at ${endpoint}:`, response.status, response.statusText, errorBody);
    throw new Error(`API error: ${response.statusText} - ${errorBody}`);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}
