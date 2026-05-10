import { AIOption } from './humor';

export type Moment = {
  id: number;
  title: string;
  relationship_context: string;
  mode: 'texting' | 'live' | 'live_voice';
  is_archived: boolean;
  created_at: string;
  last_active_at: string;
  message_count: number;
};

export type MomentMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  response_record_id: number | null;
  created_at: string;
};

export type MomentDetail = {
  id: number;
  title: string;
  relationship_context: string;
  mode: 'texting' | 'live' | 'live_voice';
  is_archived: boolean;
  created_at: string;
  last_active_at: string;
  messages: MomentMessage[];
};

export type CreateMomentResponse = {
  moment_id: number;
  options: AIOption[];
  delivery: string;
  record_id: number | null;
};

export type ContinueMomentResponse = {
  options: AIOption[];
  delivery: string;
  is_archived: boolean;
  record_id: number | null;
  user_input: string;
};
