import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Bland.ai Sales Webhook — handles inbound calls to Shrubb's sales number
// Creates leads with qualification data from the Bland AI agent
// ---------------------------------------------------------------------------

/** Bland sends the structured analysis as JSON matching our prompt schema */
interface BlandAnalysis {
  caller_is_landscaping_company?: boolean;
  caller_name?: string;
  company_name?: string;
  service_city_state?: string;
  leads_per_week?: string;
  current_tools?: string;
  caller_phone?: string;
  email?: string;
  next_step?: string; // book_demo | start_trial | redirected | unknown
  notes?: string;
}

interface BlandSalesPayload {
  call_id: string;
  from: string;
  to: string;
  status: string;
  transcript?: string;
  concatenated_transcript?: string;
  recording_url?: string;
  call_length?: number; // seconds
  duration?: number; // minutes (some Bland versions)
  summary?: string;
  analysis?: BlandAnalysis | string;
  ended_reason?: string;
  // Bland may include additional metadata
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/bland/sales
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ---- 1. Validate shared secret ----
    const authHeader = request.headers.get('authorization') ?? '';
    const expectedSecret = process.env.BLAND_WEBHOOK_SECRET;

    if (expectedSecret) {
      const provided = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (provided !== expectedSecret) {
        console.warn('[bland-sales] Invalid authorization');
        return NextResponse.json({ received: true }, { status: 200 });
      }
    }

    // ---- 2. Parse JSON body ----
    let payload: BlandSalesPayload;
    try {
      payload = await request.json();
    } catch {
      console.warn('[bland-sales] Invalid JSON body');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log('[bland-sales] Received call:', payload.call_id, 'from:', payload.from, 'status:', payload.status);

    const {
      call_id,
      from: callerPhone,
      to: shrubbPhone,
      status,
      transcript: rawTranscript,
      concatenated_transcript,
      recording_url,
      call_length,
      duration,
      summary,
    } = payload;

    if (!call_id || !callerPhone) {
      console.warn('[bland-sales] Missing call_id or from');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Use concatenated_transcript if transcript is missing
    const transcript = rawTranscript || concatenated_transcript || null;

    // Parse analysis — may be a JSON string or object
    let analysis: BlandAnalysis = {};
    if (payload.analysis) {
      if (typeof payload.analysis === 'string') {
        try {
          analysis = JSON.parse(payload.analysis);
        } catch {
          console.warn('[bland-sales] Could not parse analysis JSON string');
        }
      } else {
        analysis = payload.analysis;
      }
    }

    // Calculate duration in seconds
    const durationSeconds = call_length
      ? Math.round(call_length)
      : duration
        ? Math.round(duration * 60)
        : null;

    const supabase = await createServiceClient();

    // ---- 3. Resolve Shrubb's account (the company that owns this sales number) ----
    // Look up which company owns the "to" phone number
    const normalizedTo = normalizeE164(shrubbPhone);
    const { data: phoneRow } = await supabase
      .from('phone_numbers')
      .select('account_id')
      .eq('phone_e164', normalizedTo)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    // Fallback: use the first active company if phone lookup fails
    let accountId: string;
    if (phoneRow?.account_id) {
      accountId = phoneRow.account_id;
    } else {
      const { data: fallbackCompany } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();

      if (!fallbackCompany) {
        console.error('[bland-sales] No company found for phone', normalizedTo);
        return NextResponse.json({ received: true }, { status: 200 });
      }
      accountId = fallbackCompany.id;
    }

    // ---- 4. Upsert the lead ----
    const callerE164 = normalizeE164(callerPhone);

    // Check if lead already exists for this phone + account
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
      .eq('phone', callerE164)
      .limit(1)
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      // Update with latest Bland data
      await supabase
        .from('leads')
        .update({
          name: analysis.caller_name || undefined,
          email: analysis.email || undefined,
          company_name: analysis.company_name || undefined,
          city_state: analysis.service_city_state || undefined,
          leads_per_week: analysis.leads_per_week || undefined,
          current_tools: analysis.current_tools || undefined,
          next_step: analysis.next_step || undefined,
          is_landscaping_company: analysis.caller_is_landscaping_company ?? undefined,
          notes: analysis.notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } else {
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          account_id: accountId,
          phone: callerE164,
          name: analysis.caller_name || null,
          email: analysis.email || null,
          company_name: analysis.company_name || null,
          city_state: analysis.service_city_state || null,
          leads_per_week: analysis.leads_per_week || null,
          current_tools: analysis.current_tools || null,
          next_step: analysis.next_step || null,
          is_landscaping_company: analysis.caller_is_landscaping_company ?? null,
          notes: analysis.notes || null,
          do_not_contact: analysis.next_step === 'redirected',
        })
        .select('id')
        .single();

      if (leadError || !newLead) {
        console.error('[bland-sales] Lead insert error:', leadError);
        return NextResponse.json({ received: true }, { status: 200 });
      }
      leadId = newLead.id;
    }

    // ---- 5. Ensure a conversation exists ----
    // Get the phone_number_id for the Shrubb number
    const phoneNumberId = phoneRow
      ? (
          await supabase
            .from('phone_numbers')
            .select('id')
            .eq('phone_e164', normalizedTo)
            .limit(1)
            .single()
        ).data?.id
      : null;

    let conversationId: string | null = null;

    if (phoneNumberId) {
      // Check for existing conversation
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('lead_id', leadId)
        .eq('phone_number_id', phoneNumberId)
        .limit(1)
        .maybeSingle();

      if (existingConvo) {
        conversationId = existingConvo.id;
        await supabase
          .from('conversations')
          .update({
            updated_at: new Date().toISOString(),
            first_inbound_at:
              existingConvo ? undefined : new Date().toISOString(),
          })
          .eq('id', conversationId);
      } else {
        const { data: newConvo, error: convoError } = await supabase
          .from('conversations')
          .insert({
            account_id: accountId,
            lead_id: leadId,
            phone_number_id: phoneNumberId,
            channel: 'voice',
            first_inbound_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (convoError) {
          console.error('[bland-sales] Conversation insert error:', convoError);
        } else {
          conversationId = newConvo.id;
        }
      }
    }

    // ---- 6. Store the call record ----
    if (conversationId) {
      const now = new Date();
      const startedAt = durationSeconds
        ? new Date(now.getTime() - durationSeconds * 1000)
        : now;

      const { error: callError } = await supabase.from('calls').insert({
        conversation_id: conversationId,
        direction: 'inbound',
        provider_call_id: call_id,
        status: status === 'completed' ? 'completed' : status || 'completed',
        recording_url: recording_url || null,
        transcript_text: transcript || null,
        summary_text: summary || JSON.stringify(analysis, null, 2),
        started_at: startedAt.toISOString(),
        ended_at: now.toISOString(),
      });

      if (callError) {
        console.error('[bland-sales] Call insert error:', callError);
      }
    }

    console.log(
      `[bland-sales] Processed call ${call_id}: lead=${leadId}, convo=${conversationId}, name=${analysis.caller_name}, company=${analysis.company_name}, next=${analysis.next_step}`
    );

    return NextResponse.json({ received: true, lead_id: leadId }, { status: 200 });
  } catch (err) {
    console.error('[bland-sales] Unhandled error:', err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}
