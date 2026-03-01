'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { B2B_PLANS } from '@landscape-ai/shared';

// ---------------------------------------------------------------------------
// Step 1 — Create company + membership + trial entitlements
// ---------------------------------------------------------------------------

export async function createCompany(_prevState: { error: string | null; companyId: string | null }, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated', companyId: null };

  const name = (formData.get('company_name') as string)?.trim();
  if (!name) return { error: 'Company name is required', companyId: null };

  // Generate URL-friendly slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const serviceClient = await createServiceClient();

  // Create company
  const { data: company, error: companyError } = await serviceClient
    .from('companies')
    .insert({
      name,
      slug,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (companyError || !company) {
    return { error: 'Failed to create company: ' + (companyError?.message ?? 'Unknown'), companyId: null };
  }

  // Add user as owner
  const { error: memberError } = await serviceClient
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    return { error: 'Failed to add membership: ' + memberError.message, companyId: null };
  }

  // Provision trial entitlements
  const trial = B2B_PLANS.trial;
  const { error: entError } = await serviceClient
    .from('entitlements')
    .insert({
      company_id: company.id,
      tier: 'trial',
      included_chat_messages: trial.chat_messages,
      included_rerenders: trial.renders,
      included_projects: 999,
      included_voice_minutes: 0,
      included_proposals: trial.proposals_per_month,
      included_renders: trial.renders,
      included_seats: trial.seats,
      spending_cap_cents: trial.spending_cap_cents,
      chat_messages_used: 0,
      rerenders_used: 0,
      projects_used: 0,
      voice_minutes_used: 0,
      proposals_used: 0,
      renders_used: 0,
      spending_used_cents: 0,
    });

  if (entError) {
    return { error: 'Failed to create entitlements: ' + entError.message, companyId: null };
  }

  // Update profile name if provided
  const fullName = (formData.get('full_name') as string)?.trim();
  if (fullName) {
    await serviceClient
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);
  }

  return { error: null, companyId: company.id };
}

// ---------------------------------------------------------------------------
// Step 2 — Create first client (optional)
// ---------------------------------------------------------------------------

export async function createFirstClient(_prevState: { error: string | null }, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const companyId = formData.get('company_id') as string;
  if (!companyId) return { error: 'Missing company' };

  const clientName = (formData.get('client_name') as string)?.trim();
  if (!clientName) {
    redirect('/app');
  }

  const serviceClient = await createServiceClient();

  const { error: clientError } = await serviceClient
    .from('clients')
    .insert({
      company_id: companyId,
      name: clientName,
      email: (formData.get('client_email') as string)?.trim() || null,
      phone: (formData.get('client_phone') as string)?.trim() || null,
      address: (formData.get('client_address') as string)?.trim() || null,
      status: 'lead',
    });

  if (clientError) {
    return { error: 'Failed to create client: ' + clientError.message };
  }

  redirect('/app');
}

// ---------------------------------------------------------------------------
// Skip onboarding step
// ---------------------------------------------------------------------------

export async function skipToApp() {
  redirect('/app');
}
