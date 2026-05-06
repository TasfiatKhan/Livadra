import { useState, useCallback } from 'react';
import api from '../services/api';
import { AIResponse } from '../types/humor';

export function useAIResponse() {
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setResponse(null);
    setError('');
  }, []);

  const submit = useCallback(async (path: string, body: object): Promise<void> => {
    setResponse(null);
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post<AIResponse>(path, body);
      setResponse(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errData = (err as any).response?.data;
        setError(errData?.detail ?? 'Request failed.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, error, submit, reset };
}
