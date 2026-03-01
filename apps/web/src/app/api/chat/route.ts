import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

  // Parse body
  let body: { project_id?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { project_id, content } = body;

  if (!project_id || typeof project_id !== 'string') {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    );
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    );
  }

  // Verify project belongs to user's company
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('company_id', company.companyId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check chat credit via RPC (company-scoped)
  const { data: hasCredit, error: creditError } = await supabase.rpc(
    'increment_chat_usage',
    { p_company_id: company.companyId }
  );

  if (creditError) {
    console.error('Credit check error:', creditError);
    return NextResponse.json(
      { error: 'Unable to verify chat credits' },
      { status: 500 }
    );
  }

  if (hasCredit === false) {
    return NextResponse.json(
      { error: 'Chat messages exhausted. Purchase a chat pack to continue.' },
      { status: 403 }
    );
  }

  // Insert user message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      project_id,
      user_id: user.id,
      role: 'user',
      content: content.trim(),
      channel: 'web',
    })
    .select('id')
    .single();

  if (messageError || !message) {
    console.error('Message insert error:', messageError);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }

  // Queue classifier job
  const { error: classifierError } = await supabase.from('jobs').insert({
    user_id: user.id,
    company_id: company.companyId,
    project_id,
    type: 'classifier' as const,
    status: 'queued' as const,
    payload: {
      message_id: message.id,
      project_id,
      content: content.trim(),
    },
  });

  if (classifierError) {
    console.error('Classifier job queue error:', classifierError);
  }

  // Queue chat_response job
  const { error: chatJobError } = await supabase.from('jobs').insert({
    user_id: user.id,
    company_id: company.companyId,
    project_id,
    type: 'chat_response' as const,
    status: 'queued' as const,
    payload: {
      project_id,
      message_id: message.id,
      user_id: user.id,
    },
  });

  if (chatJobError) {
    console.error('Chat response job queue error:', chatJobError);
  }

  return NextResponse.json({ message_id: message.id }, { status: 201 });
}
