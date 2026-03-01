import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { updateClient } from '../actions';
import { createProposal } from '../../proposals/actions';

interface ClientDetailProps {
  params: Promise<{ id: string }>;
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
                Property Address
              </label>
              <input
                id="client_address"
                name="client_address"
                type="text"
                defaultValue={client.address ?? ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="client_notes" className="block text-sm font-medium text-gray-700">
              Notes
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
