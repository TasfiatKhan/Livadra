import api from './api';
import { AIResponse } from '../types/humor';
import { LIVE_VOICE_PATH } from './humorService';

export const submitLiveVoice = async (formData: FormData): Promise<AIResponse> => {
  const { data } = await api.post<AIResponse>(LIVE_VOICE_PATH, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
