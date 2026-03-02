import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// POST /api/demo-request
// Public endpoint — collects demo request, rate-limits, sends SMS via Twilio
// ---------------------------------------------------------------------------

const DEMO_NUMBER = '(208) 600-1285';
const DEMO_NUMBER_E164 = '+12086001285';
const MAX_REQUESTS_PER_DAY = 3;

/** Normalize phone to E.164 */
function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

/** Hash IP for rate limiting (no PII stored) */
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/** Validate E.164 phone (US/CA) */
function isValidPhone(phone: string): boolean {
  return /^\+1\d{10}$/.test(phone);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      company_name,
      phone,
      email,
      utm_source,
      utm_campaign,
      utm_medium,
      company_website, // honeypot field
    } = body;

    // ---- Bot protection: honeypot ----
    if (company_website) {
      // Bots fill hidden fields; silently accept
      return NextResponse.json({ success: true, demo_number: DEMO_NUMBER });
    }

    // ---- Validate required fields ----
    if (!first_name?.trim() || !company_name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'First name, company name, and phone are required.' },
        { status: 400 },
      );
    }

    const phoneE164 = normalizeE164(phone.trim());
    if (!isValidPhone(phoneE164)) {
      return NextResponse.json(
        { error: 'Please enter a valid US phone number.' },
        { status: 400 },
      );
    }

    // ---- Rate limiting ----
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = hashIp(ip);
    const supabase = await createServiceClient();

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    // Check by phone
    const { count: phoneCount } = await supabase
      .from('demo_requests')
      .select('id', { count: 'exact', head: true })
      .eq('phone_e164', phoneE164)
      .gte('created_at', twentyFourHoursAgo);

    if ((phoneCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        { error: 'You\'ve already requested a demo today. Try again tomorrow!' },
        { status: 429 },
      );
    }

    // Check by IP
    const { count: ipCount } = await supabase
      .from('demo_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', twentyFourHoursAgo);

    if ((ipCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        { error: 'Too many requests from this network. Try again tomorrow!' },
        { status: 429 },
      );
    }

    // ---- Insert demo request ----
    const userAgent = req.headers.get('user-agent') || null;

    const { error: insertError } = await supabase.from('demo_requests').insert({
      first_name: first_name.trim(),
      company_name: company_name.trim(),
      phone_e164: phoneE164,
      email: email?.trim() || null,
      ip_hash: ipHash,
      user_agent: userAgent,
      demo_number: DEMO_NUMBER_E164,
      source: 'homepage_modal',
      utm_source: utm_source || null,
      utm_campaign: utm_campaign || null,
      utm_medium: utm_medium || null,
    });

    if (insertError) {
      console.error('[demo-request] Insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 },
      );
    }

    // ---- Send SMS via Twilio ----
    let smsSent = false;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const smsBody = new URLSearchParams({
          From: twilioFrom,
          To: phoneE164,
          Body: `Hey ${first_name.trim()}! Here's your Shrubb demo number: ${DEMO_NUMBER}\n\nCall it now to see AI in action.\n\nStart your free trial: https://www.shrubb.com/signup`,
        });

        const smsRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: smsBody.toString(),
          },
        );

        if (smsRes.ok) {
          smsSent = true;
        } else {
          const errText = await smsRes.text();
          console.error('[demo-request] Twilio error:', smsRes.status, errText);
        }
      } catch (smsErr) {
        console.error('[demo-request] SMS send failed:', smsErr);
      }

      // Update sms_sent flag
      if (smsSent) {
        await supabase
          .from('demo_requests')
          .update({ sms_sent: true })
          .eq('phone_e164', phoneE164)
          .order('created_at', { ascending: false })
          .limit(1);
      }
    } else {
      console.warn('[demo-request] Twilio not configured, skipping SMS');
    }

    return NextResponse.json({
      success: true,
      demo_number: DEMO_NUMBER,
      demo_number_e164: DEMO_NUMBER_E164,
      sms_sent: smsSent,
      instructions:
        'Call the demo number to experience Shrubb AI answering your call. We also texted you the details.',
    });
  } catch (err) {
    console.error('[demo-request] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
