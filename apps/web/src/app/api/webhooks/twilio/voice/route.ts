import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HUMAN_KEYWORDS = ['call me', 'agent', 'human', 'owner', 'speak to someone', 'talk to someone', 'real person'];

function voiceTwiml(xml: string, status = 200): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`,
    { status, headers: { 'Content-Type': 'text/xml' } },
  );
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
    return true;
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/twilio/voice
//
// Handles inbound calls with up to 2 LLM-driven turns using
// TwiML <Gather> with speech input + <Say>.
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expectedToken = process.env.TWILIO_WEBHOOK_SECRET;

    if (expectedToken && token !== expectedToken) {
      console.warn('[voice-webhook] Invalid token');
      return voiceTwiml('<Say>An error occurred. Goodbye.</Say><Hangup/>');
    }

    const formData = await request.formData();
    const from = (formData.get('From') as string) ?? '';
    const to = (formData.get('To') as string) ?? '';
    const callSid = (formData.get('CallSid') as string) ?? '';
    const speechResult = (formData.get('SpeechResult') as string) ?? '';
    const turnParam = url.searchParams.get('turn') || '0';
    const turn = parseInt(turnParam, 10);

    if (!from || !to) {
      return voiceTwiml('<Say>Sorry, we could not process your call. Goodbye.</Say><Hangup/>');
    }

    const supabase = await createServiceClient();

    // Lookup phone number to find account
    const { data: phoneNumber } = await supabase
      .from('phone_numbers')
      .select('id, account_id')
      .eq('phone_e164', to)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!phoneNumber) {
      console.warn(`[voice-webhook] No phone number found for ${to}`);
      return voiceTwiml('<Say>This number is not configured. Goodbye.</Say><Hangup/>');
    }

    const accountId = phoneNumber.account_id;
    const phoneNumberId = phoneNumber.id;

    // Load company settings
    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', accountId)
      .maybeSingle();

    // Check AI calls enabled
    if (settings && !settings.ai_calls_enabled) {
      // If forwarding is enabled, forward the call
      if (settings.call_forwarding_enabled && settings.forward_phone_e164) {
        return voiceTwiml(
          `<Say>Please hold while we connect you.</Say><Dial>${escapeXml(settings.forward_phone_e164)}</Dial>`,
        );
      }
      return voiceTwiml(
        '<Say>Thank you for calling. Please leave a message after the beep.</Say><Record maxLength="120" transcribe="true" /><Say>Thank you. Goodbye.</Say>',
      );
    }

    // Check business hours
    if (settings && !isWithinBusinessHours(
      settings.business_hours_start,
      settings.business_hours_end,
      settings.business_hours_timezone,
    )) {
      return voiceTwiml(
        '<Say>Thank you for calling. We are currently outside of business hours. Please leave a message after the beep and we will get back to you.</Say><Record maxLength="120" transcribe="true" /><Say>Thank you. Goodbye.</Say>',
      );
    }

    // Load company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', accountId)
      .single();

    const companyName = company?.name || 'our landscaping team';

    // Upsert lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
      .eq('phone', from)
      .maybeSingle();

    let leadId: string;
    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({ account_id: accountId, phone: from })
        .select('id')
        .single();
      leadId = newLead!.id;
    }

    // Get or create voice conversation
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .eq('account_id', accountId)
      .eq('lead_id', leadId)
      .eq('phone_number_id', phoneNumberId)
      .eq('channel', 'voice')
      .maybeSingle();

    let conversationId: string;
    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          account_id: accountId,
          lead_id: leadId,
          phone_number_id: phoneNumberId,
          channel: 'voice',
        })
        .select('id')
        .single();
      conversationId = newConvo!.id;
    }

    // ---- TURN 0: Initial greeting with Gather ----
    if (turn === 0 && !speechResult) {
      // Create call record
      await supabase.from('calls').insert({
        conversation_id: conversationId,
        direction: 'inbound',
        provider_call_id: callSid,
        status: 'in-progress',
      });

      const webhookUrl = `${url.origin}/api/webhooks/twilio/voice?token=${token}&turn=1`;

      return voiceTwiml(
        `<Say>Hello! Thanks for calling ${escapeXml(companyName)}. I'm an AI assistant and I'd love to help you. What can I do for you today?</Say>` +
        `<Gather input="speech" timeout="10" speechTimeout="auto" action="${escapeXml(webhookUrl)}" method="POST">` +
        `<Say>Please go ahead and tell me what you need.</Say>` +
        `</Gather>` +
        `<Say>I didn't catch that. Let me transfer you.</Say>` +
        (settings?.call_forwarding_enabled && settings?.forward_phone_e164
          ? `<Dial>${escapeXml(settings.forward_phone_e164)}</Dial>`
          : `<Say>Please call back during business hours. Goodbye.</Say><Hangup/>`),
      );
    }

    // ---- TURNS 1-2: Process speech and respond ----
    if (speechResult && turn <= 2) {
      console.log(`[voice-webhook] Turn ${turn}, speech: "${speechResult}"`);

      // Check for human handoff
      const lowerSpeech = speechResult.toLowerCase();
      if (HUMAN_KEYWORDS.some((kw) => lowerSpeech.includes(kw))) {
        // Update call transcript
        await supabase
          .from('calls')
          .update({
            transcript_text: `Customer: ${speechResult}\nAI: Transferring to team.`,
            summary_text: 'Customer requested to speak with a human.',
          })
          .eq('conversation_id', conversationId)
          .eq('provider_call_id', callSid);

        if (settings?.call_forwarding_enabled && settings?.forward_phone_e164) {
          return voiceTwiml(
            `<Say>Of course! Let me connect you with the team right now.</Say>` +
            `<Dial>${escapeXml(settings.forward_phone_e164)}</Dial>`,
          );
        }

        return voiceTwiml(
          `<Say>Of course! Unfortunately, no one is available right now. Please leave a message after the beep.</Say>` +
          `<Record maxLength="120" transcribe="true" />` +
          `<Say>Thank you. Someone will call you back soon. Goodbye.</Say>`,
        );
      }

      // Generate AI response
      let aiReply = `Thank you for that information. We'll have someone from ${companyName} follow up with you shortly.`;
      const openaiKey = process.env.OPENAI_API_KEY;

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
              max_tokens: 150,
              messages: [
                {
                  role: 'system',
                  content: `You are an AI phone assistant for ${companyName}, a landscaping company. You are answering an inbound phone call. Be warm, professional, and concise. Your goal is to understand what the caller needs (landscaping service, quote, appointment, etc.) and collect their basic info. Keep responses to 2-3 sentences max — this will be read aloud. Do not make up pricing or schedules. If they want a quote, tell them the team will follow up with a detailed proposal.`,
                },
                { role: 'user', content: speechResult },
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
          console.error('[voice-webhook] AI generation failed', aiErr);
        }
      }

      // Build transcript so far
      const transcriptEntry = `Customer: ${speechResult}\nAI: ${aiReply}`;

      // Fetch existing transcript to append
      const { data: callRecord } = await supabase
        .from('calls')
        .select('transcript_text')
        .eq('conversation_id', conversationId)
        .eq('provider_call_id', callSid)
        .maybeSingle();

      const fullTranscript = callRecord?.transcript_text
        ? `${callRecord.transcript_text}\n${transcriptEntry}`
        : transcriptEntry;

      await supabase
        .from('calls')
        .update({ transcript_text: fullTranscript })
        .eq('conversation_id', conversationId)
        .eq('provider_call_id', callSid);

      // If this is the last turn (turn 2), wrap up
      if (turn >= 2) {
        // Generate summary
        let summary = `Call with customer from ${from}. ${speechResult}`;
        if (openaiKey) {
          try {
            const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 100,
                messages: [
                  {
                    role: 'system',
                    content: 'Summarize this call transcript in 1-2 sentences. Focus on what the customer needs.',
                  },
                  { role: 'user', content: fullTranscript },
                ],
              }),
            });
            if (summaryRes.ok) {
              const summaryData = (await summaryRes.json()) as {
                choices: Array<{ message: { content: string } }>;
              };
              const s = summaryData.choices?.[0]?.message?.content?.trim();
              if (s) summary = s;
            }
          } catch {
            // Use default summary
          }
        }

        await supabase
          .from('calls')
          .update({ summary_text: summary })
          .eq('conversation_id', conversationId)
          .eq('provider_call_id', callSid);

        return voiceTwiml(
          `<Say>${escapeXml(aiReply)} Thank you so much for calling ${escapeXml(companyName)}. Someone from our team will reach out to you soon. Have a great day!</Say><Hangup/>`,
        );
      }

      // Otherwise, do another Gather for next turn
      const nextWebhookUrl = `${url.origin}/api/webhooks/twilio/voice?token=${token}&turn=${turn + 1}`;

      return voiceTwiml(
        `<Say>${escapeXml(aiReply)}</Say>` +
        `<Gather input="speech" timeout="10" speechTimeout="auto" action="${escapeXml(nextWebhookUrl)}" method="POST">` +
        `<Say>Is there anything else I can help you with?</Say>` +
        `</Gather>` +
        `<Say>Thank you for calling ${escapeXml(companyName)}. Have a great day!</Say><Hangup/>`,
      );
    }

    // Fallback
    return voiceTwiml(
      `<Say>Thank you for calling. Goodbye.</Say><Hangup/>`,
    );
  } catch (err) {
    console.error('[voice-webhook] Unhandled error', err);
    return voiceTwiml('<Say>An error occurred. Please try again later. Goodbye.</Say><Hangup/>');
  }
}
