export type ChoiceOption = { value: string; label: string };

export const HUMOR_STYLES: ChoiceOption[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'goofy', label: 'Goofy' },
  { value: 'witty', label: 'Witty' },
  { value: 'self_deprecating', label: 'Self-Deprecating' },
  { value: 'observational', label: 'Observational' },
  { value: 'dark', label: 'Dark' },
  { value: 'absurd', label: 'Absurd' },
];

export const PERSONA_TYPES: ChoiceOption[] = [
  { value: 'roaster', label: 'The Roaster' },
  { value: 'storyteller', label: 'The Storyteller' },
  { value: 'quick_wit', label: 'The Quick Wit' },
  { value: 'charmer', label: 'The Charmer' },
  { value: 'deadpan', label: 'The Deadpan' },
];

export const CONFIDENCE_LEVELS: ChoiceOption[] = [
  { value: 'shy', label: 'Shy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'confident', label: 'Confident' },
  { value: 'fearless', label: 'Fearless' },
];

export const CULTURAL_TONES: ChoiceOption[] = [
  { value: 'usa', label: 'United States' },
  { value: 'canada', label: 'Canada' },
];

export const RELATIONSHIP_CONTEXTS: ChoiceOption[] = [
  { value: 'stranger', label: 'Stranger' },
  { value: 'new_acquaintance', label: 'New Acquaintance' },
  { value: 'crush', label: 'Crush' },
  { value: 'friend', label: 'Friend' },
  { value: 'close_friend', label: 'Close Friend' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'date', label: 'Date' },
  { value: 'other', label: 'Other' },
];
