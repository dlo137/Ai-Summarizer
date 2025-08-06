import { supabase } from '../../lib/supabase';
import { SUBSCRIPTION_PLANS } from '../../lib/stripe';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  customer_id?: string;
  setup_intent?: boolean;
  trial_days?: number;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export class StripeService {
  // Create a payment intent for subscription
  static async createPaymentIntent(planType: 'weekly' | 'yearly', customerId?: string, freeTrialEnabled?: boolean): Promise<PaymentIntent> {
    try {
      console.log('Creating payment intent for:', planType, 'with free trial:', freeTrialEnabled);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          planType,
          customerId,
          freeTrialEnabled,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No data returned from payment intent creation');
      }

      console.log('Payment intent created:', data);
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Create a subscription
  static async createSubscription(
    planType: typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS],
    freeTrialEnabled?: boolean
  ): Promise<Subscription> {
    try {
      console.log('Creating subscription:', { planType, freeTrialEnabled });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Auth error:', userError);
        throw new Error('Authentication required');
      }

      console.log('Invoking create-subscription function with:', {
        planType,
        trialEnabled: freeTrialEnabled,
        userId: user.id
      });

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          trialEnabled: freeTrialEnabled,
          userId: user.id
        },
      });

      if (error) {
        console.error('Subscription creation error:', {
          message: error.message,
          details: error.context
        });
        throw new Error(`Subscription creation failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from subscription creation');
      }

      console.log('Subscription created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createSubscription:', {
        message: error.message,
        details: error.details || error.context
      });
      throw error;
    }
  }

  // Create a free trial subscription
  static async createFreeTrial(planType: 'weekly' | 'yearly', customerId: string): Promise<Subscription> {
    try {
      console.log('StripeService: Creating free trial for plan:', planType, 'customer:', customerId);
      
      // Call the dedicated create-free-trial function
      const { data, error } = await supabase.functions.invoke('create-free-trial', {
        body: {
          planType,
          customerId,
        },
      });

      if (error) {
        console.error('StripeService: Edge function error details:', error);
        console.error('StripeService: Error message:', error.message);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log('StripeService: Free trial created successfully:', data);
      return data.subscription;
    } catch (error) {
      console.error('StripeService: Error creating free trial:', error);
      throw error;
    }
  }

  // Get current subscription status
  static async getSubscriptionStatus(): Promise<Subscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }

  // Cancel subscription
  static async cancelSubscription(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) {
        throw new Error(error.message);
      }

      return data.success;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Restore purchases (for iOS)
  static async restorePurchases(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase.functions.invoke('restore-purchases');

      if (error) {
        throw new Error(error.message);
      }

      return data.subscriptions || [];
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }
} 