import api from './api';
import { Moment, MomentDetail, CreateMomentResponse, ContinueMomentResponse } from '../types/moments';

export const listMoments = () =>
  api.get<Moment[]>('/api/moments/');

export const createMoment = (formData: FormData) =>
  api.post<CreateMomentResponse>('/api/moments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMoment = (id: number) =>
  api.get<MomentDetail>(`/api/moments/${id}/`);

export const continueMoment = (id: number, data: { new_input: string; environment?: string }) =>
  api.post<ContinueMomentResponse>(`/api/moments/${id}/continue/`, data);

export const archiveMoment = (id: number) =>
  api.patch(`/api/moments/${id}/archive/`);
