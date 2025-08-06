# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for your NotesSummarizer app.

## 🚀 Quick Start

### 1. Environment Variables

Make sure your `.env` file contains:
```
PUBLIC_STRIPE_KEY_SUMMARIZER_=pk_test_your_publishable_key_here
SECRET_STRIPE_KEY_SUMMARIZER_TEST=sk_test_your_secret_key_here
```

### 2. Supabase Environment Variables

In your Supabase project dashboard, add these environment variables:
- `SECRET_STRIPE_KEY_SUMMARIZER_TEST` - Your Stripe secret key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Stripe Dashboard Setup

#### Create Products and Prices

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add Product**
3. Create two products:

**Weekly Plan:**
- Name: "Weekly Plan"
- Price: $5.99/week
- Billing: Recurring
- Interval: Week

**Yearly Plan:**
- Name: "Yearly Plan" 
- Price: $99.99/year
- Billing: Recurring
- Interval: Year

4. Copy the **Price IDs** (start with `price_`) and update them in:
   - `supabase/functions/create-subscription/index.ts` (lines 35-42)

### 4. Database Setup

Run the SQL migration in your Supabase SQL editor:
```sql
-- Copy the contents of supabase/migrations/001_create_stripe_tables.sql
```

### 5. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy restore-purchases
```

### 6. Test the Integration

1. Start your app: `npx expo start`
2. Navigate to the subscription screen
3. Select a plan and tap "Continue"
4. Complete the payment using Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires Authentication**: `4000 025 0000 3155`

## 🔧 Configuration Details

### Stripe Configuration (`lib/stripe.ts`)

The Stripe configuration uses your environment variables:
- `PUBLIC_STRIPE_KEY_SUMMARIZER_` - Publishable key for client-side
- `SECRET_STRIPE_KEY_SUMMARIZER_TEST` - Secret key for server-side

### Payment Flow

1. **User selects plan** → Subscription screen
2. **Tap Continue** → Payment sheet appears
3. **Enter payment details** → Stripe processes payment
4. **Success** → User navigates to main app
5. **Failure** → Error message shown

### Database Tables

**customers:**
- Links Supabase users to Stripe customers
- Stores customer metadata

**subscriptions:**
- Tracks subscription status
- Stores billing period information
- Handles cancellation status

## 🛠️ Troubleshooting

### Common Issues

1. **"Stripe publishable key not found"**
   - Check your `.env` file has `PUBLIC_STRIPE_KEY_SUMMARIZER_`
   - Restart the development server

2. **"Unauthorized" errors**
   - Ensure user is logged in
   - Check Supabase authentication is working

3. **Payment fails**
   - Verify Stripe keys are correct
   - Check Edge Functions are deployed
   - Use test card numbers

4. **Database errors**
   - Run the SQL migration
   - Check RLS policies are enabled

### Testing

Use these Stripe test cards:
- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

Any future expiry date and any 3-digit CVC will work.

## 📱 Features Implemented

✅ **Payment Processing** - Stripe Payment Sheet integration
✅ **Subscription Management** - Create, cancel, restore subscriptions
✅ **Database Integration** - Supabase tables with RLS
✅ **Error Handling** - Comprehensive error messages
✅ **Test Mode** - Full test environment setup
✅ **Restore Purchases** - iOS-style purchase restoration

## 🔒 Security

- All sensitive operations use Supabase Edge Functions
- Row Level Security (RLS) protects user data
- Stripe handles PCI compliance
- No sensitive keys in client code

## 📞 Support

If you encounter issues:
1. Check the Stripe Dashboard for payment status
2. Review Supabase Edge Function logs
3. Verify environment variables are set correctly
4. Test with Stripe test cards first

---

**Next Steps:**
1. Create your Stripe products and prices
2. Update the price IDs in the Edge Functions
3. Deploy the functions to Supabase
4. Test the payment flow
5. Go live with real Stripe keys when ready! 