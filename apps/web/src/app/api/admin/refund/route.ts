import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
  let body: { purchase_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { purchase_id } = body;

  if (!purchase_id) {
    return NextResponse.json(
      { error: 'Missing purchase_id' },
      { status: 400 },
    );
  }

  // 3. Update purchase status to 'refunded' using service client
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from('purchases')
    .update({ status: 'refunded' })
    .eq('id', purchase_id)
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Purchase not found' },
      { status: 404 },
    );
  }

  // 4. Return success
  return NextResponse.json({ success: true, purchase: data });
}
