import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { updateClient, createProposalFromConversation } from '../actions';
import { createProposal } from '../../proposals/actions';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { Tooltip, HowTo } from '@/components/tooltip';

interface ClientDetailProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Conversation History sub-component (async server component)
// ---------------------------------------------------------------------------

async function ConversationHistory({
  companyId,
  clientId,
  clientPhone,
}: {
  companyId: string;
  clientId: string;
  clientPhone: string | null;
}) {
  if (!clientPhone) return null;

  const supabase = await createClient();

  // Find lead by phone
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('account_id', companyId)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (!lead) return null;

  // Find conversations for this lead
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, channel, updated_at, first_inbound_at, first_response_at')
    .eq('account_id', companyId)
    .eq('lead_id', lead.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (!conversations || conversations.length === 0) return null;

  const convoIds = conversations.map((c) => c.id);

  // Load recent messages and calls
  const [{ data: recentMessages }, { data: recentCalls }] = await Promise.all([
    supabase
      .from('sms_messages')
      .select('id, conversation_id, direction, body, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('calls')
      .select('id, summary_text, transcript_text, started_at, status')
      .in('conversation_id', convoIds)
      .order('started_at', { ascending: false })
      .limit(3),
  ]);

  const lastContact = conversations[0]?.updated_at;

  // Calculate response time for the most recent conversation
  const latestConvo = conversations[0];
  let responseTimeLabel: string | null = null;
  if (latestConvo?.first_inbound_at && latestConvo?.first_response_at) {
    const diffMs = new Date(latestConvo.first_response_at).getTime() - new Date(latestConvo.first_inbound_at).getTime();
    const diffSec = Math.round(diffMs / 1000);
    if (diffSec < 60) responseTimeLabel = `${diffSec}s`;
    else if (diffSec < 3600) responseTimeLabel = `${Math.round(diffSec / 60)}m`;
    else responseTimeLabel = `${Math.round(diffSec / 3600)}h`;
  }

  // Find the primary conversation for proposal generation (most recent with messages)
  const primaryConvoId = conversations[0]?.id;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">AI Communication</h2>
        {responseTimeLabel && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            Response: {responseTimeLabel} <Tooltip text="Time between the client's first message and AI's first reply" />
          </span>
        )}
      </div>
      {lastContact && (
        <p className="mt-1 text-xs text-gray-400">
          Last contact: {new Date(lastContact).toLocaleDateString()} at{' '}
          {new Date(lastContact).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* Recent call summaries */}
      {recentCalls && recentCalls.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Recent Calls</h3>
          {recentCalls.map((call) => (
            <div key={call.id} className="rounded-md bg-gray-50 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(call.started_at).toLocaleDateString()}</span>
                <span className={`font-medium ${call.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {call.status}
                </span>
              </div>
              {call.summary_text && (
                <p className="mt-1 text-xs text-gray-600">{call.summary_text}</p>
              )}
              {call.transcript_text && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-medium text-brand-600">
                    View transcript
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-500">
                    {call.transcript_text}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent messages */}
      {recentMessages && recentMessages.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Recent Messages</h3>
          {recentMessages.map((msg) => (
            <div key={msg.id} className="flex gap-2 text-xs">
              <span className={`shrink-0 font-medium ${msg.direction === 'inbound' ? 'text-gray-700' : 'text-brand-600'}`}>
                {msg.direction === 'inbound' ? 'Lead:' : 'AI:'}
              </span>
              <span className="text-gray-600">{msg.body}</span>
            </div>
          ))}
        </div>
      )}

      {/* Generate proposal from conversation */}
      {primaryConvoId && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <form action={createProposalFromConversation}>
            <input type="hidden" name="conversation_id" value={primaryConvoId} />
            <input type="hidden" name="client_id" value={clientId} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Generate proposal from conversation <Tooltip text="AI reads the conversation history and drafts a proposal with scope, pricing, and timeline" />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
};

export default async function ClientDetailPage({ params }: ClientDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.companyId)
    .single();

  if (error || !client) notFound();

  // Load proposals for this client
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, status, created_at, projects ( name )')
    .eq('client_id', id)
    .eq('company_id', company.companyId)
    .order('created_at', { ascending: false });

  // Load company projects for "Create Proposal" dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('company_id', company.companyId)
    .in('status', ['setup', 'active', 'planning'])
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back */}
      <Link
        href="/app/clients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All Clients
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <p className="mt-1 text-sm capitalize text-gray-500">
          {client.status.replace('_', ' ')}
        </p>
      </div>

      {/* Verify address banner */}
      {(client.address || client.property_address_raw) && !client.property_place_id && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Verify address to enable accurate proposals and sending.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Current address: {client.address || client.property_address_raw}
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Update the property address below and select from the autocomplete to verify.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Client Details</h2>
        <form action={updateClient} className="mt-4 space-y-4">
          <input type="hidden" name="client_id" value={client.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                defaultValue={client.name}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label htmlFor="client_email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                defaultValue={client.email ?? ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="client_phone"
                name="client_phone"
                type="tel"
                defaultValue={client.phone ?? ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label htmlFor="client_address" className="block text-sm font-medium text-gray-700">
                Property Address (verified)
              </label>
              <AddressAutocomplete
                id="client_address"
                name="client_address"
                defaultValue={client.property_formatted ?? client.address ?? ''}
                enforceVerified
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="client_notes" className="block text-sm font-medium text-gray-700">
              Notes <Tooltip text="Internal notes about this client — not visible on proposals" />
            </label>
            <textarea
              id="client_notes"
              name="client_notes"
              rows={3}
              defaultValue={client.notes ?? ''}
              placeholder="Any notes about this client or project..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      {/* AI Communication History */}
      <ConversationHistory companyId={company.companyId} clientId={client.id} clientPhone={client.phone} />
      <HowTo text="When this client texts or calls your Shrubb number, their conversation history will appear above." />

      {/* Create proposal for this client */}
      {projects && projects.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Create Proposal</h2>
          <p className="mt-1 text-sm text-gray-500">
            Link a project to this client and create a new proposal.
          </p>
          <form action={createProposal} className="mt-4 flex items-end gap-4">
            <input type="hidden" name="client_id" value={client.id} />
            <div className="flex-1">
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                id="project_id"
                name="project_id"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Create Proposal
            </button>
          </form>
        </section>
      )}

      {/* Proposal history */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Proposals</h2>
        {(!proposals || proposals.length === 0) ? (
          <p className="mt-3 text-sm text-gray-500">No proposals for this client yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {proposals.map((p) => {
              const project = p.projects as unknown as { name: string } | null;
              return (
                <Link
                  key={p.id}
                  href={`/app/proposals/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {project?.name ?? 'Project'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
