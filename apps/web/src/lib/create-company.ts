import type { SupabaseClient } from '@supabase/supabase-js';
import { B2B_PLANS } from '@landscape-ai/shared';

// ---------------------------------------------------------------------------
// Shared company-creation logic used by both the signup server action and the
// onboarding API route.  Keeping it in one place prevents drift.
// ---------------------------------------------------------------------------

export interface CreateCompanyParams {
  userId: string;
  companyName: string;
  fullName?: string;
  companyAddress?: string;
  companyAddressPlaceId?: string;
  companyAddressFormatted?: string;
  companyAddressLat?: string;
  companyAddressLng?: string;
  areaCode?: string;
}

export async function createCompanyForUser(
  serviceClient: SupabaseClient,
  params: CreateCompanyParams,
): Promise<{ companyId: string } | { error: string }> {
  const {
    userId,
    companyName,
    fullName,
    companyAddress,
    companyAddressPlaceId,
    companyAddressFormatted,
    companyAddressLat,
    companyAddressLng,
    areaCode,
  } = params;

  const name = companyName.trim();
  if (!name) return { error: 'Company name is required' };

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // 1. Create company
  const { data: company, error: companyError } = await serviceClient
    .from('companies')
    .insert({
      name,
      slug,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      address_place_id: companyAddressPlaceId?.trim() || null,
      address_formatted: companyAddressFormatted?.trim() || null,
      address_lat: companyAddressLat ? parseFloat(companyAddressLat) : null,
      address_lng: companyAddressLng ? parseFloat(companyAddressLng) : null,
      address_raw: companyAddress?.trim() || null,
    })
    .select('id')
    .single();

  if (companyError || !company) {
    return { error: 'Failed to create company: ' + (companyError?.message ?? 'Unknown') };
  }

  // 2. Add user as owner
  const { error: memberError } = await serviceClient
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    return { error: 'Failed to add membership: ' + memberError.message };
  }

  // 3. Provision trial entitlements
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
    return { error: 'Failed to create entitlements: ' + entError.message };
  }

  // 4. Update profile name if provided
  if (fullName?.trim()) {
    await serviceClient
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', userId);
  }

  // 5. Queue phone number provisioning job (non-blocking)
  const { error: phoneJobError } = await serviceClient.from('jobs').insert({
    user_id: userId,
    company_id: company.id,
    type: 'provision_phone',
    status: 'queued',
    payload: {
      company_id: company.id,
      area_code: areaCode ?? '',
    },
  });

  if (phoneJobError) {
    console.error('createCompanyForUser: phone provisioning job failed to queue', phoneJobError);
    // Non-blocking — company is still created
  }

  // 6. Create default company settings
  await serviceClient.from('company_settings').insert({
    company_id: company.id,
  });

  return { companyId: company.id };
}
