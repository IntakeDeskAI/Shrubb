import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // ---- 1. Auth check ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ---- 2. Parse body ----
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone } = body;

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  // Normalise to digits only
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    return NextResponse.json(
      { error: 'Please enter a valid phone number' },
      { status: 400 }
    );
  }

  // ---- 3. Generate 6-digit code ----
  const verificationCode = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  // ---- 4. Store phone and code on profile ----
  // For MVP: set phone, set phone_verified = false, and log the code.
  // In production this would call the Twilio Verify API instead.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      phone: digits,
      phone_verified: false,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('send-code: profile update error', updateError);
    return NextResponse.json(
      { error: 'Failed to save phone number' },
      { status: 500 }
    );
  }

  // TODO: Replace with Twilio Verify API in production
  // For now, log the code so it can be used during development
  console.log(
    `[PHONE VERIFY] Code for user ${user.id} (${digits}): ${verificationCode}`
  );

  // ---- 5. Return success ----
  return NextResponse.json({ sent: true });
}
