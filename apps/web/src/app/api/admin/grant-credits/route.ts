import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ALLOWED_FIELDS = [
  'included_chat_messages',
  'included_rerenders',
  'included_projects',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function POST(request: Request) {
  // 1. Auth check -- verify the caller is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin =
    user.app_metadata?.is_admin === true ||
    user.user_metadata?.is_admin === true;

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Parse body
  let body: { user_id?: string; field?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { user_id, field, amount } = body;

  if (!user_id || !field || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      { error: 'Missing or invalid user_id, field, or amount' },
      { status: 400 },
    );
  }

  if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
    return NextResponse.json(
      {
        error: `Invalid field. Allowed: ${ALLOWED_FIELDS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // 3. Call RPC with service client
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.rpc('increment_entitlement_field', {
    p_user_id: user_id,
    p_field: field,
    p_amount: amount,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  // 4. Return success
  return NextResponse.json({ success: true, user_id, field, amount });
}
