import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { proposal_id, token } = await request.json();

  if (!proposal_id || !token) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Verify the token matches the proposal (no auth required — public endpoint)
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, share_token, status')
    .eq('id', proposal_id)
    .eq('share_token', token)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (proposal.status === 'accepted') {
    return NextResponse.json({ already: true });
  }

  // Update proposal to accepted
  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposal_id)
    .eq('share_token', token);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to accept' }, { status: 500 });
  }

  // Also update the client status
  const { data: proposalFull } = await supabase
    .from('proposals')
    .select('client_id')
    .eq('id', proposal_id)
    .single();

  if (proposalFull?.client_id) {
    await supabase
      .from('clients')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalFull.client_id);
  }

  return NextResponse.json({ accepted: true });
}
