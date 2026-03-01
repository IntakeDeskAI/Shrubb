import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

  const { proposal_id } = await request.json();

  if (!proposal_id) {
    return NextResponse.json({ error: 'Missing proposal_id' }, { status: 400 });
  }

  // Load proposal with client and project info
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, share_token, message, status, client_id, project_id, company_id')
    .eq('id', proposal_id)
    .eq('company_id', company.companyId)
    .single();

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Load client
  const { data: client } = await supabase
    .from('clients')
    .select('name, email')
    .eq('id', proposal.client_id)
    .single();

  if (!client?.email) {
    return NextResponse.json(
      { error: 'Client has no email address. Add an email to send the proposal.' },
      { status: 400 },
    );
  }

  // Build proposal URL
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'https';
  const proposalUrl = `${protocol}://${host}/p/${proposal.share_token}`;

  // Send email via Resend (if API key is configured)
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #111827; font-size: 24px; margin-bottom: 8px;">
            ${company.companyName} sent you a landscape proposal
          </h2>
          <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Hi ${client.name},
          </p>
          ${proposal.message ? `<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${proposal.message.replace(/\n/g, '<br/>')}</p>` : ''}
          <a href="${proposalUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Your Proposal
          </a>
          <p style="color: #9CA3AF; font-size: 14px; margin-top: 32px;">
            Sent via <a href="${protocol}://${host}" style="color: #16a34a; text-decoration: none;">Shrubb</a>
          </p>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'proposals@shrubb.com',
          to: client.email,
          subject: `Landscape Proposal from ${company.companyName}`,
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Resend API error:', errBody);
        return NextResponse.json(
          { error: 'Failed to send email. Please try again.' },
          { status: 500 },
        );
      }
    } catch (err) {
      console.error('Email send error:', err);
      return NextResponse.json(
        { error: 'Failed to send email.' },
        { status: 500 },
      );
    }
  } else {
    console.warn('RESEND_API_KEY not configured — skipping email send');
  }

  // Mark proposal as sent
  await supabase
    .from('proposals')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposal_id)
    .eq('company_id', company.companyId);

  return NextResponse.json({ sent: true, url: proposalUrl });
}
