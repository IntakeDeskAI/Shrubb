import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClientRecord } from './actions';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { Tooltip } from '@/components/tooltip';
import { timeAgo } from '@/lib/format';

const STATUS_STYLES: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposal_sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  active: 'bg-brand-50 text-brand-700',
  completed: 'bg-gray-50 text-gray-500',
};

interface ClientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? '';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load clients with optional search filter
  let clientsQuery = supabase
    .from('clients')
    .select('*')
    .eq('company_id', company.companyId)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    clientsQuery = clientsQuery.or(
      `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`,
    );
  }

  const { data: clients } = await clientsQuery;

  // Load proposals per client for count
  const { data: allProposals } = await supabase
    .from('proposals')
    .select('id, client_id')
    .eq('company_id', company.companyId);

  const proposalCountByClient = new Map<string, number>();
  for (const p of allProposals ?? []) {
    if (!p.client_id) continue;
    proposalCountByClient.set(p.client_id, (proposalCountByClient.get(p.client_id) ?? 0) + 1);
  }

  // Load last contact per client via leads matched by phone
  const clientPhones = (clients ?? [])
    .filter((c) => c.phone)
    .map((c) => c.phone as string);

  const lastContactByPhone = new Map<string, string>();

  if (clientPhones.length > 0) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, phone')
      .in('phone', clientPhones)
      .eq('account_id', company.companyId);

    const leadIds = (leads ?? []).map((l) => l.id);
    const leadPhoneMap = new Map((leads ?? []).map((l) => [l.id, l.phone]));

    if (leadIds.length > 0) {
      const { data: convos } = await supabase
        .from('conversations')
        .select('lead_id, updated_at')
        .in('lead_id', leadIds)
        .order('updated_at', { ascending: false });

      for (const c of convos ?? []) {
        const phone = leadPhoneMap.get(c.lead_id);
        if (phone && !lastContactByPhone.has(phone)) {
          lastContactByPhone.set(phone, c.updated_at);
        }
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <div className="flex gap-2">
          <Link
            href="/app/leads"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            View Leads
          </Link>
          <a
            href="#add-client"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Add Client
          </a>
        </div>
      </div>

      {/* Search bar */}
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          type="text"
          defaultValue={searchQuery}
          placeholder="Search by name, email, or phone..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Search
        </button>
        {searchQuery && (
          <Link
            href="/app/clients"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Client list */}
      {(!clients || clients.length === 0) ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery ? 'No clients match your search' : 'No clients yet'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery
              ? 'Try a different search term or clear the filter.'
              : 'Clients are created automatically from leads, or add one manually below.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 font-medium text-gray-500">Name</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Email</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">
                  Status{' '}
                  <Tooltip text="Lead = new contact · Proposal sent = estimate emailed · Accepted = approved · Active = work in progress · Completed = done" />
                </th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Last Contact</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Proposals</th>
                <th className="pb-3 font-medium text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => {
                const lastContact = c.phone ? lastContactByPhone.get(c.phone) : null;
                const proposalCount = proposalCountByClient.get(c.id) ?? 0;

                return (
                  <tr key={c.id} className="group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/app/clients/${c.id}`}
                        className="font-medium text-gray-900 group-hover:text-brand-600"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-gray-500">{c.email ?? '—'}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-500">
                      {lastContact ? timeAgo(lastContact) : '—'}
                    </td>
                    <td className="py-4 pr-4 text-gray-500">
                      {proposalCount > 0 ? (
                        <span className="font-medium text-brand-600">{proposalCount}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add client form */}
      <section id="add-client" className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Add a new client</h2>
        <form action={createClientRecord} className="mt-4 grid gap-4 sm:grid-cols-4">
          <input
            name="client_name"
            type="text"
            required
            placeholder="Client name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            name="client_email"
            type="email"
            placeholder="Email"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <AddressAutocomplete
            name="client_address"
            placeholder="Property address (verified)"
            enforceVerified
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Add Client
          </button>
        </form>
      </section>
    </div>
  );
}
