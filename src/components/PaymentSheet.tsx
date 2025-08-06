import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useStripe,
  useConfirmPayment,
  PaymentSheet,
  usePaymentSheet,
  useConfirmSetupIntent,
} from '@stripe/stripe-react-native';
import { StripeService } from '../services/stripeService';
import { supabase } from '../../lib/supabase';

interface PaymentSheetProps {
  planType: 'weekly' | 'yearly';
  amount: number;
  freeTrialEnabled: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

const PaymentSheetComponent: React.FC<PaymentSheetProps> = ({
  planType,
  amount,
  freeTrialEnabled,
  onSuccess,
  onCancel,
  isVisible,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      handlePaymentFlow();
    }
  }, [isVisible, planType, amount, freeTrialEnabled]);

  const handlePaymentFlow = async () => {
    try {
      setLoading(true);
      
      console.log('Starting payment flow for plan:', planType, 'with free trial:', freeTrialEnabled);
      
      // Create payment intent or setup intent with free trial option
      const paymentData = await StripeService.createPaymentIntent(planType, undefined, freeTrialEnabled);
      console.log('Payment data received:', paymentData);
      
      if (!paymentData.client_secret) {
        throw new Error('No client secret received');
      }
      
      if (freeTrialEnabled && (paymentData as any).setup_intent) {
        // Handle Setup Intent for free trial
        console.log('Handling setup intent for free trial');
        
        const { error } = await initPaymentSheet({
          merchantDisplayName: 'NotesSummarizer',
          setupIntentClientSecret: paymentData.client_secret,
          defaultBillingDetails: {
            name: 'NotesSummarizer User',
          },
          appearance: {
            colors: {
              primary: '#007AFF',
            },
          },
        });

        if (error) {
          console.error('Payment sheet initialization error:', error);
          Alert.alert('Error', error.message);
          setLoading(false);
          onCancel();
          return;
        }

        console.log('Payment sheet initialized successfully for setup intent');

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          console.error('Payment sheet presentation error:', presentError);
          Alert.alert('Setup failed', presentError.message);
          setLoading(false);
          onCancel();
          return;
        }

        // Setup successful - create subscription with trial
        console.log('Setup completed successfully, creating subscription with trial');
        if (paymentData.customer_id) {
          console.log('Customer ID from setup intent:', paymentData.customer_id);
          await createSubscriptionWithTrial(planType, paymentData.customer_id);
        } else {
          console.error('No customer ID in payment data:', paymentData);
          throw new Error('No customer ID received from setup intent');
        }
        
      } else {
        // Handle regular Payment Intent
        console.log('Handling regular payment intent');
        
        const { error } = await initPaymentSheet({
          merchantDisplayName: 'NotesSummarizer',
          paymentIntentClientSecret: paymentData.client_secret,
          defaultBillingDetails: {
            name: 'NotesSummarizer User',
          },
          allowsDelayedPaymentMethods: true,
          appearance: {
            colors: {
              primary: '#007AFF',
            },
          },
        });

        if (error) {
          console.error('Payment sheet initialization error:', error);
          Alert.alert('Error', error.message);
          setLoading(false);
          onCancel();
          return;
        }

        console.log('Payment sheet initialized successfully');

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          console.error('Payment sheet presentation error:', presentError);
          Alert.alert('Payment failed', presentError.message);
          setLoading(false);
          onCancel();
          return;
        }
      }

      // Success
      console.log('Payment/Setup completed successfully');
      setLoading(false);
      
      const successMessage = freeTrialEnabled 
        ? 'Your 3-day free trial has started! You won\'t be charged until the trial ends.'
        : 'Your subscription has been activated.';
        
      Alert.alert(
        'Success!',
        successMessage,
        [
          {
            text: 'Continue',
            onPress: () => {
              onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Payment flow error:', error);
      Alert.alert('Error', `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
      onCancel();
    }
  };

  const createSubscriptionWithTrial = async (planType: 'weekly' | 'yearly', customerId: string) => {
    try {
      console.log('Creating subscription with trial for customer:', customerId);
      
      // Use the StripeService method
      const data = await StripeService.createFreeTrial(planType, customerId);

      console.log('Free trial subscription created:', data);
      return data;
    } catch (error) {
      console.error('Error creating free trial subscription:', error);
      throw error;
    }
  };

  // Show loading state while processing
  if (isVisible && loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {freeTrialEnabled ? 'Setting up your free trial...' : 'Preparing payment...'}
          </Text>
        </View>
      </View>
    );
  }

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  // This should not be reached, but just in case
  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default PaymentSheetComponent; 