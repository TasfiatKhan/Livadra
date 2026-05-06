import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import PersonalitySetupScreen from '../screens/onboarding/PersonalitySetupScreen';
import TextingModeScreen from '../screens/texting/TextingModeScreen';
import LiveModeScreen from '../screens/live/LiveModeScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PersonalitySetup" component={PersonalitySetupScreen} />
      <Stack.Screen name="TextingMode" component={TextingModeScreen} />
      <Stack.Screen name="LiveMode" component={LiveModeScreen} />
    </Stack.Navigator>
  );
}
