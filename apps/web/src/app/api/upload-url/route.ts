import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';

const ALLOWED_BUCKETS = ['inputs'];

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

  const { bucket, path } = await request.json();

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Ensure path starts with company ID (company-scoped storage)
  if (!path.startsWith(`${company.companyId}/`)) {
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
