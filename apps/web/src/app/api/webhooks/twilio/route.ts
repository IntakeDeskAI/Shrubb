import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a TwiML XML response. Pass `null` for an empty <Response/>. */
function twiml(message: string | null, status = 200): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalise a phone number to 10-digit US format (no country code, no
 * punctuation). Handles "+15551234567", "15551234567", "5551234567", etc.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/twilio
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ---- 1. Validate shared secret ----
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expectedToken = process.env.TWILIO_WEBHOOK_SECRET;

    if (expectedToken && token !== expectedToken) {
      // Return 200 with empty TwiML so Twilio doesn't retry
      console.warn('Twilio webhook: invalid token');
      return twiml(null);
    }

    // ---- 2. Parse form data ----
    const formData = await request.formData();
    const from = (formData.get('From') as string) ?? '';
    const body = (formData.get('Body') as string) ?? '';
    const messageSid = (formData.get('MessageSid') as string) ?? '';
    const numMedia = parseInt((formData.get('NumMedia') as string) ?? '0', 10);
    const mediaUrl0 = (formData.get('MediaUrl0') as string) ?? '';
    const mediaContentType0 = (formData.get('MediaContentType0') as string) ?? '';

    if (!from) {
      console.warn('Twilio webhook: missing From field');
      return twiml(null);
    }

    const supabase = await createServiceClient();

    // ---- 3. Look up user by phone number ----
    const phoneNormalized = normalizePhone(from);

    // Try both the raw E.164 and the normalized 10-digit form
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .or(`phone.eq.${from},phone.eq.${phoneNormalized},phone.eq.+1${phoneNormalized}`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Twilio webhook: profile lookup error', profileError);
      return twiml(null);
    }

    if (!profile) {
      return twiml(
        "This number isn't linked to a Shrubb account. Sign up at shrubb.com"
      );
    }

    const userId = profile.id;

    // ---- 4. Find user's most recent active project ----
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['setup', 'active', 'planning'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      console.error('Twilio webhook: project lookup error', projectError);
      return twiml(null);
    }

    if (!project) {
      return twiml(
        "You don't have an active project. Start one at shrubb.com/app"
      );
    }

    const projectId = project.id;

    // ---- 5. Check entitlements ----
    const { data: hasCredit, error: creditError } = await supabase.rpc(
      'increment_chat_usage',
      { p_user_id: userId }
    );

    if (creditError) {
      console.error('Twilio webhook: credit check error', creditError);
      return twiml(null);
    }

    if (hasCredit === false) {
      return twiml(
        "You've used all your chat messages. Purchase a Chat Pack at shrubb.com/app/settings"
      );
    }

    // ---- 6. Handle MMS media ----
    const mediaUrls: string[] = [];

    if (numMedia > 0 && mediaUrl0) {
      try {
        // Download the media from Twilio (requires basic auth)
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? '';
        const authHeader = `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`;

        const mediaResponse = await fetch(mediaUrl0, {
          headers: { Authorization: authHeader },
        });

        if (mediaResponse.ok) {
          const mediaBuffer = await mediaResponse.arrayBuffer();
          const ext = mediaContentType0.includes('png') ? 'png' : 'jpg';
          const storagePath = `${userId}/${projectId}/sms-${messageSid}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('inputs')
            .upload(storagePath, mediaBuffer, {
              contentType: mediaContentType0 || 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error('Twilio webhook: media upload error', uploadError);
          } else {
            // Create project_input record
            await supabase.from('project_inputs').insert({
              project_id: projectId,
              input_type: 'photo',
              storage_path: storagePath,
            });

            mediaUrls.push(storagePath);
          }
        } else {
          console.error(
            'Twilio webhook: failed to download media',
            mediaResponse.status
          );
        }
      } catch (err) {
        console.error('Twilio webhook: media handling error', err);
      }
    }

    // ---- 7. Insert message ----
    const messageContent = body.trim() || (numMedia > 0 ? '[Photo]' : '');

    if (!messageContent) {
      // Nothing to process — empty message with no media
      return twiml(null);
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: 'user',
        content: messageContent,
        channel: 'sms',
        external_id: messageSid,
        media_urls: mediaUrls.length > 0 ? mediaUrls : [],
      })
      .select('id')
      .single();

    if (messageError || !message) {
      console.error('Twilio webhook: message insert error', messageError);
      return twiml(null);
    }

    // ---- 8. Queue classifier + chat_response jobs ----
    const { error: classifierError } = await supabase.from('jobs').insert({
      user_id: userId,
      project_id: projectId,
      type: 'classifier',
      status: 'queued',
      payload: {
        message_id: message.id,
        project_id: projectId,
        content: messageContent,
      },
    });

    if (classifierError) {
      console.error('Twilio webhook: classifier job error', classifierError);
    }

    const { error: chatJobError } = await supabase.from('jobs').insert({
      user_id: userId,
      project_id: projectId,
      type: 'chat_response',
      status: 'queued',
      payload: {
        project_id: projectId,
        message_id: message.id,
        user_id: userId,
      },
    });

    if (chatJobError) {
      console.error('Twilio webhook: chat_response job error', chatJobError);
    }

    // ---- 9. Return acknowledgment ----
    if (numMedia > 0) {
      return twiml(
        "Photo received! We'll incorporate it into your design."
      );
    }

    return twiml("Got it! Working on your request...");
  } catch (err) {
    // Always return 200 to prevent Twilio retries
    console.error('Twilio webhook: unhandled error', err);
    return twiml(null);
  }
}
