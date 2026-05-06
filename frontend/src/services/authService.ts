import api, { setTokens, clearTokens } from './api';
import { AuthTokens } from '../types/auth';

export const register = async (email: string, password: string, passwordConfirm: string): Promise<void> => {
  const { data } = await api.post<AuthTokens>('/api/users/register/', { email, password, password_confirm: passwordConfirm });
  await setTokens(data.access, data.refresh);
};

export const login = async (email: string, password: string): Promise<void> => {
  const { data } = await api.post<AuthTokens>('/api/auth/token/', { email, password });
  await setTokens(data.access, data.refresh);
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};
