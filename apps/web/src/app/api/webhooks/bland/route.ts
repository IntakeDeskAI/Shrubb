import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Bland.ai webhook payload shape (partial — only fields we use)
// ---------------------------------------------------------------------------

interface BlandWebhookPayload {
  call_id: string;
  from: string;
  to: string;
  transcript: string | null;
  duration_minutes: number;
  status: string; // 'completed', 'failed', 'no-answer', etc.
  ended_reason: string | null;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/bland
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ---- 1. Validate shared secret ----
    const authHeader = request.headers.get('authorization') ?? '';
    const expectedSecret = process.env.BLAND_WEBHOOK_SECRET;

    if (expectedSecret) {
      // Accept "Bearer <secret>" or plain secret
      const provided = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (provided !== expectedSecret) {
        console.warn('Bland webhook: invalid authorization');
        return NextResponse.json({ received: true }, { status: 200 });
      }
    }

    // ---- 2. Parse JSON body ----
    let payload: BlandWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      console.warn('Bland webhook: invalid JSON body');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const {
      call_id,
      from: callerPhone,
      status,
      transcript,
      duration_minutes,
    } = payload;

    if (!call_id || !callerPhone) {
      console.warn('Bland webhook: missing call_id or from');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const supabase = await createServiceClient();

    // ---- 3. Look up user by phone number ----
    const phoneNormalized = normalizePhone(callerPhone);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .or(
        `phone.eq.${callerPhone},phone.eq.${phoneNormalized},phone.eq.+1${phoneNormalized}`
      )
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Bland webhook: profile lookup error', profileError);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!profile) {
      console.warn(
        `Bland webhook: no user found for phone ${callerPhone} (call ${call_id})`
      );
      return NextResponse.json({ received: true }, { status: 200 });
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
      console.error('Bland webhook: project lookup error', projectError);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!project) {
      console.warn(
        `Bland webhook: no active project for user ${userId} (call ${call_id})`
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const projectId = project.id;

    // ---- 5. Process completed calls with transcripts ----
    if (status === 'completed' && transcript && transcript.trim().length > 0) {
      // 5a. Increment voice minutes usage
      const minutes = Math.ceil(duration_minutes || 1);
      const { data: voiceAllowed, error: voiceError } = await supabase.rpc(
        'increment_voice_usage',
        { p_user_id: userId, p_minutes: minutes }
      );

      if (voiceError) {
        console.error('Bland webhook: voice usage error', voiceError);
      } else if (voiceAllowed === false) {
        console.warn(
          `Bland webhook: voice minutes exceeded for user ${userId} (call ${call_id})`
        );
      }

      // 5b. Insert message with full transcript
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: 'user',
          content: transcript.trim(),
          channel: 'voice',
          external_id: call_id,
        })
        .select('id')
        .single();

      if (messageError || !message) {
        console.error('Bland webhook: message insert error', messageError);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // 5c. Queue classifier + chat_response jobs
      const { error: classifierError } = await supabase.from('jobs').insert({
        user_id: userId,
        project_id: projectId,
        type: 'classifier',
        status: 'queued',
        payload: {
          message_id: message.id,
          project_id: projectId,
          content: transcript.trim(),
        },
      });

      if (classifierError) {
        console.error('Bland webhook: classifier job error', classifierError);
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
        console.error('Bland webhook: chat_response job error', chatJobError);
      }
    }

    // ---- 6. Return 200 OK ----
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Always return 200 to prevent Bland retries
    console.error('Bland webhook: unhandled error', err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
