import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_TEST') ?? '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('Received request body:', body);
    
    const { planType, trialEnabled, userId } = body

    if (!userId) {
      throw new Error('userId is required but was not provided')
    }

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error(`Error fetching user data: ${userError?.message || 'User not found'}`)
    }

    // Create a Customer
    const customer = await stripe.customers.create({
      email: userData.email,
      metadata: {
        supabase_user_id: userId,
      },
    })

    // Set up subscription data
    const yearlyPriceId = Deno.env.get('STRIPE_YEARLY_PRICE_ID')
    const weeklyPriceId = Deno.env.get('STRIPE_WEEKLY_PRICE_ID')
    
    if (!yearlyPriceId || !weeklyPriceId) {
      throw new Error('Missing Stripe price IDs in environment variables')
    }

    console.log('Creating subscription:', {
      planType,
      priceId: planType === 'yearly' ? yearlyPriceId : weeklyPriceId,
      customerEmail: userData.email,
      trialEnabled
    });
    
    const subscriptionData: any = {
      customer: customer.id,
      items: [{
        price: planType === 'yearly' ? yearlyPriceId : weeklyPriceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    }

    // If trial is enabled, add trial period
    const trialEndDate = trialEnabled ? new Date() : null
    if (trialEnabled && trialEndDate) {
      trialEndDate.setDate(trialEndDate.getDate() + 3) // 3-day trial
      subscriptionData.trial_end = Math.floor(trialEndDate.getTime() / 1000)
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create(subscriptionData)

    // Update user profile with subscription information
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        stripe_customer_id: customer.id,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_plan: planType,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`)
    }

    return new Response(
      JSON.stringify({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: planType,
          current_period_end: subscription.current_period_end,
          trial_end: subscription.trial_end
        },
        customer: {
          id: customer.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Subscription creation failed:', {
      error: error.message,
      type: error.type,
      code: error.code,
      params: error.param,
      details: error.raw?.message,
      stack: error.stack
    });

    const errorMessage = error.raw?.message || error.message || 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: {
          type: error.type,
          code: error.code,
          params: error.param
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
