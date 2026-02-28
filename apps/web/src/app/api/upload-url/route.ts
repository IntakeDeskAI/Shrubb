import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ALLOWED_BUCKETS = ['originals'];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bucket, path } = await request.json();

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Ensure path starts with user's ID
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid path prefix' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
