import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationRow {
  id: string;
  channel: string;
  updated_at: string;
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
// Helpers
// ---------------------------------------------------------------------------

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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

  // Load conversations with last message
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, channel, updated_at, leads ( id, name, phone )')
    .eq('account_id', company.companyId)
    .order('updated_at', { ascending: false })
    .limit(50);

  // Load latest message per conversation for preview
  const convoIds = (conversations ?? []).map((c) => c.id);
  let lastMessages: SmsMessageRow[] = [];
  if (convoIds.length > 0) {
    const { data: msgs } = await supabase
      .from('sms_messages')
      .select('id, conversation_id, direction, body, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false });
    lastMessages = (msgs ?? []) as SmsMessageRow[];
  }

  // Build lookup: conversation_id -> last message
  const lastMsgMap = new Map<string, SmsMessageRow>();
  for (const msg of lastMessages) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg);
    }
  }

  // Load calls
  const { data: calls } = await supabase
    .from('calls')
    .select('id, conversation_id, direction, provider_call_id, status, recording_url, transcript_text, summary_text, started_at, ended_at, conversations ( leads ( id, name, phone ) )')
    .in('conversation_id', convoIds.length > 0 ? convoIds : ['__none__'])
    .order('started_at', { ascending: false })
    .limit(50);

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

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {smsConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No messages yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Inbound SMS to your Shrubb number will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {smsConversations.map((convo) => {
                const lead = convo.leads;
                const lastMsg = lastMsgMap.get(convo.id);
                return (
                  <Link
                    key={convo.id}
                    href={`/app/inbox/${convo.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {(lead?.name?.[0] || lead?.phone?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {lead?.name || formatPhone(lead?.phone || '')}
                        </p>
                        <span className="ml-2 shrink-0 text-xs text-gray-400">
                          {timeAgo(convo.updated_at)}
                        </span>
                      </div>
                      {lastMsg && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {lastMsg.direction === 'outbound' ? 'You: ' : ''}
                          {lastMsg.body}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Calls tab */}
      {activeTab === 'calls' && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {callRows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No calls yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Inbound calls to your Shrubb number will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {callRows.map((call) => {
                const lead = call.conversations?.leads;
                return (
                  <div key={call.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {lead?.name || formatPhone(lead?.phone || 'Unknown')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(call.started_at).toLocaleString()} &middot;{' '}
                            <span className={`font-medium ${
                              call.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {call.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      {call.recording_url && (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Recording
                        </a>
                      )}
                    </div>

                    {call.summary_text && (
                      <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        {call.summary_text}
                      </p>
                    )}

                    {call.transcript_text && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
                          View transcript
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          {call.transcript_text}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
