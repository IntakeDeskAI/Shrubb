import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import { updateProposal } from '../actions';
import { SendProposalButton } from './send-button';
import Link from 'next/link';
import { Tooltip } from '@/components/tooltip';

interface ProposalDetailProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
};

export default async function ProposalDetailPage({ params }: ProposalDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load proposal
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.companyId)
    .single();

  if (error || !proposal) notFound();

  // Load client
  const { data: client } = await supabase
    .from('clients')
    .select('name, email, phone, address, property_place_id, property_formatted')
    .eq('id', proposal.client_id)
    .single();

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, address, status')
    .eq('id', proposal.project_id)
    .single();

  // Load renders for this project
  const { data: latestRun } = await supabase
    .from('design_runs')
    .select('id')
    .eq('project_id', proposal.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let renderCount = 0;
  if (latestRun) {
    const { count } = await supabase
      .from('design_assets')
      .select('id', { count: 'exact', head: true })
      .eq('design_run_id', latestRun.id)
      .eq('asset_type', 'render');
    renderCount = count ?? 0;
  }

  const proposalUrl = `/p/${proposal.share_token}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back link */}
      <Link
        href="/app/proposals"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All Proposals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proposal for {client?.name ?? 'Client'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {project?.name ?? 'Project'}{project?.address ? ` · ${project.address}` : ''}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_STYLES[proposal.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {/* Client details */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Client</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-gray-900 font-medium">{client?.name}</p>
          {client?.email && <p className="text-gray-500">{client.email}</p>}
          {client?.phone && <p className="text-gray-500">{client.phone}</p>}
          {(client?.property_formatted || client?.address) && (
            <p className="text-gray-500">
              {client.property_formatted || client.address}
              {client.address && !client.property_place_id && (
                <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                  unverified
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      {/* Project summary */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Project</h2>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Link
            href={`/app/projects/${proposal.project_id}`}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {project?.name ?? 'View Project'}
          </Link>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{renderCount} render{renderCount !== 1 ? 's' : ''}</span>
          <span className="text-gray-400">·</span>
          <span className="capitalize text-gray-500">{project?.status}</span>
        </div>
      </section>

      {/* Cover letter / message */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Cover Letter <Tooltip text="This message appears at the top of the proposal page your client sees. Personalize it for better response rates." /></h2>
        <p className="mt-1 text-xs text-gray-400">
          This message appears at the top of the proposal your client sees.
        </p>

        <form action={updateProposal} className="mt-4 space-y-4">
          <input type="hidden" name="proposal_id" value={proposal.id} />
          <textarea
            name="message"
            rows={5}
            defaultValue={proposal.message ?? ''}
            placeholder="Hi [Client], here's a landscape design concept we put together for your property..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Save Draft
            </button>
          </div>
        </form>
      </section>

      {/* Timeline */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
        <div className="mt-4 space-y-3 text-sm">
          <TimelineEntry
            label="Created"
            date={proposal.created_at}
            active
          />
          <TimelineEntry
            label="Sent to client"
            date={proposal.sent_at}
            active={!!proposal.sent_at}
          />
          <TimelineEntry
            label={<>Viewed by client <Tooltip text="Logged when the client opens the proposal link — they don't need to accept for this to trigger" /></>}
            date={proposal.viewed_at}
            active={!!proposal.viewed_at}
          />
          <TimelineEntry
            label="Accepted"
            date={proposal.accepted_at}
            active={!!proposal.accepted_at}
          />
        </div>
      </section>

      {/* Actions */}
      <section className="flex gap-3">
        {proposal.status === 'draft' && (
          <SendProposalButton proposalId={proposal.id} hasClientEmail={!!client?.email} hasVerifiedAddress={!!client?.property_place_id} />
        )}

        <a
          href={proposalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Preview Proposal
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </section>
    </div>
  );
}

function TimelineEntry({
  label,
  date,
  active,
}: {
  label: React.ReactNode;
  date: string | null;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          active ? 'bg-brand-500' : 'bg-gray-200'
        }`}
      />
      <span className={active ? 'text-gray-900' : 'text-gray-400'}>
        {label}
      </span>
      {date && (
        <span className="text-gray-400">
          {new Date(date).toLocaleDateString()} at{' '}
          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
