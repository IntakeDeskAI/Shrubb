// ---------------------------------------------------------------------------
// Job handler: provision_phone
// Searches Twilio for a local number by area code, buys it,
// configures SMS + Voice webhooks, and stores the mapping.
// ---------------------------------------------------------------------------

import type { WorkerSupabase } from '../index.js';

const TWILIO_API = 'https://api.twilio.com/2010-04-01';

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

interface TwilioAvailableNumber {
  phone_number: string;
  friendly_name: string;
}

interface TwilioIncomingNumber {
  sid: string;
  phone_number: string;
}

export async function handleProvisionPhone(
  supabase: WorkerSupabase,
  payload: Record<string, unknown>,
  userId: string,
  companyId: string,
): Promise<Record<string, unknown>> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const areaCode = (payload.area_code as string) || '';
  const webhookBase = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://shrubb.com';

  // Check if company already has a number
  const { data: existing } = await supabase
    .from('phone_numbers')
    .select('id, phone_e164')
    .eq('account_id', companyId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { phone_e164: existing.phone_e164, already_provisioned: true };
  }

  // 1. Search for available local numbers
  const searchParams = new URLSearchParams({
    VoiceEnabled: 'true',
    SmsEnabled: 'true',
    MmsEnabled: 'true',
  });
  if (areaCode) {
    searchParams.set('AreaCode', areaCode);
  }

  const searchUrl = `${TWILIO_API}/Accounts/${accountSid}/AvailablePhoneNumbers/US/Local.json?${searchParams}`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: twilioAuth() },
  });

  if (!searchRes.ok) {
    const errBody = await searchRes.text();
    throw new Error(`Twilio search failed (${searchRes.status}): ${errBody}`);
  }

  const searchData = (await searchRes.json()) as {
    available_phone_numbers: TwilioAvailableNumber[];
  };

  if (!searchData.available_phone_numbers?.length) {
    throw new Error(`No available phone numbers for area code: ${areaCode || 'any'}`);
  }

  const chosen = searchData.available_phone_numbers[0];

  // 2. Purchase the number
  const webhookSecret = process.env.TWILIO_WEBHOOK_SECRET || '';
  const smsWebhookUrl = `${webhookBase}/api/webhooks/twilio/sms?token=${webhookSecret}`;
  const voiceWebhookUrl = `${webhookBase}/api/webhooks/twilio/voice?token=${webhookSecret}`;
  const statusCallbackUrl = `${webhookBase}/api/webhooks/twilio/voice-status?token=${webhookSecret}`;

  const buyBody = new URLSearchParams({
    PhoneNumber: chosen.phone_number,
    SmsUrl: smsWebhookUrl,
    SmsMethod: 'POST',
    VoiceUrl: voiceWebhookUrl,
    VoiceMethod: 'POST',
    StatusCallback: statusCallbackUrl,
    StatusCallbackMethod: 'POST',
  });

  const buyUrl = `${TWILIO_API}/Accounts/${accountSid}/IncomingPhoneNumbers.json`;

  const buyRes = await fetch(buyUrl, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buyBody.toString(),
  });

  if (!buyRes.ok) {
    const errBody = await buyRes.text();
    throw new Error(`Twilio purchase failed (${buyRes.status}): ${errBody}`);
  }

  const purchased = (await buyRes.json()) as TwilioIncomingNumber;

  // 3. Extract area code from purchased number
  const phoneDigits = purchased.phone_number.replace(/\D/g, '');
  const extractedAreaCode = phoneDigits.length >= 4 ? phoneDigits.slice(1, 4) : '';

  // 4. Save to DB
  const { error: insertError } = await supabase
    .from('phone_numbers')
    .insert({
      account_id: companyId,
      provider: 'twilio',
      phone_e164: purchased.phone_number,
      area_code: extractedAreaCode,
      status: 'active',
    });

  if (insertError) {
    throw new Error(`Failed to save phone number: ${insertError.message}`);
  }

  // 5. Create default company_settings if not exists
  const { data: existingSettings } = await supabase
    .from('company_settings')
    .select('id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!existingSettings) {
    await supabase.from('company_settings').insert({
      company_id: companyId,
    });
  }

  console.log(`[provision_phone] Provisioned ${purchased.phone_number} for company ${companyId}`);

  return {
    phone_e164: purchased.phone_number,
    twilio_sid: purchased.sid,
    area_code: extractedAreaCode,
  };
}
