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

export const submitFeedback = async (recordId: number, feedbackType: string): Promise<void> => {
  await api.post(FEEDBACK_PATH, { response_record_id: recordId, feedback_type: feedbackType });
};

export const saveResponse = async (
  recordId: number,
  optionType: string,
  optionText: string,
): Promise<void> => {
  await api.post(SAVE_PATH, {
    response_record_id: recordId,
    option_type: optionType,
    option_text: optionText,
  });
};

export const getSavedResponses = async (): Promise<SavedResponseItem[]> => {
  const { data } = await api.get<SavedResponseItem[]>(SAVED_PATH);
  return data;
};

export const trackCopy = async (recordId: number, optionType: string): Promise<void> => {
  await api.post(COPY_PATH, { response_record_id: recordId, option_type: optionType });
};
