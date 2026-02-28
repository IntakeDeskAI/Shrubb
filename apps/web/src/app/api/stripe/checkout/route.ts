import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { TIER_CONFIG, ADDON_CONFIG, type TierName, type AddonName } from '@landscape-ai/shared';

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

  if (productType === 'tier') {
    const config = TIER_CONFIG[productName as TierName];
    if (!config) {
      return NextResponse.json({ error: 'Invalid tier name' }, { status: 400 });
    }
    priceCents = config.price_cents;
    displayName = `Shrubb ${config.label} Plan`;
  } else if (productType === 'addon') {
    const config = ADDON_CONFIG[productName as AddonName];
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

  // Try to find existing Stripe customer from previous purchases
  const { data: prevPurchase } = await serviceClient
    .from('purchases')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let customerId = prevPurchase?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: displayName,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/start/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/start?canceled=true`,
    metadata: {
      user_id: user.id,
      product_type: productType,
      product_name: productName,
    },
  });

  // If this was a form submission, redirect directly
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(session.url!, 303);
  }

  return NextResponse.json({ url: session.url });
}
