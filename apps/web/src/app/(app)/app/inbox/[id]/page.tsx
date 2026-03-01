import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface ConversationDetailProps {
  params: Promise<{ id: string }>;
}

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

export default async function ConversationDetailPage({ params }: ConversationDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load conversation with lead info
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, channel, leads ( id, name, phone )')
    .eq('id', id)
    .eq('account_id', company.companyId)
    .single();

  if (error || !conversation) notFound();

  const lead = conversation.leads as unknown as { id: string; name: string | null; phone: string };

  // Load all messages
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('id, direction, body, provider_id, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/app/inbox"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Inbox
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {(lead?.name?.[0] || lead?.phone?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {lead?.name || formatPhone(lead?.phone || '')}
          </h1>
          <p className="text-xs text-gray-500">{formatPhone(lead?.phone || '')}</p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {(!messages || messages.length === 0) ? (
          <p className="text-center text-sm text-gray-500">No messages in this conversation.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.direction === 'outbound'
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.direction === 'outbound' ? 'text-brand-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
