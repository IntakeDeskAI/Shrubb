import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { JobType } from '@landscape-ai/shared';

const VALID_JOB_TYPES: JobType[] = [
  'generate_brief',
  'generate_concepts',
  'revise_concept',
  'upscale_concept',
  'export_pdf',
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type, payload } = body;

  if (!VALID_JOB_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Enforce plan limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  const plan = subscription?.plan ?? 'free';

  if (plan === 'free') {
    // Check project limit
    const { count: projectCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((projectCount ?? 0) > 1 && type === 'generate_concepts') {
      return NextResponse.json(
        { error: 'Free plan limited to 1 project. Upgrade to Pro.' },
        { status: 403 }
      );
    }

    // Block upscale on free plan
    if (type === 'upscale_concept') {
      return NextResponse.json(
        { error: 'Upscaling requires Pro plan.' },
        { status: 403 }
      );
    }

    // Block PDF export on free plan
    if (type === 'export_pdf') {
      return NextResponse.json(
        { error: 'PDF export requires Pro plan.' },
        { status: 403 }
      );
    }
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
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
