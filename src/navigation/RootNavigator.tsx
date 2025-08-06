import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppNavigator } from './AppNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { RootStackParamList } from './AppNavigator';

const RootStack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen name="App" component={AppNavigator} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
