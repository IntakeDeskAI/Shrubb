import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  formatResponseTime,
  getResponseSeconds,
} from '@/lib/format';

interface ConversationDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load conversation with lead info + response tracking
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

  // Load company phone number
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

  // Compute response time
  const responseSecs = getResponseSeconds(
    conversation.first_inbound_at,
    conversation.first_response_at,
  );

  // Load all messages
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('id, direction, body, provider_id, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Back link */}
      <Link
        href="/app/inbox"
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
        Inbox
      </Link>

      {/* Header — matches SMS mockup style */}
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
            {formatResponseTime(responseSecs)} response
          </span>
        )}
      </div>

      {/* Chat thread */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {!messages || messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No messages in this conversation.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
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
                    {msg.direction === 'outbound' && ' \u00B7 AI'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
