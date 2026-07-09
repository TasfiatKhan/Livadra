import axios, { AxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../constants/api';

const ACCESS_KEY = 'livadra.access_token';
const REFRESH_KEY = 'livadra.refresh_token';

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(ACCESS_KEY);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_KEY);

export const setTokens = async (access: string, refresh: string): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Concurrency guard — prevents multiple simultaneous refresh calls
let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

const flushQueue = (token: string): void => {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
};

const drainQueue = (err: unknown): void => {
  refreshQueue.forEach(({ reject }) => reject(err));
  refreshQueue = [];
};

// Handle 401 — refresh token and retry, or clear and reject
api.interceptors.response.use(
  response => response,
  async (error) => {
    const original: AxiosRequestConfig & { _retried?: boolean } = error.config;

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(token => {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      });
    }

    original._retried = true;
    isRefreshing = true;

    try {
      const refresh = await getRefreshToken();
      if (!refresh) {
        await clearTokens();
        DeviceEventEmitter.emit('auth:expired');
        drainQueue(error);
        return Promise.reject(error);
      }

      const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
      const newAccess: string = data.access;
      const newRefresh: string = data.refresh ?? refresh;

      await setTokens(newAccess, newRefresh);
      flushQueue(newAccess);

      original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
      return api(original);
    } catch (refreshError) {
      await clearTokens();
      DeviceEventEmitter.emit('auth:expired');
      drainQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
