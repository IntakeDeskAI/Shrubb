import type { WorkerSupabase } from '../index.js';

// ---------------------------------------------------------------------------
// send_proposal_nudge handler
//
// Sends an SMS follow-up to a client who has viewed a proposal but hasn't
// responded. Updates the nudge record as sent.
// ---------------------------------------------------------------------------

export async function handleSendProposalNudge(
  supabase: WorkerSupabase,
  payload: Record<string, unknown>,
  _userId: string,
  companyId: string,
): Promise<Record<string, unknown>> {
  const nudgeId = payload.nudge_id as string;
  const proposalId = payload.proposal_id as string;

  if (!nudgeId || !proposalId) {
    throw new Error('nudge_id and proposal_id are required');
  }

  // Load nudge record
  const { data: nudge, error: nudgeError } = await supabase
    .from('proposal_nudges')
    .select('*')
    .eq('id', nudgeId)
    .single();

  if (nudgeError || !nudge) {
    throw new Error('Nudge record not found');
  }

  if (nudge.status !== 'pending') {
    return { skipped: true, reason: `Nudge status is ${nudge.status}` };
  }

  // Load proposal with client + project info
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, status, client_id, project_id, share_token')
    .eq('id', proposalId)
    .single();

  if (proposalError || !proposal) {
    throw new Error('Proposal not found');
  }

  // If proposal is already accepted or declined, cancel the nudge
  if (proposal.status === 'accepted' || proposal.status === 'declined') {
    await supabase
      .from('proposal_nudges')
      .update({ status: 'cancelled' })
      .eq('id', nudgeId);
    return { skipped: true, reason: `Proposal already ${proposal.status}` };
  }

  // Load client details
  const { data: client } = await supabase
    .from('clients')
    .select('name, phone')
    .eq('id', proposal.client_id)
    .single();

  if (!client?.phone) {
    await supabase
      .from('proposal_nudges')
      .update({ status: 'cancelled' })
      .eq('id', nudgeId);
    return { skipped: true, reason: 'Client has no phone number' };
  }

  // Load company name and phone number
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select('phone_e164')
    .eq('account_id', companyId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!phoneNumber) {
    await supabase
      .from('proposal_nudges')
      .update({ status: 'cancelled' })
      .eq('id', nudgeId);
    return { skipped: true, reason: 'No active phone number for company' };
  }

  const companyName = company?.name || 'our team';
  const clientName = client.name?.split(' ')[0] || 'there';

  // Build nudge message
  const message = nudge.nudge_number === 1
    ? `Hi ${clientName}, just checking in on the landscape proposal we sent from ${companyName}. Do you have any questions? We'd love to help you get started. Reply to chat or call us anytime.`
    : `Hi ${clientName}, wanted to follow up one more time on your landscape proposal from ${companyName}. We're here if you have questions or want to make any changes. Just reply to this text.`;

  // Send SMS via Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN!;

  const sendBody = new URLSearchParams({
    From: phoneNumber.phone_e164,
    To: client.phone,
    Body: message,
  });

  const sendRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sendBody.toString(),
    },
  );

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    throw new Error(`Failed to send nudge SMS: ${errText}`);
  }

  // Mark nudge as sent
  await supabase
    .from('proposal_nudges')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', nudgeId);

  console.log(`[send-proposal-nudge] Sent nudge ${nudge.nudge_number} for proposal ${proposalId} to ${client.phone}`);

  return { sent: true, nudge_number: nudge.nudge_number };
}
