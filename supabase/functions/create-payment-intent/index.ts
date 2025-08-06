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

    // Get request data
    const { planType, freeTrialEnabled } = await req.json()

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Error getting user')
    }

    // Get or create customer
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`)
    }

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_uid: user.id,
        },
      })
      customerId = customer.id

      // Update the user's profile with the Stripe customer ID
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`)
      }
    }

    // Get prices from environment variables
    const weeklyPriceId = Deno.env.get('STRIPE_WEEKLY_PRICE_ID')
    const yearlyPriceId = Deno.env.get('STRIPE_YEARLY_PRICE_ID')

    if (!weeklyPriceId || !yearlyPriceId) {
      throw new Error('Missing Stripe price IDs in environment variables')
    }

    // Determine the price based on the plan type
    const priceId = planType === 'yearly' ? yearlyPriceId : weeklyPriceId

    // Get the price details from Stripe
    const price = await stripe.prices.retrieve(priceId)
    
    if (!price) {
      throw new Error('Price not found')
    }

    // Create a payment intent or setup intent based on whether there's a free trial
    let intentData
    if (freeTrialEnabled) {
      // For free trials, create a setup intent
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        customer: customerId,
      })
      intentData = {
        client_secret: setupIntent.client_secret,
        setup_intent: true,
        customer_id: customerId
      }
    } else {
      // For immediate payments, create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price.unit_amount ?? 0,
        currency: price.currency,
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          price_id: priceId,
          plan_type: planType,
        },
      })
      intentData = {
        client_secret: paymentIntent.client_secret,
        setup_intent: false,
        customer_id: customerId
      }
    }

    return new Response(
      JSON.stringify({
        ...intentData,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY_TEST')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
