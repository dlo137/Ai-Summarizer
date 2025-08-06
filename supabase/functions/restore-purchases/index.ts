import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user } = await req.json()

    // Get customer data from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`)
    }

    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ 
          active: false,
          message: 'No subscription found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    })

    const hasActiveSubscription = subscriptions.data.length > 0
    const activeSubscription = hasActiveSubscription ? subscriptions.data[0] : null

    if (hasActiveSubscription) {
      // Update profile with subscription info
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          subscription_status: activeSubscription.status,
          subscription_id: activeSubscription.id,
          subscription_plan: activeSubscription.items.data[0].price.lookup_key || 'premium'
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        active: hasActiveSubscription,
        subscription: activeSubscription
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
