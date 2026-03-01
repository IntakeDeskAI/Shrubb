import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/webhooks/twilio/voice-status
//
// Status callback for call completion. Updates call record with final status
// and recording URL.
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expectedToken = process.env.TWILIO_WEBHOOK_SECRET;

    if (expectedToken && token !== expectedToken) {
      console.warn('[voice-status] Invalid token');
      return new Response('OK', { status: 200 });
    }

    const formData = await request.formData();
    const callSid = (formData.get('CallSid') as string) ?? '';
    const callStatus = (formData.get('CallStatus') as string) ?? '';
    const recordingUrl = (formData.get('RecordingUrl') as string) ?? '';

    if (!callSid) {
      return new Response('OK', { status: 200 });
    }

    const supabase = await createServiceClient();

    const updateData: Record<string, unknown> = {
      status: callStatus || 'completed',
      ended_at: new Date().toISOString(),
    };

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('provider_call_id', callSid);

    if (error) {
      console.error('[voice-status] Failed to update call', error);
    } else {
      console.log(`[voice-status] Updated call ${callSid} to ${callStatus}`);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[voice-status] Unhandled error', err);
    return new Response('OK', { status: 200 });
  }
}
