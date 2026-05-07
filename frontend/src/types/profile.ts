export type Profile = {
  id: number;
  email: string;
  humor_style: string;
  persona_type: string;
  confidence_level: string;
  cultural_tone: string;
  username: string;
  personality_description: string;
  social_anxiety_level: string;
  is_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    'humor_style' | 'persona_type' | 'confidence_level' | 'cultural_tone' |
    'personality_description' | 'social_anxiety_level'
  >
>;
