import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServiceClient();

  // ── Stats ────────────────────────────────────────
  const [leadsCount, convsCount, todayLeadsCount, phoneNumbersCount] =
    await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().slice(0, 10)),
      supabase
        .from('phone_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ]);

  const totalLeads = leadsCount.count ?? 0;
  const totalConversations = convsCount.count ?? 0;
  const leadsToday = todayLeadsCount.count ?? 0;
  const activePhones = phoneNumbersCount.count ?? 0;

  // ── Leads with conversations ─────────────────────
  let leadsQuery = supabase
    .from('leads')
    .select(
      `id, name, phone, account_id, created_at, do_not_contact,
       companies!leads_account_id_fkey(name),
       conversations(id, channel, first_inbound_at, first_response_at, updated_at,
         sms_messages(id),
         calls(id)
       )`,
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (q && q.trim().length > 0) {
    const search = q.trim();
    // Search by name or phone
    leadsQuery = leadsQuery.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data: leads, error } = await leadsQuery;

  // ── Build rows ───────────────────────────────────
  const rows = (leads ?? []).map((lead) => {
    const company = (lead.companies as unknown as { name: string })?.name ?? '';
    const convos = (lead.conversations as unknown as Array<{
      id: string;
      channel: string;
      first_inbound_at: string | null;
      first_response_at: string | null;
      updated_at: string;
      sms_messages: { id: string }[];
      calls: { id: string }[];
    }>) ?? [];

    const totalMessages = convos.reduce(
      (sum, c) => sum + (c.sms_messages?.length ?? 0),
      0,
    );
    const totalCalls = convos.reduce(
      (sum, c) => sum + (c.calls?.length ?? 0),
      0,
    );
    const lastActivity = convos.length > 0
      ? convos.reduce((latest, c) =>
          c.updated_at > latest ? c.updated_at : latest, convos[0].updated_at)
      : lead.created_at;

    // Calculate average response time across conversations
    let avgResponseMs: number | null = null;
    const responseTimes = convos
      .filter((c) => c.first_inbound_at && c.first_response_at)
      .map(
        (c) =>
          new Date(c.first_response_at!).getTime() -
          new Date(c.first_inbound_at!).getTime(),
      );
    if (responseTimes.length > 0) {
      avgResponseMs =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Derive status
    let status = 'new';
    if (lead.do_not_contact) status = 'dnc';
    else if (convos.some((c) => c.first_response_at)) status = 'responded';
    else if (convos.length > 0) status = 'contacted';

    return {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      company,
      status,
      conversations: convos.length,
      messages: totalMessages,
      calls: totalCalls,
      avgResponseMs,
      lastActivity,
      createdAt: lead.created_at,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        <span className="text-sm text-gray-400">{totalLeads} total</span>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Leads" value={totalLeads.toLocaleString()} />
        <StatCard
          label="Conversations"
          value={totalConversations.toLocaleString()}
        />
        <StatCard label="Leads Today" value={leadsToday.toLocaleString()} />
        <StatCard
          label="Active Phone Numbers"
          value={activePhones.toLocaleString()}
        />
      </div>

      {/* Search Form */}
      <form className="mt-6" action="/admin/leads" method="GET">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Filter by name or phone..."
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Filter
          </button>
          {q && (
            <Link
              href="/admin/leads"
              className="flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </div>
        {q && (
          <p className="mt-2 text-sm text-gray-500">
            Showing {rows.length} result{rows.length !== 1 ? 's' : ''} for
            &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error loading leads: {error.message}
        </div>
      )}

      {/* Results Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Phone
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Company
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Messages
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Calls
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Response Time
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No leads found
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.name ?? '--'}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.phone}</td>
                <td className="px-4 py-3 text-gray-700">
                  {row.company || '--'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{row.messages}</td>
                <td className="px-4 py-3 text-gray-700">{row.calls}</td>
                <td className="px-4 py-3 text-gray-500">
                  {row.avgResponseMs != null
                    ? formatDuration(row.avgResponseMs)
                    : '--'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-amber-50 text-amber-700',
    contacted: 'bg-blue-50 text-blue-700',
    responded: 'bg-green-50 text-green-700',
    dnc: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSec}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
