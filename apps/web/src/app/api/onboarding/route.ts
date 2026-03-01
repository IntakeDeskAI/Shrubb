import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { B2B_PLANS } from '@landscape-ai/shared';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  const serviceClient = await createServiceClient();

  // ---- Create Company ----
  if (action === 'create_company') {
    const { company_name, full_name } = body;
    if (!company_name?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const name = company_name.trim();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

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
      return NextResponse.json(
        { error: 'Failed to create company: ' + (companyError?.message ?? 'Unknown') },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: 'Failed to add membership: ' + memberError.message },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: 'Failed to create entitlements: ' + entError.message },
        { status: 500 },
      );
    }

    // Update profile name if provided
    if (full_name?.trim()) {
      await serviceClient
        .from('profiles')
        .update({ full_name: full_name.trim() })
        .eq('id', user.id);
    }

    // Queue phone number provisioning job
    const { error: phoneJobError } = await serviceClient.from('jobs').insert({
      user_id: user.id,
      company_id: company.id,
      type: 'provision_phone',
      status: 'queued',
      payload: {
        company_id: company.id,
        area_code: body.area_code ?? '',
      },
    });

    if (phoneJobError) {
      console.error('Onboarding: phone provisioning job failed to queue', phoneJobError);
      // Non-blocking — company is still created
    }

    // Create default company settings
    await serviceClient.from('company_settings').insert({
      company_id: company.id,
    });

    return NextResponse.json({ companyId: company.id });
  }

  // ---- Create Client ----
  if (action === 'create_client') {
    const { company_id, client_name, client_email, client_address } = body;
    if (!company_id) {
      return NextResponse.json({ error: 'Missing company' }, { status: 400 });
    }

    if (!client_name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const { error: clientError } = await serviceClient
      .from('clients')
      .insert({
        company_id,
        name: client_name.trim(),
        email: client_email?.trim() || null,
        phone: null,
        address: client_address?.trim() || null,
        status: 'lead',
      });

    if (clientError) {
      return NextResponse.json(
        { error: 'Failed to create client: ' + clientError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
