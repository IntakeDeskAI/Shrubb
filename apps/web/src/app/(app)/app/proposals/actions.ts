'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Create proposal from a project
// ---------------------------------------------------------------------------

export async function createProposal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const projectId = formData.get('project_id') as string;
  const clientId = formData.get('client_id') as string;
  const message = (formData.get('message') as string)?.trim() || null;

  if (!projectId || !clientId) {
    throw new Error('Project and client are required');
  }

  // Verify project belongs to company
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('company_id', company.companyId)
    .single();

  if (!project) throw new Error('Project not found');

  // Increment proposal usage
  const serviceClient = await createServiceClient();
  const { data: usageAllowed, error: usageError } = await serviceClient.rpc(
    'increment_proposal_usage',
    { p_company_id: company.companyId },
  );

  // If the RPC doesn't exist yet, skip the check (graceful)
  if (usageError && !usageError.message.includes('does not exist')) {
    if (usageAllowed === false) {
      throw new Error('Proposal limit reached. Upgrade your plan or purchase a Proposal Pack.');
    }
  }

  const shareToken = randomBytes(16).toString('hex');

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      company_id: company.companyId,
      project_id: projectId,
      client_id: clientId,
      created_by: user.id,
      status: 'draft',
      message,
      share_token: shareToken,
    })
    .select('id')
    .single();

  if (proposalError || !proposal) {
    throw new Error('Failed to create proposal: ' + (proposalError?.message ?? 'Unknown'));
  }

  redirect(`/app/proposals/${proposal.id}`);
}

// ---------------------------------------------------------------------------
// Update proposal message / cover letter
// ---------------------------------------------------------------------------

export async function updateProposal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const proposalId = formData.get('proposal_id') as string;
  const message = (formData.get('message') as string)?.trim() || null;

  const { error } = await supabase
    .from('proposals')
    .update({ message, updated_at: new Date().toISOString() })
    .eq('id', proposalId)
    .eq('company_id', company.companyId);

  if (error) throw new Error('Failed to update proposal');
}

// ---------------------------------------------------------------------------
// Mark proposal as sent (called after email is sent via API)
// ---------------------------------------------------------------------------

export async function markProposalSent(proposalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('proposals')
    .update({
      status: 'sent',
      sent_at: now,
      updated_at: now,
    })
    .eq('id', proposalId)
    .eq('company_id', company.companyId);

  if (error) throw new Error('Failed to mark proposal as sent');

  // Schedule auto-nudge follow-ups if enabled
  const serviceClient = await createServiceClient();

  const { data: settings } = await serviceClient
    .from('company_settings')
    .select('auto_nudge_enabled, nudge_delay_hours, nudge_max_count')
    .eq('company_id', company.companyId)
    .maybeSingle();

  if (settings?.auto_nudge_enabled) {
    const delayHours = settings.nudge_delay_hours || 48;
    const maxCount = settings.nudge_max_count || 2;

    for (let i = 1; i <= maxCount; i++) {
      const scheduledAt = new Date(
        Date.now() + delayHours * i * 60 * 60 * 1000,
      ).toISOString();

      await serviceClient.from('proposal_nudges').insert({
        proposal_id: proposalId,
        company_id: company.companyId,
        nudge_number: i,
        scheduled_at: scheduledAt,
        status: 'pending',
      });
    }

    console.log(`[markProposalSent] Scheduled ${maxCount} nudges for proposal ${proposalId}`);
  }
}
