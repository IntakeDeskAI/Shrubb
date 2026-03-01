import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { B2B_PLANS, B2B_ADDONS, type B2BPlanName, type B2BAddonName } from '@landscape-ai/shared';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve company
  const company = await getActiveCompany(supabase, user.id);
  if (!company) {
    return NextResponse.json({ error: 'No company. Complete onboarding first.' }, { status: 403 });
  }

  // Parse body - support both JSON and FormData
  let productType: string;
  let productName: string;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await request.json();
    productType = json.product_type;
    productName = json.product_name;
  } else {
    const formData = await request.formData();
    productType = formData.get('product_type') as string;
    productName = formData.get('product_name') as string;
  }

  if (!productType || !productName) {
    return NextResponse.json(
      { error: 'Missing product_type or product_name' },
      { status: 400 },
    );
  }

  // Look up pricing
  let priceCents: number;
  let displayName: string;
  let isSubscription = false;
  let trialDays = 0;

  if (productType === 'plan') {
    const config = B2B_PLANS[productName as B2BPlanName];
    if (!config) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
    }
    priceCents = config.price_cents;
    displayName = `Shrubb ${config.label} Plan`;
    isSubscription = config.interval === 'month';
    trialDays = 'trial_days' in config ? (config.trial_days as number) : 0;
  } else if (productType === 'addon') {
    const config = B2B_ADDONS[productName as B2BAddonName];
    if (!config) {
      return NextResponse.json({ error: 'Invalid addon name' }, { status: 400 });
    }
    priceCents = config.price_cents;
    displayName = `Shrubb Add-on: ${config.label}`;
  } else {
    return NextResponse.json({ error: 'Invalid product_type' }, { status: 400 });
  }

  const stripe = getStripe();
  const serviceClient = await createServiceClient();

  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'https';
  const origin = `${protocol}://${host}`;

  // Get or create Stripe customer for the company
  const { data: companyRow } = await serviceClient
    .from('companies')
    .select('stripe_customer_id')
    .eq('id', company.companyId)
    .single();

  let customerId = companyRow?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: company.companyName,
      metadata: {
        company_id: company.companyId,
        user_id: user.id,
      },
    });
    customerId = customer.id;

    // Store customer ID on the company
    await serviceClient
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', company.companyId);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: displayName,
          },
          unit_amount: priceCents,
          ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      },
    ],
    mode: isSubscription ? 'subscription' : 'payment',
    success_url: `${origin}/start/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/start?canceled=true`,
    metadata: {
      company_id: company.companyId,
      user_id: user.id,
      product_type: productType,
      product_name: productName,
    },
    ...(isSubscription
      ? {
          subscription_data: {
            metadata: {
              company_id: company.companyId,
              user_id: user.id,
              product_type: productType,
              product_name: productName,
            },
            ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
          },
        }
      : {}),
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  // If this was a form submission, redirect directly
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(session.url!, 303);
  }

  return NextResponse.json({ url: session.url });
}
