import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  timeAgo,
  formatDuration,
  formatTimestamp,
  formatResponseTime,
  getResponseSeconds,
  parseTranscript,
} from '@/lib/format';
import { Tooltip, HowTo } from '@/components/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationRow {
  id: string;
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
  id: string;
  conversation_id: string;
  direction: string;
  provider_call_id: string | null;
  status: string;
  recording_url: string | null;
  transcript_text: string | null;
  summary_text: string | null;
  started_at: string;
  ended_at: string | null;
  conversations: {
    leads: { id: string; name: string | null; phone: string };
  };
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const CALL_STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  'in-progress': 'bg-yellow-50 text-yellow-700',
  'no-answer': 'bg-gray-100 text-gray-600',
  failed: 'bg-red-50 text-red-700',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface InboxPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  const activeTab = params.tab === 'calls' ? 'calls' : 'messages';

  // Load conversations with lead info + response tracking
  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      'id, channel, updated_at, first_inbound_at, first_response_at, leads ( id, name, phone )',
    )
    .eq('account_id', company.companyId)
    .order('updated_at', { ascending: false })
    .limit(50);

  const convoIds = (conversations ?? []).map((c) => c.id);

  // Load messages — last 4 per conversation for inline preview
  let allMessages: SmsMessageRow[] = [];
  if (convoIds.length > 0) {
    const { data: msgs } = await supabase
      .from('sms_messages')
      .select('id, conversation_id, direction, body, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false });
    allMessages = (msgs ?? []) as SmsMessageRow[];
  }

  // Build lookup: conversation_id -> last 4 messages (newest first, will reverse for display)
  const msgsByConvo = new Map<string, SmsMessageRow[]>();
  for (const msg of allMessages) {
    const arr = msgsByConvo.get(msg.conversation_id) ?? [];
    if (arr.length < 4) arr.push(msg);
    msgsByConvo.set(msg.conversation_id, arr);
  }

  // Load calls
  const { data: calls } = await supabase
    .from('calls')
    .select(
      'id, conversation_id, direction, provider_call_id, status, recording_url, transcript_text, summary_text, started_at, ended_at, conversations ( leads ( id, name, phone ) )',
    )
    .in('conversation_id', convoIds.length > 0 ? convoIds : ['__none__'])
    .order('started_at', { ascending: false })
    .limit(50);

  // Load company phone number for "Via your Shrubb number" display
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

  const smsConversations = (conversations ?? []).filter(
    (c) => c.channel === 'sms',
  ) as unknown as ConversationRow[];

  const callRows = (calls ?? []) as unknown as CallRow[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <Link
          href="/app/inbox?tab=messages"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition ${
            activeTab === 'messages'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Messages
        </Link>
        <Link
          href="/app/inbox?tab=calls"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition ${
            activeTab === 'calls'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Calls
        </Link>
      </div>

      {/* ═══════════ MESSAGES TAB ═══════════ */}
      {activeTab === 'messages' && (
        <section className="space-y-4">
          {smsConversations.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">No messages yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Inbound SMS to your Shrubb number will appear here.
              </p>
              <HowTo text="Share your Shrubb AI number with leads. When they text or call, conversations appear here automatically." className="mt-4 text-left" />
            </div>
          ) : (
            smsConversations.map((convo) => {
              const lead = convo.leads;
              const msgs = (msgsByConvo.get(convo.id) ?? []).slice().reverse(); // chronological
              const responseSecs = getResponseSeconds(
                convo.first_inbound_at,
                convo.first_response_at,
              );

              return (
                <Link
                  key={convo.id}
                  href={`/app/inbox/${convo.id}`}
                  className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                          Text Conversation
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-gray-900">
                          {lead?.name || formatPhone(lead?.phone || '')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPhone(lead?.phone || '')} &middot; Via {shrubbNumber}
                        </p>
                      </div>
                      {responseSecs !== null && (
                        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                          {formatResponseTime(responseSecs)} response <Tooltip text="Time between the lead's first message and AI's first reply" />
                        </span>
                      )}
                    </div>

                    {/* Inline message preview */}
                    {msgs.length > 0 && (
                      <div className="mt-4 space-y-2.5">
                        {msgs.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.direction === 'outbound'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2.5 text-sm ${
                                msg.direction === 'outbound'
                                  ? 'rounded-2xl rounded-br-md bg-brand-600 text-white'
                                  : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p className="line-clamp-2">{msg.body}</p>
                              <p
                                className={`mt-1 text-[10px] ${
                                  msg.direction === 'outbound'
                                    ? 'text-brand-200'
                                    : 'text-gray-400'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
                                {msg.direction === 'outbound' && ' \u00B7 AI'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </section>
      )}

      {/* ═══════════ CALLS TAB ═══════════ */}
      {activeTab === 'calls' && (
        <section className="space-y-4">
          {callRows.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">No calls yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Inbound calls to your Shrubb number will appear here.
              </p>
            </div>
          ) : (
            callRows.map((call) => {
              const lead = call.conversations?.leads;
              const duration = formatDuration(call.started_at, call.ended_at);
              const timestamp = formatTimestamp(call.started_at);
              const statusStyle =
                CALL_STATUS_STYLES[call.status] ?? 'bg-gray-100 text-gray-600';

              // Parse transcript into structured lines
              const transcriptLines = parseTranscript(call.transcript_text);
              const previewLines = transcriptLines.slice(0, 3);
              const hasMore = transcriptLines.length > 3;

              return (
                <div
                  key={call.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                          Inbound Call
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-gray-900">
                          {lead?.name || formatPhone(lead?.phone || 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPhone(lead?.phone || '')} &middot; {duration}{' '}
                          &middot; {timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {call.recording_url && (
                          <a
                            href={call.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Recording
                          </a>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyle}`}
                        >
                          {call.status} <Tooltip text="Completed = call finished · In progress = active now · No answer = went to voicemail · Failed = connection error" position="bottom" />
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
                    {previewLines.length > 0 && (
                      <div className="mt-3 rounded-lg border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-500">
                          Transcript
                        </p>
                        <div className="mt-2 space-y-2 text-xs">
                          {previewLines.map((line, i) => (
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
                          {hasMore && (
                            <p className="italic text-gray-400">
                              ... full transcript saved
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
