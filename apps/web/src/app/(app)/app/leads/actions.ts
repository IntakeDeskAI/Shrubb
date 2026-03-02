'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Create an estimate draft from a lead's conversation
// ---------------------------------------------------------------------------

export async function createEstimateFromLead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const conversationId = formData.get('conversation_id') as string;
  if (!conversationId) throw new Error('Conversation ID is required');

  // Load conversation + lead
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, lead_id, leads ( id, name, phone )')
    .eq('id', conversationId)
    .eq('account_id', company.companyId)
    .single();

  if (!conversation) throw new Error('Conversation not found');

  const lead = conversation.leads as unknown as {
    id: string;
    name: string | null;
    phone: string;
  };

  // Find or create client record from lead phone
  let clientId: string;

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', company.companyId)
    .eq('phone', lead.phone)
    .limit(1)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_id: company.companyId,
        name: lead.name || formatPhoneSimple(lead.phone),
        phone: lead.phone,
        status: 'lead',
      })
      .select('id')
      .single();

    if (clientError || !newClient) {
      throw new Error('Failed to create client: ' + (clientError?.message ?? 'Unknown'));
    }
    clientId = newClient.id;
  }

  // Load conversation messages + calls for AI extraction
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  const { data: calls } = await supabase
    .from('calls')
    .select('transcript_text, summary_text')
    .eq('conversation_id', conversationId)
    .order('started_at', { ascending: false })
    .limit(5);

  // Build transcript
  const smsTranscript = (messages ?? [])
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'AI'}: ${m.body}`)
    .join('\n');

  const callTranscripts = (calls ?? [])
    .filter((c) => c.transcript_text)
    .map((c) => c.transcript_text)
    .join('\n---\n');

  const fullTranscript = [smsTranscript, callTranscripts].filter(Boolean).join('\n\n---\n\n');

  // Use AI to extract project details
  let projectName = `${lead.name || 'Lead'} Project`;
  let projectAddress: string | null = null;
  let projectNotes = '';
  let coverLetter = '';

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && fullTranscript.trim()) {
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content: `You are a landscaping business assistant. Extract project details from a conversation transcript and return a JSON object with these fields:
- project_name: A short descriptive name (e.g., "Johnson Backyard Patio" or "Oak St Front Yard Redesign")
- address: The property address if mentioned, or null
- notes: A summary of what the customer wants (services, timeline, preferences)
- cover_letter: A 2-3 sentence professional proposal cover letter based on what was discussed

Return ONLY valid JSON, no markdown.`,
            },
            { role: 'user', content: fullTranscript },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = (await aiRes.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const raw = aiData.choices?.[0]?.message?.content?.trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              project_name?: string;
              address?: string | null;
              notes?: string;
              cover_letter?: string;
            };
            if (parsed.project_name) projectName = parsed.project_name;
            if (parsed.address) projectAddress = parsed.address;
            if (parsed.notes) projectNotes = parsed.notes;
            if (parsed.cover_letter) coverLetter = parsed.cover_letter;
          } catch {
            projectNotes = raw;
          }
        }
      }
    } catch (err) {
      console.error('[estimate-from-lead] AI extraction failed', err);
    }
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      company_id: company.companyId,
      name: projectName,
      address: projectAddress,
      status: 'setup',
      preferences: { notes: projectNotes, source: 'lead_conversation' },
    })
    .select('id')
    .single();

  if (projectError || !project) {
    throw new Error('Failed to create project: ' + (projectError?.message ?? 'Unknown'));
  }

  // Link project to client
  await supabase
    .from('projects')
    .update({ client_id: clientId })
    .eq('id', project.id);

  // Create proposal (draft)
  const shareToken = randomBytes(16).toString('hex');

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      company_id: company.companyId,
      project_id: project.id,
      client_id: clientId,
      created_by: user.id,
      status: 'draft',
      message: coverLetter || null,
      share_token: shareToken,
    })
    .select('id')
    .single();

  if (proposalError || !proposal) {
    throw new Error('Failed to create proposal: ' + (proposalError?.message ?? 'Unknown'));
  }

  // Queue design jobs
  const serviceClient = await createServiceClient();
  const { data: designRun } = await supabase
    .from('design_runs')
    .insert({
      project_id: project.id,
      run_type: 'initial',
      status: 'pending',
    })
    .select('id')
    .single();

  if (designRun) {
    await serviceClient.from('jobs').insert({
      user_id: user.id,
      company_id: company.companyId,
      project_id: project.id,
      type: 'planner' as const,
      status: 'queued' as const,
      payload: {
        project_id: project.id,
        design_run_id: designRun.id,
        preferences: { notes: projectNotes, source: 'lead_conversation' },
      },
    });
  }

  revalidatePath('/app/leads');
  redirect(`/app/proposals/${proposal.id}`);
}

// Simple phone formatter for client name fallback
function formatPhoneSimple(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}
