export type TextingRequest = {
  context: string;
  user_request: string;
};

export type LiveRequest = {
  situation: string;
  user_request: string;
};

export type AIOptionType = 'safe' | 'playful' | 'bold';

export type AIOption = {
  type: AIOptionType;
  text: string;
  note: string;
};

export type AIResponse = {
  options: AIOption[];
  delivery: string;
  record_id: number | null;
};
