import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import PersonalitySetupScreen from '../screens/onboarding/PersonalitySetupScreen';
import TextingModeScreen from '../screens/texting/TextingModeScreen';
import LiveModeScreen from '../screens/live/LiveModeScreen';
import MomentsScreen from '../screens/moments/MomentsScreen';
import MomentDetailScreen from '../screens/moments/MomentDetailScreen';
import SavedResponsesScreen from '../screens/SavedResponsesScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PersonalitySetup" component={PersonalitySetupScreen} />
      <Stack.Screen name="TextingMode" component={TextingModeScreen} />
      <Stack.Screen name="LiveMode" component={LiveModeScreen} />
      <Stack.Screen name="Moments" component={MomentsScreen} />
      <Stack.Screen name="MomentDetail" component={MomentDetailScreen} />
      <Stack.Screen name="SavedResponses" component={SavedResponsesScreen} />
    </Stack.Navigator>
  );
}
