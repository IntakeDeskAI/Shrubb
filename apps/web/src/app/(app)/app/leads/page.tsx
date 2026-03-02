import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  timeAgo,
  formatResponseTime,
  getResponseSeconds,
} from '@/lib/format';
import { Tooltip, HowTo } from '@/components/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationRow {
  id: string;
  lead_id: string;
  channel: string;
  updated_at: string;
  first_inbound_at: string | null;
  first_response_at: string | null;
  leads: { id: string; name: string | null; phone: string };
}

interface SmsMessageRow {
  id: string;
  conversation_id: string;
  direction: string;
  body: string;
  created_at: string;
}

interface CallRow {
  conversation_id: string;
  summary_text: string | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20' },
  proposal_sent: { label: 'Proposal Sent', color: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  estimate_ready: { label: 'Estimate Ready', color: 'text-amber-700 bg-amber-50 ring-amber-600/20' },
  qualified: { label: 'Qualified', color: 'text-brand-700 bg-brand-50 ring-brand-600/20' },
  new: { label: 'New', color: 'text-gray-600 bg-gray-100 ring-gray-500/10' },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  const { companyId } = company;

  // ── Load leads ──
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, phone, created_at')
    .eq('account_id', companyId)
    .order('created_at', { ascending: false })
    .limit(50);

  const leadIds = (leads ?? []).map((l) => l.id);

  // ── Load conversations for these leads ──
  let conversations: ConversationRow[] = [];
  let convoIds: string[] = [];

  if (leadIds.length > 0) {
    const { data: convos } = await supabase
      .from('conversations')
      .select(
        'id, lead_id, channel, updated_at, first_inbound_at, first_response_at, leads ( id, name, phone )',
      )
      .in('lead_id', leadIds)
      .order('updated_at', { ascending: false });

    conversations = (convos ?? []) as unknown as ConversationRow[];
    convoIds = conversations.map((c) => c.id);
  }

  // ── Load last SMS per conversation for snippet preview ──
  let allMessages: SmsMessageRow[] = [];
  if (convoIds.length > 0) {
    const { data: msgs } = await supabase
      .from('sms_messages')
      .select('id, conversation_id, direction, body, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false });
    allMessages = (msgs ?? []) as SmsMessageRow[];
  }

  // Build lookup: conversation_id -> last message
  const lastMsgByConvo = new Map<string, SmsMessageRow>();
  for (const msg of allMessages) {
    if (!lastMsgByConvo.has(msg.conversation_id)) {
      lastMsgByConvo.set(msg.conversation_id, msg);
    }
  }

  // ── Load call summaries ──
  let callSummaries: CallRow[] = [];
  if (convoIds.length > 0) {
    const { data: calls } = await supabase
      .from('calls')
      .select('conversation_id, summary_text')
      .in('conversation_id', convoIds)
      .order('started_at', { ascending: false });
    callSummaries = (calls ?? []) as CallRow[];
  }

  const summaryByConvo = new Map<string, string>();
  for (const call of callSummaries) {
    if (call.summary_text && !summaryByConvo.has(call.conversation_id)) {
      summaryByConvo.set(call.conversation_id, call.summary_text);
    }
  }

  // ── Load proposals matched by client phone → derive pipeline stage ──
  const { data: allProposals } = await supabase
    .from('proposals')
    .select('id, status, clients ( phone )')
    .eq('company_id', companyId);

  // phone → best proposal status
  const phoneProposalStatus = new Map<string, string>();
  for (const p of allProposals ?? []) {
    const client = p.clients as unknown as { phone: string } | null;
    if (!client?.phone) continue;
    const existing = phoneProposalStatus.get(client.phone);
    if (p.status === 'accepted' || !existing) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (
      (p.status === 'sent' || p.status === 'viewed') &&
      existing !== 'accepted'
    ) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (p.status === 'draft' && existing !== 'accepted' && existing !== 'sent' && existing !== 'viewed') {
      phoneProposalStatus.set(client.phone, p.status);
    }
  }

  // ── Build lead-to-conversation lookup ──
  const convosByLead = new Map<string, ConversationRow[]>();
  for (const convo of conversations) {
    const arr = convosByLead.get(convo.lead_id) ?? [];
    arr.push(convo);
    convosByLead.set(convo.lead_id, arr);
  }

  // ── Status derivation ──
  function getLeadStatus(lead: { phone: string; id: string }): { label: string; color: string } {
    const proposalStatus = phoneProposalStatus.get(lead.phone);
    if (proposalStatus === 'accepted') return STATUS_STYLES.accepted;
    if (proposalStatus === 'sent' || proposalStatus === 'viewed') return STATUS_STYLES.proposal_sent;
    if (proposalStatus === 'draft') return STATUS_STYLES.estimate_ready;

    // Check if AI has responded
    const leadConvos = convosByLead.get(lead.id) ?? [];
    const hasResponse = leadConvos.some((c) => c.first_response_at);
    if (hasResponse) return STATUS_STYLES.qualified;

    return STATUS_STYLES.new;
  }

  // ── Get preview text for a lead ──
  function getPreview(leadId: string): string {
    const leadConvos = convosByLead.get(leadId) ?? [];
    // Try call summary first
    for (const convo of leadConvos) {
      const summary = summaryByConvo.get(convo.id);
      if (summary) {
        const first = summary.split(/[.!?]/)[0];
        return first.length > 80 ? first.slice(0, 77) + '...' : first;
      }
    }
    // Try last SMS
    for (const convo of leadConvos) {
      const msg = lastMsgByConvo.get(convo.id);
      if (msg) {
        return msg.body.length > 80 ? msg.body.slice(0, 77) + '...' : msg.body;
      }
    }
    return 'New lead';
  }

  // ── Get primary conversation ID for a lead (most recent) ──
  function getPrimaryConvoId(leadId: string): string | null {
    const leadConvos = convosByLead.get(leadId) ?? [];
    return leadConvos[0]?.id ?? null;
  }

  // ── Get response time for a lead ──
  function getLeadResponseTime(leadId: string): number | null {
    const leadConvos = convosByLead.get(leadId) ?? [];
    for (const convo of leadConvos) {
      const secs = getResponseSeconds(convo.first_inbound_at, convo.first_response_at);
      if (secs !== null) return secs;
    }
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every missed call and text, turned into a pipeline.
          </p>
        </div>
      </div>

      {/* Pipeline legend */}
      <div className="flex flex-wrap gap-2">
        {Object.values(STATUS_STYLES).map((s) => (
          <span
            key={s.label}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${s.color}`}
          >
            {s.label}
          </span>
        ))}
        <Tooltip text="New = just contacted · Qualified = AI responded · Estimate Ready = draft proposal · Proposal Sent = emailed · Accepted = approved" />
      </div>

      {/* Lead cards */}
      {!leads || leads.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No leads yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Inbound calls and texts to your Shrubb number will appear here automatically.
          </p>
          <HowTo
            text="Share your Shrubb AI number with potential clients. When they call or text, leads appear here with AI-gathered details ready for you to create estimates."
            className="mt-4 text-left"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const convoId = getPrimaryConvoId(lead.id);
            const status = getLeadStatus(lead);
            const preview = getPreview(lead.id);
            const responseSecs = getLeadResponseTime(lead.id);

            return (
              <Link
                key={lead.id}
                href={convoId ? `/app/leads/${convoId}` : '/app/leads'}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {lead.name || formatPhone(lead.phone)}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    {lead.name && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatPhone(lead.phone)}
                      </p>
                    )}
                    <p className="mt-1.5 truncate text-sm text-gray-500">{preview}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{timeAgo(lead.created_at)}</p>
                    {responseSecs !== null && (
                      <p className="mt-1 text-[10px] font-medium text-brand-600">
                        {formatResponseTime(responseSecs)} response
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
