import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  timeAgo,
  formatResponseTime,
  formatDuration,
  formatTimestamp,
  getResponseSeconds,
  parseTranscript,
} from '@/lib/format';
import { Tooltip, HowTo } from '@/components/tooltip';
import {
  STATUS_STYLES,
  checkMissingInfo,
  getStatusBadge,
} from '@/lib/lead-helpers';
import type { SmsMsg, CallRecord } from '@/lib/lead-helpers';
import { extractAiDetails, hasAiDetails } from '@/lib/extract-ai-details';
import { Collapsible } from '@/components/collapsible';
import { createEstimateFromLead } from './actions';

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
// Page
// ---------------------------------------------------------------------------

interface LeadsPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { id: selectedId } = await searchParams;
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
    .select('id, status, clients ( id, phone )')
    .eq('company_id', companyId);

  const phoneProposalStatus = new Map<string, string>();
  const phoneProposals = new Map<string, { id: string; status: string }[]>();
  for (const p of allProposals ?? []) {
    const client = p.clients as unknown as { id: string; phone: string } | null;
    if (!client?.phone) continue;
    const existing = phoneProposalStatus.get(client.phone);
    if (p.status === 'accepted' || !existing) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (
      (p.status === 'sent' || p.status === 'viewed') &&
      existing !== 'accepted'
    ) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (
      p.status === 'draft' &&
      existing !== 'accepted' &&
      existing !== 'sent' &&
      existing !== 'viewed'
    ) {
      phoneProposalStatus.set(client.phone, p.status);
    }
    const arr = phoneProposals.get(client.phone) ?? [];
    arr.push({ id: p.id, status: p.status });
    phoneProposals.set(client.phone, arr);
  }

  // ── Build lead-to-conversation lookup ──
  const convosByLead = new Map<string, ConversationRow[]>();
  for (const convo of conversations) {
    const arr = convosByLead.get(convo.lead_id) ?? [];
    arr.push(convo);
    convosByLead.set(convo.lead_id, arr);
  }

  // ── Status derivation ──
  function getLeadStatus(lead: { phone: string; id: string }) {
    const proposalStatus = phoneProposalStatus.get(lead.phone);
    if (proposalStatus === 'accepted') return STATUS_STYLES.accepted;
    if (proposalStatus === 'sent' || proposalStatus === 'viewed')
      return STATUS_STYLES.proposal_sent;
    if (proposalStatus === 'draft') return STATUS_STYLES.estimate_ready;
    const leadConvos = convosByLead.get(lead.id) ?? [];
    const hasResponse = leadConvos.some((c) => c.first_response_at);
    if (hasResponse) return STATUS_STYLES.qualified;
    return STATUS_STYLES.new;
  }

  // ── Get preview text for a lead ──
  function getPreview(leadId: string): string {
    const leadConvos = convosByLead.get(leadId) ?? [];
    for (const convo of leadConvos) {
      const summary = summaryByConvo.get(convo.id);
      if (summary) {
        const first = summary.split(/[.!?]/)[0];
        return first.length > 80 ? first.slice(0, 77) + '...' : first;
      }
    }
    for (const convo of leadConvos) {
      const msg = lastMsgByConvo.get(convo.id);
      if (msg) {
        return msg.body.length > 80
          ? msg.body.slice(0, 77) + '...'
          : msg.body;
      }
    }
    return 'New lead';
  }

  // ── Get primary conversation ID for a lead ──
  function getPrimaryConvoId(leadId: string): string | null {
    const leadConvos = convosByLead.get(leadId) ?? [];
    return leadConvos[0]?.id ?? null;
  }

  // ── Get response time for a lead ──
  function getLeadResponseTime(leadId: string): number | null {
    const leadConvos = convosByLead.get(leadId) ?? [];
    for (const convo of leadConvos) {
      const secs = getResponseSeconds(
        convo.first_inbound_at,
        convo.first_response_at,
      );
      if (secs !== null) return secs;
    }
    return null;
  }

  // ==========================================================================
  // Detail panel data (when a lead is selected)
  // ==========================================================================

  let detailLead: { id: string; name: string | null; phone: string } | null =
    null;
  let detailConvoId: string | null = null;
  let detailConvo: ConversationRow | null = null;
  let detailSms: SmsMsg[] = [];
  let detailCalls: CallRecord[] = [];
  let detailProposals: { id: string; status: string }[] = [];
  let detailHasClient = false;

  if (selectedId && leads) {
    // selectedId can be a lead ID or a conversation ID
    // Try as lead ID first
    const matchedLead = leads.find((l) => l.id === selectedId);
    if (matchedLead) {
      detailLead = matchedLead;
      detailConvoId = getPrimaryConvoId(matchedLead.id);
    } else {
      // Try as conversation ID
      const matchedConvo = conversations.find((c) => c.id === selectedId);
      if (matchedConvo) {
        detailConvoId = matchedConvo.id;
        detailConvo = matchedConvo;
        detailLead = leads.find((l) => l.id === matchedConvo.lead_id) ?? null;
      }
    }

    if (detailLead && detailConvoId) {
      // Load full SMS messages for this conversation
      const { data: smsData } = await supabase
        .from('sms_messages')
        .select('id, direction, body, created_at')
        .eq('conversation_id', detailConvoId)
        .order('created_at', { ascending: true });
      detailSms = (smsData ?? []) as SmsMsg[];

      // Load full call records
      const { data: callData } = await supabase
        .from('calls')
        .select(
          'id, direction, status, recording_url, transcript_text, summary_text, started_at, ended_at',
        )
        .eq('conversation_id', detailConvoId)
        .order('started_at', { ascending: false });
      detailCalls = (callData ?? []) as CallRecord[];

      // Check for existing client
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId)
        .eq('phone', detailLead.phone)
        .limit(1)
        .maybeSingle();
      detailHasClient = !!existingClient;

      // Get proposals for this lead's phone
      detailProposals = phoneProposals.get(detailLead.phone) ?? [];
    }
  }

  // ── Detail-specific computed values ──
  const detailStatus = detailLead
    ? getStatusBadge(
        phoneProposalStatus.get(detailLead.phone) ?? null,
        (convosByLead.get(detailLead.id) ?? []).some(
          (c) => c.first_response_at,
        ),
      )
    : null;

  const detailResponseSecs = detailConvoId
    ? (() => {
        const convo =
          detailConvo ??
          conversations.find((c) => c.id === detailConvoId) ??
          null;
        if (!convo) return null;
        return getResponseSeconds(
          convo.first_inbound_at,
          convo.first_response_at,
        );
      })()
    : null;

  const detailMissingInfo =
    detailLead && detailSms && detailCalls
      ? checkMissingInfo(detailLead, detailSms, detailCalls, detailHasClient)
      : [];
  const detailCompletedCount = detailMissingInfo.filter((c) => c.done).length;

  // AI Extracted Details
  const aiTexts: string[] = [];
  for (const call of detailCalls) {
    if (call.summary_text) aiTexts.push(call.summary_text);
    if (call.transcript_text) aiTexts.push(call.transcript_text);
  }
  for (const msg of detailSms.filter((m) => m.direction === 'inbound')) {
    aiTexts.push(msg.body);
  }
  const aiDetails = extractAiDetails(aiTexts);
  const showAiDetails = hasAiDetails(aiDetails);

  const draftProposal = detailProposals.find((p) => p.status === 'draft');
  const sentProposal = detailProposals.find(
    (p) =>
      p.status === 'sent' ||
      p.status === 'viewed' ||
      p.status === 'accepted',
  );

  // ── Determine if detail panel should show ──
  const showDetail = !!(detailLead && detailConvoId);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
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

      {/* ── Empty state ── */}
      {!leads || leads.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No leads yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Inbound calls and texts to your Shrubb number will appear here
            automatically.
          </p>
          <HowTo
            text="Share your Shrubb AI number with potential clients. When they call or text, leads appear here with AI-gathered details ready for you to create estimates."
            className="mt-4 text-left"
          />
        </div>
      ) : (
        /* ── Split Pane ── */
        <div className="flex gap-6">
          {/* ── Left Panel: Lead List ── */}
          <div
            className={`w-full shrink-0 space-y-2 ${
              showDetail
                ? 'hidden lg:block lg:w-1/3'
                : 'lg:w-full'
            }`}
          >
            {leads.map((lead) => {
              const convoId = getPrimaryConvoId(lead.id);
              const status = getLeadStatus(lead);
              const preview = getPreview(lead.id);
              const responseSecs = getLeadResponseTime(lead.id);
              const isSelected = selectedId === lead.id || selectedId === convoId;

              return (
                <Link
                  key={lead.id}
                  href={`/app/leads?id=${lead.id}`}
                  className={`block rounded-xl border p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md ${
                    isSelected
                      ? 'border-brand-300 bg-brand-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
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
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {preview}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-gray-400">
                        {timeAgo(lead.created_at)}
                      </p>
                      {responseSecs !== null && (
                        <p className="mt-0.5 text-[10px] font-medium text-brand-600">
                          {formatResponseTime(responseSecs)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Right Panel: Detail ── */}
          {showDetail && detailLead && detailStatus && (
            <div className="w-full min-w-0 space-y-4 lg:w-2/3">
              {/* Mobile back link */}
              <Link
                href="/app/leads"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                All Leads
              </Link>

              {/* ── Header ── */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {detailLead.name || formatPhone(detailLead.phone)}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${detailStatus.color}`}
                    >
                      {detailStatus.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {formatPhone(detailLead.phone)}
                  </p>
                </div>
                {detailResponseSecs !== null && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                    {formatResponseTime(detailResponseSecs)} response
                  </span>
                )}
              </div>

              {/* ── AI Extracted Details ── */}
              {showAiDetails && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    AI extracted from the conversation
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {aiDetails.serviceType && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400">
                          Service
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {aiDetails.serviceType}
                        </p>
                      </div>
                    )}
                    {aiDetails.address && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400">
                          Address
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {aiDetails.address}
                        </p>
                      </div>
                    )}
                    {aiDetails.budget && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400">
                          Budget
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {aiDetails.budget}
                        </p>
                      </div>
                    )}
                    {aiDetails.timeline && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400">
                          Timeline
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {aiDetails.timeline}
                        </p>
                      </div>
                    )}
                  </div>
                  {aiDetails.notes && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-gray-400">
                        Notes
                      </p>
                      <p className="mt-0.5 text-sm text-gray-700">
                        {aiDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Missing Info + Progress ── */}
              {detailMissingInfo.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Lead Qualification
                    </p>
                    <span className="text-xs font-medium text-gray-400">
                      {detailCompletedCount}/{detailMissingInfo.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{
                        width: `${(detailCompletedCount / detailMissingInfo.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {detailMissingInfo.map((check) => (
                      <span
                        key={check.label}
                        className={`flex items-center gap-1 text-xs ${
                          check.done ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {check.done ? '✓' : '○'} {check.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div className="flex flex-wrap gap-3">
                {!draftProposal && !sentProposal && (
                  <form action={createEstimateFromLead}>
                    <input
                      type="hidden"
                      name="conversation_id"
                      value={detailConvoId!}
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                      Create Estimate Draft
                    </button>
                  </form>
                )}
                {draftProposal && (
                  <>
                    <Link
                      href={`/app/proposals/${draftProposal.id}`}
                      className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                      View Estimate
                    </Link>
                    <Link
                      href={`/app/proposals/${draftProposal.id}`}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      Send Proposal
                    </Link>
                  </>
                )}
                {sentProposal && (
                  <Link
                    href={`/app/proposals/${sentProposal.id}`}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    View Proposal
                  </Link>
                )}
              </div>

              {/* ── Call Transcripts (collapsible) ── */}
              {detailCalls.length > 0 && (
                <Collapsible
                  title="Call Transcripts"
                  badge={detailCalls.length}
                  defaultOpen={detailCalls.length === 1}
                >
                  <div className="space-y-4">
                    {detailCalls.map((call) => {
                      const duration = formatDuration(
                        call.started_at,
                        call.ended_at,
                      );
                      const timestamp = formatTimestamp(call.started_at);
                      const transcriptLines = parseTranscript(
                        call.transcript_text,
                      );

                      return (
                        <div key={call.id}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {duration} &middot; {timestamp}
                            </p>
                            <div className="flex items-center gap-2">
                              {call.recording_url && (
                                <a
                                  href={call.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                                >
                                  Recording ↗
                                </a>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                  call.status === 'completed'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {call.status}
                              </span>
                            </div>
                          </div>

                          {call.summary_text && (
                            <div className="mt-2 rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-semibold text-gray-400">
                                AI Summary
                              </p>
                              <p className="mt-1 text-sm text-gray-700">
                                {call.summary_text}
                              </p>
                            </div>
                          )}

                          {transcriptLines.length > 0 && (
                            <div className="mt-2 space-y-1.5 text-xs">
                              {transcriptLines.map((line, i) => (
                                <p key={i}>
                                  <span
                                    className={`font-semibold ${
                                      line.speaker === 'ai'
                                        ? 'text-brand-600'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {line.speaker === 'ai' ? 'AI' : 'Caller'}:
                                  </span>{' '}
                                  <span className="text-gray-600">
                                    {line.text}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Collapsible>
              )}

              {/* ── Text Messages (collapsible) ── */}
              {detailSms.length > 0 && (
                <Collapsible
                  title="Text Messages"
                  badge={detailSms.length}
                  defaultOpen={detailCalls.length === 0}
                >
                  <div className="space-y-2">
                    {detailSms.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.direction === 'outbound'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 text-sm ${
                            msg.direction === 'outbound'
                              ? 'rounded-2xl rounded-br-md bg-brand-600 text-white'
                              : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{msg.body}</p>
                          <p
                            className={`mt-0.5 text-[10px] ${
                              msg.direction === 'outbound'
                                ? 'text-brand-200'
                                : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {msg.direction === 'outbound' && ' · AI'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}

              {/* ── Empty conversation ── */}
              {detailSms.length === 0 && detailCalls.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-sm text-gray-500">
                    No messages or calls in this conversation yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
