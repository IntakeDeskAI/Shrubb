import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await getActiveCompany(supabase, user.id);
  if (!company) {
    return NextResponse.json({ error: 'No company' }, { status: 403 });
  }

  // Parse search params
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const after = searchParams.get('after');

  if (!projectId) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    );
  }

  // Verify project belongs to user's company
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('company_id', company.companyId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Fetch messages after the given timestamp
  let query = supabase
    .from('messages')
    .select('id, role, content, created_at, intent')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (after) {
    query = query.gt('created_at', after);
  }

  const { data: messages, error: messagesError } = await query;

  if (messagesError) {
    console.error('Messages fetch error:', messagesError);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }

  return NextResponse.json(messages ?? []);
}
