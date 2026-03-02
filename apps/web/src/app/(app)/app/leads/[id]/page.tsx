import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  formatResponseTime,
  formatDuration,
  formatTimestamp,
  getResponseSeconds,
  parseTranscript,
  timeAgo,
} from '@/lib/format';
import { Tooltip } from '@/components/tooltip';
import { createEstimateFromLead } from '../actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmsMsg {
  id: string;
  direction: string;
  body: string;
  created_at: string;
}

interface CallRecord {
  id: string;
  direction: string;
  status: string;
  recording_url: string | null;
  transcript_text: string | null;
  summary_text: string | null;
  started_at: string;
  ended_at: string | null;
}

// ---------------------------------------------------------------------------
// Missing-info helpers
// ---------------------------------------------------------------------------

function checkMissingInfo(
  lead: { name: string | null; phone: string },
  messages: SmsMsg[],
  calls: CallRecord[],
  hasClient: boolean,
) {
  const allText = [
    ...messages.map((m) => m.body),
    ...calls.map((c) => c.summary_text ?? ''),
    ...calls.map((c) => c.transcript_text ?? ''),
  ]
    .join(' ')
    .toLowerCase();

  const checks = [
    {
      label: 'Name captured',
      done: !!(lead.name && lead.name.trim().length > 1),
    },
    {
      label: 'Address mentioned',
      done:
        /\b(\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|ln|lane|ct|way|pl|circle))\b/i.test(
          allText,
        ) || /address/i.test(allText),
    },
    {
      label: 'Email collected',
      done: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(allText) || hasClient,
    },
    {
      label: 'Service type identified',
      done:
        /(patio|deck|landscape|lawn|garden|tree|fence|irrigation|hardscape|lighting|design|install|mow|trim|clean|mulch|sod|drain|grade|retaining)/i.test(
          allText,
        ),
    },
    {
      label: 'Budget discussed',
      done: /(\$|budget|price|cost|estimate|quote|afford|spend)/i.test(allText),
    },
  ];

  return checks;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function getStatusBadge(proposalStatus: string | null, hasResponse: boolean) {
  if (proposalStatus === 'accepted')
    return { label: 'Accepted', color: 'text-emerald-700 bg-emerald-50' };
  if (proposalStatus === 'sent' || proposalStatus === 'viewed')
    return { label: 'Proposal Sent', color: 'text-blue-700 bg-blue-50' };
  if (proposalStatus === 'draft')
    return { label: 'Estimate Ready', color: 'text-amber-700 bg-amber-50' };
  if (hasResponse) return { label: 'Qualified', color: 'text-brand-700 bg-brand-50' };
  return { label: 'New', color: 'text-gray-600 bg-gray-100' };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface LeadDetailProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // ── Load conversation with lead info ──
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(
      'id, channel, first_inbound_at, first_response_at, leads ( id, name, phone )',
    )
    .eq('id', id)
    .eq('account_id', company.companyId)
    .single();

  if (error || !conversation) notFound();

  const lead = conversation.leads as unknown as {
    id: string;
    name: string | null;
    phone: string;
  };

  // ── Company phone ──
  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select('phone_e164')
    .eq('account_id', company.companyId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  const shrubbNumber = phoneNumber?.phone_e164
    ? formatPhone(phoneNumber.phone_e164)
    : 'your Shrubb number';

  // ── Response time ──
  const responseSecs = getResponseSeconds(
    conversation.first_inbound_at,
    conversation.first_response_at,
  );

  // ── Load SMS messages ──
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('id, direction, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  const smsMessages = (messages ?? []) as SmsMsg[];

  // ── Load calls ──
  const { data: callData } = await supabase
    .from('calls')
    .select(
      'id, direction, status, recording_url, transcript_text, summary_text, started_at, ended_at',
    )
    .eq('conversation_id', id)
    .order('started_at', { ascending: false });

  const calls = (callData ?? []) as CallRecord[];

  // ── Check for existing client + proposals ──
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', company.companyId)
    .eq('phone', lead.phone)
    .limit(1)
    .maybeSingle();

  let proposals: { id: string; status: string }[] = [];
  if (existingClient) {
    const { data: props } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('client_id', existingClient.id)
      .eq('company_id', company.companyId)
      .order('created_at', { ascending: false });
    proposals = (props ?? []) as { id: string; status: string }[];
  }

  const bestProposalStatus = proposals.length > 0 ? proposals[0].status : null;
  const draftProposal = proposals.find((p) => p.status === 'draft');
  const sentProposal = proposals.find(
    (p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'accepted',
  );

  // ── Status ──
  const hasResponse = !!conversation.first_response_at;
  const status = getStatusBadge(bestProposalStatus, hasResponse);

  // ── Missing info checklist ──
  const missingInfo = checkMissingInfo(lead, smsMessages, calls, !!existingClient);
  const completedCount = missingInfo.filter((c) => c.done).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Back link ── */}
      <Link
        href="/app/leads"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
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
            <h1 className="text-xl font-bold text-gray-900">
              {lead.name || formatPhone(lead.phone)}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatPhone(lead.phone)} &middot; Via {shrubbNumber}
          </p>
        </div>
        {responseSecs !== null && (
          <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {formatResponseTime(responseSecs)} response{' '}
            <Tooltip text="Time between lead's first message and AI's first reply" />
          </span>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-3">
        {!draftProposal && !sentProposal && (
          <form action={createEstimateFromLead}>
            <input type="hidden" name="conversation_id" value={id} />
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

      {/* ── Call Transcripts ── */}
      {calls.length > 0 && (
        <section className="space-y-4">
          {calls.map((call) => {
            const duration = formatDuration(call.started_at, call.ended_at);
            const timestamp = formatTimestamp(call.started_at);
            const transcriptLines = parseTranscript(call.transcript_text);

            return (
              <div
                key={call.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                        Phone Call
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {duration} &middot; {timestamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.recording_url && (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
                        >
                          Recording
                        </a>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          call.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : call.status === 'in-progress'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {call.summary_text && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500">
                        AI Summary
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {call.summary_text}
                      </p>
                    </div>
                  )}

                  {/* Transcript */}
                  {transcriptLines.length > 0 && (
                    <div className="mt-3 rounded-lg border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-500">
                        Transcript
                      </p>
                      <div className="mt-2 space-y-2 text-xs">
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
                            <span className="text-gray-600">{line.text}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── SMS Thread ── */}
      {smsMessages.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Text Messages
            </p>
          </div>
          <div className="space-y-3 p-5 sm:p-6">
            {smsMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm ${
                    msg.direction === 'outbound'
                      ? 'rounded-2xl rounded-br-md bg-brand-600 text-white'
                      : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p
                    className={`mt-1 text-[10px] ${
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
        </section>
      )}

      {/* ── Job Summary (from call) ── */}
      {calls.some((c) => c.summary_text) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Job Summary
          </p>
          <div className="mt-3 space-y-2">
            {calls
              .filter((c) => c.summary_text)
              .map((call) => (
                <p key={call.id} className="text-sm text-gray-700">
                  {call.summary_text}
                </p>
              ))}
          </div>
        </section>
      )}

      {/* ── Missing Info Checklist ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lead Qualification
          </p>
          <span className="text-xs font-medium text-gray-400">
            {completedCount}/{missingInfo.length} complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{
              width: `${(completedCount / missingInfo.length) * 100}%`,
            }}
          />
        </div>
        <ul className="mt-4 space-y-2">
          {missingInfo.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-sm">
              {check.done ? (
                <svg
                  className="h-4 w-4 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 shrink-0 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <span className={check.done ? 'text-gray-700' : 'text-gray-400'}>
                {check.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Empty state ── */}
      {smsMessages.length === 0 && calls.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No messages or calls in this conversation yet.
          </p>
        </div>
      )}
    </div>
  );
}
