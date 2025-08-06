import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { setGlobalOnboardingComplete } from './src/utils/onboardingState';
import { initializeStripe } from './lib/stripe';
import Constants from 'expo-constants';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);

  // Set the global function when component mounts
  React.useEffect(() => {
    setGlobalOnboardingComplete(setOnboardingComplete);
  }, []);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const success = await initializeStripe();
        setStripeInitialized(success);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        setStripeInitialized(false);
      }
    };
    initStripe();
  }, []);

  // Show loading screen while initializing Stripe
  if (!stripeInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text>Initializing...</Text>
      </View>
    );
  }

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('Stripe publishable key not found in environment variables');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text>Configuration Error: Stripe key not found</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Check .env file configuration</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={publishableKey}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {onboardingComplete ? (
            <AppNavigator key="app" />
          ) : (
            <OnboardingNavigator key="onboarding" />
          )}
        </NavigationContainer>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
