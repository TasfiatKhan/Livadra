export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  PersonalitySetup: undefined;
  TextingMode: undefined;
  LiveMode: undefined;
  Moments: undefined;
  MomentDetail: { momentId: number | null };
  SavedResponses: undefined;
};
