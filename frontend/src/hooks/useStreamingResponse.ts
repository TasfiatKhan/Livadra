import { useState, useCallback } from 'react';
import { getAccessToken } from '../services/api';
import { BASE_URL } from '../constants/api';

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
      const token = await getAccessToken();
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        try {
          const errData = await res.json();
          setError(errData.detail ?? `Request failed (${res.status}).`);
        } catch {
          setError(`Request failed (${res.status}).`);
        }
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Streaming is not supported on this device.');
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { response, isStreaming, error, stream, reset };
}
