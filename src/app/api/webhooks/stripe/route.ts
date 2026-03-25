// API route: POST /api/webhooks/stripe
// Stripe calls this automatically when a payment succeeds or fails
// This is how we know to activate a subscription in our database

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // Verify the webhook is genuinely from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {

    // Payment succeeded — activate subscription
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const plan = session.metadata?.plan || 'monthly'

      // Get subscription end date from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const endDate = new Date(subscription.current_period_end * 1000)

      // Update user's profile in Supabase
      // Find user by Stripe customer ID, or by email if first time
      const customerEmail = session.customer_details?.email
      if (customerEmail) {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            subscription_end_date: endDate.toISOString(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('email', customerEmail)
      }
      break
    }

    // Subscription renewed
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const endDate = new Date(subscription.current_period_end * 1000)
      const customerId = invoice.customer as string

      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_end_date: endDate.toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    // Subscription cancelled
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', customerId)
      break
    }

    default:
      console.log('Unhandled webhook event:', event.type)
  }

  return NextResponse.json({ received: true })
}
