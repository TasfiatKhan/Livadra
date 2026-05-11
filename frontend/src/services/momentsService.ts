import api from './api';
import { Moment, MomentDetail, CreateMomentResponse, ContinueMomentResponse } from '../types/moments';

export const listMoments = (archived = false) =>
  api.get<Moment[]>('/api/moments/', { params: { archived } });

export const createMoment = (formData: FormData) =>
  api.post<CreateMomentResponse>('/api/moments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMoment = (id: number) =>
  api.get<MomentDetail>(`/api/moments/${id}/`);

export const continueMoment = (id: number, data: { new_input: string; environment?: string } | FormData) =>
  api.post<ContinueMomentResponse>(
    `/api/moments/${id}/continue/`,
    data,
    data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
  );

export const toggleMomentArchive = (id: number) =>
  api.patch<{ is_archived: boolean }>(`/api/moments/${id}/archive/`);
