import api from './api';

const FEEDBACK_PATH = '/api/responses/feedback/';
const SAVE_PATH = '/api/responses/save/';
const SAVED_PATH = '/api/responses/saved/';
const COPY_PATH = '/api/responses/copy/';

export type SavedResponseItem = {
  id: number;
  option_type: 'safe' | 'playful' | 'bold';
  option_text: string;
  mode: string;
  relationship_context: string;
  situation_summary: string;
  created_at: string;
};

export const submitFeedback = async (
  recordId: number,
  optionType: string,
  feedbackType: string,
): Promise<void> => {
  await api.post(FEEDBACK_PATH, {
    response_record_id: recordId,
    option_type: optionType,
    feedback_type: feedbackType,
  });
};

export const saveResponse = async (
  recordId: number,
  optionType: string,
): Promise<void> => {
  await api.post(SAVE_PATH, {
    response_record_id: recordId,
    option_type: optionType,
  });
};

export const getSavedResponses = async (): Promise<SavedResponseItem[]> => {
  const { data } = await api.get<SavedResponseItem[]>(SAVED_PATH);
  return data;
};

export const trackCopy = async (recordId: number, optionType: string): Promise<void> => {
  await api.post(COPY_PATH, { response_record_id: recordId, option_type: optionType });
};

export type ResponseInteractionStatus = {
  feedback: Array<{
    response_record_id: number;
    option_type: 'safe' | 'playful' | 'bold';
    feedback_type: string;
  }>;
  saved: Array<[number, 'safe' | 'playful' | 'bold']>;
};

export const getResponseStatus = async (recordIds: number[]): Promise<ResponseInteractionStatus> => {
  const { data } = await api.get<ResponseInteractionStatus>('/api/responses/status/', {
    params: { id: recordIds },
    paramsSerializer: { indexes: null },
  });
  return data;
};
