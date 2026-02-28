import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import {
  TIER_CONFIG,
  ADDON_CONFIG,
  type TierName,
  type AddonName,
} from '@landscape-ai/shared';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productType = session.metadata?.product_type;
    const productName = session.metadata?.product_name;

    if (!userId || !productType || !productName) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Record the purchase
    await supabase.from('purchases').insert({
      user_id: userId,
      product_type: productType,
      product_name: productName,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent as string,
      amount_cents: session.amount_total ?? 0,
      status: 'succeeded',
    });

    if (productType === 'tier') {
      const tier = TIER_CONFIG[productName as TierName];
      if (tier) {
        // Upsert entitlements with the tier values
        await supabase
          .from('entitlements')
          .upsert(
            {
              user_id: userId,
              tier: productName,
              included_chat_messages: tier.chat_messages,
              included_rerenders: tier.rerenders,
              included_projects: tier.projects,
              included_voice_minutes: tier.voice_minutes,
              spending_cap_cents: tier.spending_cap_cents,
            },
            { onConflict: 'user_id' },
          );
      }
    } else if (productType === 'addon') {
      const addon = ADDON_CONFIG[productName as AddonName];
      if (addon) {
        // Map addon fields to entitlement column names
        const fieldMap: Record<string, string> = {
          chat_messages: 'included_chat_messages',
          rerenders: 'included_rerenders',
          projects: 'included_projects',
          voice_minutes: 'included_voice_minutes',
        };

        for (const [addonField, entitlementField] of Object.entries(fieldMap)) {
          if (addonField in addon) {
            const amount = (addon as Record<string, unknown>)[addonField] as number;
            if (amount > 0) {
              await supabase.rpc('increment_entitlement_field', {
                p_user_id: userId,
                p_field: entitlementField,
                p_amount: amount,
              });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
