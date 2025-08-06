import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { user } = await req.json()

    // Calculate trial end date (3 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 3)

    // Update user profile with trial info
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_status: 'trialing',
        trial_end_date: trialEndDate,
        subscription_plan: 'trial'
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Error updating profile: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        trial_end_date: trialEndDate
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
