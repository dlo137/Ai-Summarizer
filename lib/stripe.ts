import { initStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

// Initialize Stripe with the publishable key
export const initializeStripe = async () => {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('Stripe publishable key not found. Please check your .env file.');
    console.error('Expected: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    return false;
  }

  try {
    await initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.com.notessummarizer', // Update this with your merchant identifier
    });
    console.log('Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return false;
  }
};

// Subscription plan types
export type SubscriptionPlanType = 'weekly' | 'yearly';

export const SUBSCRIPTION_PLANS = {
  WEEKLY: 'weekly',
  YEARLY: 'yearly'
} as const satisfies Record<string, SubscriptionPlanType>;

// Subscription status types
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
}; 