import api from './api';
import { Profile, ProfileUpdate } from '../types/profile';

export const getProfile = async (): Promise<Profile> => {
  const { data } = await api.get<Profile>('/api/profiles/me/');
  return data;
};

export const updateProfile = async (updates: ProfileUpdate): Promise<Profile> => {
  const { data } = await api.patch<Profile>('/api/profiles/me/', updates);
  return data;
};
