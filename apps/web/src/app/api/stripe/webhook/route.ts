import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import {
  B2B_PLANS,
  B2B_ADDONS,
  type B2BPlanName,
  type B2BAddonName,
} from '@landscape-ai/shared';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

/** Provision entitlements for a company based on their plan */
async function provisionPlan(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  companyId: string,
  planName: string,
) {
  const plan = B2B_PLANS[planName as B2BPlanName];
  if (!plan) return;

  // Upsert entitlements for the company (reset usage on new subscription)
  await supabase
    .from('entitlements')
    .upsert(
      {
        company_id: companyId,
        tier: planName,
        included_chat_messages: plan.chat_messages,
        included_rerenders: plan.renders,
        included_projects: 999,
        included_voice_minutes: 0,
        included_proposals: plan.proposals_per_month,
        included_renders: plan.renders,
        included_seats: plan.seats,
        spending_cap_cents: plan.spending_cap_cents,
        // Reset usage counters
        chat_messages_used: 0,
        rerenders_used: 0,
        projects_used: 0,
        voice_minutes_used: 0,
        proposals_used: 0,
        renders_used: 0,
        spending_used_cents: 0,
      },
      { onConflict: 'company_id' },
    );

  // Update company plan
  await supabase
    .from('companies')
    .update({ plan: planName, updated_at: new Date().toISOString() })
    .eq('id', companyId);
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

  const supabase = await createServiceClient();

  // =====================================================================
  // checkout.session.completed — new subscription or one-time addon
  // =====================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const companyId = session.metadata?.company_id;
    const userId = session.metadata?.user_id;
    const productType = session.metadata?.product_type;
    const productName = session.metadata?.product_name;

    if (!companyId || !productType || !productName) {
      console.error('Stripe webhook: missing metadata on checkout.session.completed');
      return NextResponse.json({ received: true });
    }

    // Record the purchase
    await supabase.from('purchases').insert({
      user_id: userId ?? null,
      company_id: companyId,
      product_type: productType,
      product_name: productName,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      amount_cents: session.amount_total ?? 0,
      status: 'succeeded',
    });

    if (productType === 'plan') {
      // Store subscription ID on company
      if (session.subscription) {
        await supabase
          .from('companies')
          .update({
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', companyId);
      }

      // Provision entitlements
      await provisionPlan(supabase, companyId, productName);
    } else if (productType === 'addon') {
      const addon = B2B_ADDONS[productName as B2BAddonName];
      if (addon) {
        const fieldMap: Record<string, string> = {
          chat_messages: 'included_chat_messages',
          proposals: 'included_proposals',
          renders: 'included_renders',
          voice_minutes: 'included_voice_minutes',
          seats: 'included_seats',
        };

        for (const [addonField, entitlementField] of Object.entries(fieldMap)) {
          if (addonField in addon) {
            const amount = (addon as Record<string, unknown>)[addonField] as number;
            if (amount > 0) {
              await supabase.rpc('increment_entitlement_field', {
                p_company_id: companyId,
                p_field: entitlementField,
                p_amount: amount,
              });
            }
          }
        }
      }
    }
  }

  // =====================================================================
  // invoice.paid — subscription renewed (monthly cycle)
  // =====================================================================
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;

    // Only process subscription invoices (not the first one which is handled above)
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      // Look up the subscription to get metadata
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string,
      );

      const companyId = subscription.metadata?.company_id;
      const productName = subscription.metadata?.product_name;

      if (companyId && productName) {
        // Reset monthly usage counters and re-provision plan limits
        await provisionPlan(supabase, companyId, productName);

        // Record purchase for billing history
        await supabase.from('purchases').insert({
          company_id: companyId,
          user_id: subscription.metadata?.user_id ?? null,
          product_type: 'plan',
          product_name: productName,
          stripe_customer_id: invoice.customer as string,
          stripe_payment_intent_id: invoice.payment_intent as string,
          amount_cents: invoice.amount_paid ?? 0,
          status: 'succeeded',
        });
      }
    }
  }

  // =====================================================================
  // customer.subscription.updated — plan change or trial ending
  // =====================================================================
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const companyId = subscription.metadata?.company_id;

    if (companyId) {
      // If subscription becomes active (e.g. trial converted), ensure entitlements
      if (subscription.status === 'active') {
        const productName = subscription.metadata?.product_name;
        if (productName) {
          await provisionPlan(supabase, companyId, productName);
        }
      }

      // If subscription becomes past_due or unpaid, could warn but keep active
      if (subscription.status === 'past_due') {
        console.warn(`Subscription past_due for company ${companyId}`);
      }
    }
  }

  // =====================================================================
  // customer.subscription.deleted — cancellation
  // =====================================================================
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const companyId = subscription.metadata?.company_id;

    if (companyId) {
      // Downgrade company to no plan
      await supabase
        .from('entitlements')
        .update({ tier: 'none' })
        .eq('company_id', companyId);

      await supabase
        .from('companies')
        .update({
          plan: 'none',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);
    }
  }

  return NextResponse.json({ received: true });
}
