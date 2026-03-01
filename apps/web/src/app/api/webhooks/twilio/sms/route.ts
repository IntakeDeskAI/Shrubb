import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STOP_KEYWORDS = ['stop', 'end', 'unsubscribe', 'cancel', 'quit'];
const HUMAN_KEYWORDS = ['call me', 'agent', 'human', 'owner', 'speak to someone', 'talk to someone'];

function twiml(message: string | null, status = 200): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, { status, headers: { 'Content-Type': 'text/xml' } });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isWithinBusinessHours(
  startStr: string,
  endStr: string,
  timezone: string,
): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    const nowMinutes = hour * 60 + minute;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  } catch {
    return true; // If timezone parsing fails, allow messages
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/twilio/sms
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Validate shared secret
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expectedToken = process.env.TWILIO_WEBHOOK_SECRET;

    if (expectedToken && token !== expectedToken) {
      console.warn('[sms-webhook] Invalid token');
      return twiml(null);
    }

    // 2. Parse form data
    const formData = await request.formData();
    const from = (formData.get('From') as string) ?? '';
    const to = (formData.get('To') as string) ?? '';
    const body = (formData.get('Body') as string) ?? '';
    const messageSid = (formData.get('MessageSid') as string) ?? '';

    if (!from || !to) {
      console.warn('[sms-webhook] Missing From or To');
      return twiml(null);
    }

    const supabase = await createServiceClient();

    // 3. Lookup phone_numbers by To number to find account
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('id, account_id')
      .eq('phone_e164', to)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (phoneError || !phoneNumber) {
      console.warn(`[sms-webhook] No active phone number found for ${to}`);
      return twiml(null);
    }

    const accountId = phoneNumber.account_id;
    const phoneNumberId = phoneNumber.id;

    // 4. Load company settings for business hours + AI toggle
    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', accountId)
      .maybeSingle();

    // Check AI SMS enabled
    if (settings && !settings.ai_sms_enabled) {
      console.log(`[sms-webhook] AI SMS disabled for company ${accountId}`);
      return twiml(null);
    }

    // Check business hours
    if (settings && !isWithinBusinessHours(
      settings.business_hours_start,
      settings.business_hours_end,
      settings.business_hours_timezone,
    )) {
      console.log(`[sms-webhook] Outside business hours for company ${accountId}`);
      return twiml(
        "Thanks for reaching out! We're currently outside business hours. We'll get back to you first thing."
      );
    }

    // 5. Upsert lead by From number
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, do_not_contact')
      .eq('account_id', accountId)
      .eq('phone', from)
      .maybeSingle();

    const trimmedBody = body.trim();
    const lowerBody = trimmedBody.toLowerCase();

    // STOP handling
    if (STOP_KEYWORDS.some((kw) => lowerBody === kw)) {
      if (existingLead) {
        await supabase
          .from('leads')
          .update({ do_not_contact: true, updated_at: new Date().toISOString() })
          .eq('id', existingLead.id);
      } else {
        await supabase.from('leads').insert({
          account_id: accountId,
          phone: from,
          do_not_contact: true,
        });
      }
      console.log(`[sms-webhook] STOP received from ${from}, marked do_not_contact`);
      return twiml(
        'You have been unsubscribed and will no longer receive messages. Reply START to re-subscribe.'
      );
    }

    // Check do_not_contact
    if (existingLead?.do_not_contact) {
      console.log(`[sms-webhook] Message from do_not_contact lead ${from}, ignoring`);
      return twiml(null);
    }

    let leadId: string;
    if (existingLead) {
      leadId = existingLead.id;
      await supabase
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', leadId);
    } else {
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({ account_id: accountId, phone: from })
        .select('id')
        .single();

      if (leadError || !newLead) {
        console.error('[sms-webhook] Failed to create lead', leadError);
        return twiml(null);
      }
      leadId = newLead.id;
    }

    // 6. Create or reuse conversation
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id, first_inbound_at, first_response_at')
      .eq('account_id', accountId)
      .eq('lead_id', leadId)
      .eq('phone_number_id', phoneNumberId)
      .eq('channel', 'sms')
      .maybeSingle();

    const now = new Date().toISOString();
    let conversationId: string;
    let isNewConversation = false;
    if (existingConvo) {
      conversationId = existingConvo.id;
      // Set first_inbound_at if not already set
      const updateData: Record<string, unknown> = { updated_at: now };
      if (!existingConvo.first_inbound_at) {
        updateData.first_inbound_at = now;
      }
      await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);
    } else {
      isNewConversation = true;
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          account_id: accountId,
          lead_id: leadId,
          phone_number_id: phoneNumberId,
          channel: 'sms',
          first_inbound_at: now,
        })
        .select('id')
        .single();

      if (convoError || !newConvo) {
        console.error('[sms-webhook] Failed to create conversation', convoError);
        return twiml(null);
      }
      conversationId = newConvo.id;
    }

    // 7. Store inbound message
    if (!trimmedBody) {
      return twiml(null);
    }

    const { data: inboundMsg, error: msgError } = await supabase
      .from('sms_messages')
      .insert({
        conversation_id: conversationId,
        direction: 'inbound',
        body: trimmedBody,
        provider_id: messageSid,
      })
      .select('id')
      .single();

    if (msgError || !inboundMsg) {
      console.error('[sms-webhook] Failed to store message', msgError);
      return twiml(null);
    }

    // 8. Check human handoff keywords
    if (HUMAN_KEYWORDS.some((kw) => lowerBody.includes(kw))) {
      console.log(`[sms-webhook] Human handoff requested by ${from}`);
      // Store outbound response
      await supabase.from('sms_messages').insert({
        conversation_id: conversationId,
        direction: 'outbound',
        body: "I'll connect you with the team right away. Someone will reach out shortly.",
      });
      return twiml(
        "I'll connect you with the team right away. Someone will reach out shortly."
      );
    }

    // 9. Generate AI reply
    // Get company context for the AI
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', accountId)
      .single();

    const companyName = company?.name || 'our team';

    // Fetch recent messages for context
    const { data: recentMessages } = await supabase
      .from('sms_messages')
      .select('direction, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = (recentMessages ?? [])
      .reverse()
      .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'AI'}: ${m.body}`)
      .join('\n');

    // Call OpenAI for response
    const openaiKey = process.env.OPENAI_API_KEY;
    let aiReply = `Thanks for reaching out to ${companyName}! We received your message and will follow up shortly.`;

    if (openaiKey) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 200,
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant for ${companyName}, a landscaping company. You respond to inbound text messages from potential customers. Be friendly, professional, and helpful. Keep responses brief (under 160 characters if possible, max 300). Ask about their landscaping needs, timeline, and property address. Do not make up pricing or commit to schedules. If they ask for a quote, let them know you'll gather their info and have the team follow up with a detailed proposal.`,
              },
              {
                role: 'user',
                content: `Conversation so far:\n${conversationHistory}\n\nRespond to the latest customer message.`,
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = (await aiRes.json()) as {
            choices: Array<{ message: { content: string } }>;
          };
          const generated = aiData.choices?.[0]?.message?.content?.trim();
          if (generated) {
            aiReply = generated;
          }
        }
      } catch (aiErr) {
        console.error('[sms-webhook] AI generation failed, using fallback', aiErr);
      }
    }

    // 10. Send outbound SMS reply using Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN!;

    const sendBody = new URLSearchParams({
      From: to,  // Reply from the same Shrubb number
      To: from,
      Body: aiReply,
    });

    const sendRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: sendBody.toString(),
      },
    );

    let outboundSid: string | null = null;
    if (sendRes.ok) {
      const sendData = (await sendRes.json()) as { sid: string };
      outboundSid = sendData.sid;
    } else {
      console.error('[sms-webhook] Failed to send SMS reply', await sendRes.text());
    }

    // 11. Store outbound message
    await supabase.from('sms_messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      body: aiReply,
      provider_id: outboundSid,
    });

    // 12. Track first response time
    const needsResponseTracking = isNewConversation || !existingConvo?.first_response_at;
    if (needsResponseTracking) {
      await supabase
        .from('conversations')
        .update({ first_response_at: new Date().toISOString() })
        .eq('id', conversationId)
        .is('first_response_at', null);
    }

    console.log(`[sms-webhook] Processed SMS from ${from} to account ${accountId}`);

    // Return empty TwiML (we already sent the reply via API)
    return twiml(null);
  } catch (err) {
    console.error('[sms-webhook] Unhandled error', err);
    return twiml(null);
  }
}
