import { useState, useCallback } from 'react';
import api from '../services/api';

export function useStreamingResponse() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setResponse('');
    setError('');
  }, []);

  const stream = useCallback(async (path: string, body: object): Promise<void> => {
    setResponse('');
    setError('');
    setIsStreaming(true);

    try {
      const { data } = await api.post<string>(path, body, { responseType: 'text' });
      setResponse(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errData = (err as any).response?.data;
        setError(errData?.detail ?? 'Request failed.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { response, isStreaming, error, stream, reset };
}
