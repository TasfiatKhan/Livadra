import api from './api';

const FEEDBACK_PATH = '/api/responses/feedback/';
const SAVE_PATH = '/api/responses/save/';

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
