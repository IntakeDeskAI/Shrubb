// ---------------------------------------------------------------------------
// Twilio SMS send utility
// Uses the Twilio REST API directly (no SDK needed).
// ---------------------------------------------------------------------------

interface SendSmsParams {
  to: string;        // Phone number in E.164 format (+1XXXXXXXXXX)
  body: string;      // Message text
  mediaUrl?: string; // Optional MMS image URL
}

export async function sendSms(
  params: SendSmsParams,
): Promise<{ messageSid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'Missing Twilio configuration. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set.',
    );
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: fromNumber,
    To: params.to,
    Body: params.body,
  });

  if (params.mediaUrl) {
    body.append('MediaUrl', params.mediaUrl);
  }

  const credentials = btoa(`${accountSid}:${authToken}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Twilio API error (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as { sid: string };

  return { messageSid: data.sid };
}
