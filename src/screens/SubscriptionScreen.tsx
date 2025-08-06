import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PaymentSheetComponent from '../components/PaymentSheet';
import { StripeService } from '../services/stripeService';
import { supabase } from '../../lib/supabase';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../../lib/stripe';

const SubscriptionScreen = ({ navigation, user }: any) => {
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>(SUBSCRIPTION_PLANS.YEARLY);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    {
      icon: 'infinite',
      color: '#007AFF',
      text: 'Unlimited audio transcriptions',
    },
    {
      icon: 'mic',
      color: '#34C759',
      text: 'Record meetings of any duration',
    },
    {
      icon: 'logo-youtube',
      color: '#FF0000',
      text: 'YouTube & file uploads of any size',
    },
    {
      icon: 'chatbubble',
      color: '#FF69B4',
      text: 'Chat about your notes instantly',
    },
  ];

  const handleContinue = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting subscription process:', { selectedPlan, freeTrialEnabled });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to continue');
        navigation.navigate('Login' as never);
        return;
      }

      // Create payment intent first
      const paymentIntent = await StripeService.createPaymentIntent(
        selectedPlan,
        undefined,
        freeTrialEnabled
      );
      
      console.log('Payment intent created:', paymentIntent);

      // Show the payment sheet after getting payment intent
      setShowPaymentSheet(true);
    } catch (error: any) {
      console.error('Subscription error:', {
        message: error.message,
        details: error.details || error.context
      });
      
      let errorMessage = 'Failed to create subscription. ';
      if (error.message.includes('price_id')) {
        errorMessage += 'Invalid price configuration. Please contact support.';
      } else if (error.message.includes('authentication')) {
        errorMessage += 'Please sign in and try again.';
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert('Subscription Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setShowPaymentSheet(false);
      
      // Create the subscription after successful payment
      const subscription = await StripeService.createSubscription(
        selectedPlan,
        freeTrialEnabled
      );

      console.log('Subscription created:', subscription);

      // Show success message and then navigate to loading screen
      Alert.alert(
        'Welcome to NotesSummarizer!',
        'Your subscription is ready. Enjoy the app!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigate to loading screen which will handle the transition
              navigation.navigate('Loading' as never);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment success handler error:', error);
      Alert.alert('Error', 'Failed to complete subscription setup');
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentSheet(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* App Icon */}
        <View style={styles.appIconContainer}>
          <View style={styles.appIcon}>
          <Ionicons name="mic" size={32} color="white" />
        </View>
        {/* Feature Icons around the main icon */}
        <View style={styles.featureIcons}>
          <View style={[styles.featureIcon, { top: -20, right: -20 }]}>
            <Ionicons name="paper-plane" size={16} color="#007AFF" />
          </View>
          <View style={[styles.featureIcon, { top: -10, right: -30 }]}>
            <Ionicons name="bulb" size={16} color="#34C759" />
          </View>
          <View style={[styles.featureIcon, { top: 10, right: -30 }]}>
            <Ionicons name="document" size={16} color="#FF9500" />
          </View>
          <View style={[styles.featureIcon, { top: 20, right: -20 }]}>
            <Ionicons name="pulse" size={16} color="#AF52DE" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        GET PRO <Text style={styles.proText}>ACCESS</Text>
      </Text>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name={feature.icon as any} size={20} color={feature.color} />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* Free Trial Toggle */}
      <View style={styles.trialContainer}>
        <Text style={styles.trialText}>
          {freeTrialEnabled ? 'Free Trial Enabled' : 'Enable Free Trial'}
        </Text>
        <TouchableOpacity
          style={[styles.toggle, freeTrialEnabled && styles.toggleActive]}
          onPress={() => setFreeTrialEnabled(!freeTrialEnabled)}
        >
          <View style={[styles.toggleThumb, freeTrialEnabled && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Pricing Plans */}
      <View style={styles.plansContainer}>
        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === SUBSCRIPTION_PLANS.YEARLY && styles.planCardSelected
          ]}
          onPress={() => setSelectedPlan(SUBSCRIPTION_PLANS.YEARLY)}
        >
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>BEST OFFER</Text>
          </View>
          <Text style={styles.planTitle}>YEARLY PLAN</Text>
          <Text style={styles.planPrice}>Just $99.99 per year</Text>
          <Text style={styles.planSubtext}>$1.92 per week</Text>
        </TouchableOpacity>

        {/* Weekly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === SUBSCRIPTION_PLANS.WEEKLY && styles.planCardSelected
          ]}
          onPress={() => setSelectedPlan(SUBSCRIPTION_PLANS.WEEKLY)}
        >
          <Text style={styles.planTitle}>
            {freeTrialEnabled ? '3-DAY FREE TRIAL' : 'WEEKLY PLAN'}
          </Text>
          <Text style={styles.planPrice}>
            {freeTrialEnabled ? 'then $5.99 per week' : '$5.99 per week'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>
          {freeTrialEnabled ? 'Start free trial' : 'Continue'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <View style={styles.checkbox}>
          <Ionicons name="checkmark" size={12} color="white" />
        </View>
        <Text style={styles.disclaimerText}>
          {freeTrialEnabled ? 'NO PAYMENT NOW, CANCEL ANYTIME' : 'CANCEL ANYTIME'}
        </Text>
      </View>

       {/* Payment Sheet */}
       <PaymentSheetComponent
         planType={selectedPlan as 'weekly' | 'yearly'}
         amount={selectedPlan === 'yearly' ? 99.99 : 5.99}
         freeTrialEnabled={freeTrialEnabled}
         onSuccess={handlePaymentSuccess}
         onCancel={handlePaymentCancel}
         isVisible={showPaymentSheet}
       />
      </View>
    </SafeAreaView>
   );
 };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcons: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  featureIcon: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  proText: {
    color: '#007AFF',
  },
  featuresContainer: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#1a1a1a',
    marginLeft: 10,
    flex: 1,
  },
  trialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  trialText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 26,
    backgroundColor: '#e1e1e1',
    borderRadius: 13,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    backgroundColor: 'white',
    borderRadius: 11,
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  planBadge: {
    position: 'absolute',
    top: -6,
    right: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  planSubtext: {
    fontSize: 13,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginHorizontal: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SubscriptionScreen;