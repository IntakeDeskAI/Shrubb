'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const name = (formData.get('client_name') as string)?.trim();
  if (!name) throw new Error('Client name is required');

  const address = (formData.get('client_address') as string)?.trim() || null;
  const placeId = (formData.get('client_address_place_id') as string)?.trim() || null;
  const formatted = (formData.get('client_address_formatted') as string)?.trim() || null;
  const lat = formData.get('client_address_lat') ? parseFloat(formData.get('client_address_lat') as string) : null;
  const lng = formData.get('client_address_lng') ? parseFloat(formData.get('client_address_lng') as string) : null;

  const { error } = await supabase.from('clients').insert({
    company_id: company.companyId,
    name,
    email: (formData.get('client_email') as string)?.trim() || null,
    phone: (formData.get('client_phone') as string)?.trim() || null,
    address: formatted || address,
    property_place_id: placeId,
    property_formatted: formatted,
    property_lat: lat,
    property_lng: lng,
    property_address_raw: address,
    status: 'lead',
  });

  if (error) throw new Error('Failed to create client: ' + error.message);

  revalidatePath('/app/clients');
}

export async function updateClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const clientId = formData.get('client_id') as string;

  const updAddress = (formData.get('client_address') as string)?.trim() || null;
  const updPlaceId = (formData.get('client_address_place_id') as string)?.trim() || null;
  const updFormatted = (formData.get('client_address_formatted') as string)?.trim() || null;
  const updLat = formData.get('client_address_lat') ? parseFloat(formData.get('client_address_lat') as string) : null;
  const updLng = formData.get('client_address_lng') ? parseFloat(formData.get('client_address_lng') as string) : null;

  const { error } = await supabase
    .from('clients')
    .update({
      name: (formData.get('client_name') as string)?.trim() || undefined,
      email: (formData.get('client_email') as string)?.trim() || null,
      phone: (formData.get('client_phone') as string)?.trim() || null,
      address: updFormatted || updAddress,
      property_place_id: updPlaceId,
      property_formatted: updFormatted,
      property_lat: updLat,
      property_lng: updLng,
      property_address_raw: updAddress,
      notes: (formData.get('client_notes') as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)
    .eq('company_id', company.companyId);

  if (error) throw new Error('Failed to update client');

  revalidatePath(`/app/clients/${clientId}`);
}

// ---------------------------------------------------------------------------
// Create project + proposal from conversation transcript
// ---------------------------------------------------------------------------

export async function createProposalFromConversation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const conversationId = formData.get('conversation_id') as string;
  const clientId = formData.get('client_id') as string;

  if (!conversationId || !clientId) {
    throw new Error('Conversation and client are required');
  }

  // Load conversation messages
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  // Load call transcripts for this conversation
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

  if (!fullTranscript.trim()) {
    throw new Error('No conversation content found');
  }

  // Use AI to extract project details from conversation
  let projectName = 'Project from conversation';
  let projectAddress: string | null = null;
  let projectNotes = '';
  let coverLetter = '';

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
      console.error('[proposal-from-convo] AI extraction failed', err);
    }
  }

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      company_id: company.companyId,
      name: projectName,
      address: projectAddress,
      status: 'setup',
      preferences: { notes: projectNotes, source: 'conversation' },
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

  // Create proposal
  const serviceClient = await createServiceClient();
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

  // Queue design jobs for the project
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
        preferences: { notes: projectNotes, source: 'conversation' },
      },
    });
  }

  redirect(`/app/proposals/${proposal.id}`);
}
