import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClientRecord } from './actions';

const STATUS_STYLES: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposal_sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  active: 'bg-brand-50 text-brand-700',
  completed: 'bg-gray-50 text-gray-500',
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', company.companyId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>

      {/* Add client form */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
          <input
            name="client_address"
            type="text"
            placeholder="Property address"
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

      {/* Client list */}
      {(!clients || clients.length === 0) ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No clients yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first client above to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 font-medium text-gray-500">Name</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Email</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Address</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Status</th>
                <th className="pb-3 font-medium text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
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
                  <td className="py-4 pr-4 text-gray-500">{c.address ?? '—'}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
