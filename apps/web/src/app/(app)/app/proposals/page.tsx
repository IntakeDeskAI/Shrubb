import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Tooltip } from '@/components/tooltip';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
};

export default async function ProposalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) redirect('/app/onboarding');

  // Load proposals with client and project names
  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      message,
      sent_at,
      viewed_at,
      accepted_at,
      created_at,
      clients ( name, email ),
      projects ( name, address )
    `)
    .eq('company_id', company.companyId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
      </div>

      {(!proposals || proposals.length === 0) ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No proposals yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a project, then generate a proposal to send to your client.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 font-medium text-gray-500">Client</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Project</th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Status <Tooltip text="Draft = not yet sent · Sent = emailed to client · Viewed = client opened the link · Accepted = client approved · Declined = client passed" /></th>
                <th className="pb-3 pr-4 font-medium text-gray-500">Sent</th>
                <th className="pb-3 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proposals.map((p) => {
                const client = p.clients as unknown as { name: string; email: string } | null;
                const project = p.projects as unknown as { name: string; address: string } | null;

                return (
                  <tr key={p.id} className="group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/app/proposals/${p.id}`}
                        className="font-medium text-gray-900 group-hover:text-brand-600"
                      >
                        {client?.name ?? 'Unknown Client'}
                      </Link>
                      {client?.email && (
                        <p className="text-xs text-gray-400">{client.email}</p>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-gray-600">
                      {project?.name ?? '—'}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-500">
                      {p.sent_at
                        ? new Date(p.sent_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-4 text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
