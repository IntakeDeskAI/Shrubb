import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';
import type { JobType } from '@landscape-ai/shared';

const VALID_JOB_TYPES: JobType[] = [
  'planner',
  'visualizer',
  'classifier',
  'satellite_fetch',
  'pdf_generation',
  'chat_response',
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await getActiveCompany(supabase, user.id);
  if (!company) {
    return NextResponse.json({ error: 'No company' }, { status: 403 });
  }

  const body = await request.json();
  const { type, payload } = body;

  if (!VALID_JOB_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Check company entitlements
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*')
    .eq('company_id', company.companyId)
    .single();

  if (!entitlements || entitlements.tier === 'none') {
    return NextResponse.json(
      { error: 'No active plan. Purchase a plan to continue.' },
      { status: 403 }
    );
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      company_id: company.companyId,
      project_id: payload.project_id ?? null,
      type,
      status: 'queued',
      payload,
    })
    .select('id, type, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(job, { status: 201 });
}
