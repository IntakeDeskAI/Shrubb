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
  let body: { phone?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone, code } = body;

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'A valid 6-digit code is required' },
      { status: 400 }
    );
  }

  const digits = phone.replace(/\D/g, '');

  // ---- 3. Verify the code ----
  // TODO: In production, validate against Twilio Verify API.
  // For MVP, accept any valid 6-digit code.

  // Ensure the phone on the profile matches the one being verified
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }

  if (profile.phone !== digits) {
    return NextResponse.json(
      { error: 'Phone number does not match. Please request a new code.' },
      { status: 400 }
    );
  }

  // ---- 4. Mark phone as verified ----
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      phone_verified: true,
      sms_opt_in: true,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('verify-code: profile update error', updateError);
    return NextResponse.json(
      { error: 'Failed to verify phone number' },
      { status: 500 }
    );
  }

  // ---- 5. Return success ----
  return NextResponse.json({ verified: true });
}
