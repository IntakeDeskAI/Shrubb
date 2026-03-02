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
  const [leadsCount, convsCount, todayLeadsCount, phoneNumbersCount, demoCount, trialCount] =
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
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('next_step', 'book_demo'),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('next_step', 'start_trial'),
    ]);

  const totalLeads = leadsCount.count ?? 0;
  const totalConversations = convsCount.count ?? 0;
  const leadsToday = todayLeadsCount.count ?? 0;
  const activePhones = phoneNumbersCount.count ?? 0;
  const demoRequests = demoCount.count ?? 0;
  const trialRequests = trialCount.count ?? 0;

  // ── Leads with conversations + Bland fields ──────
  let leadsQuery = supabase
    .from('leads')
    .select(
      `id, name, phone, account_id, created_at, do_not_contact,
       email, company_name, city_state, leads_per_week, current_tools,
       next_step, is_landscaping_company, notes,
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
    leadsQuery = leadsQuery.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,city_state.ilike.%${search}%`,
    );
  }

  const { data: leads, error } = await leadsQuery;

  // ── Build rows ───────────────────────────────────
  const rows = (leads ?? []).map((lead) => {
    const accountCompany = (lead.companies as unknown as { name: string })?.name ?? '';
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

    // Derive status from next_step or conversation state
    let status = 'new';
    if (lead.do_not_contact) status = 'dnc';
    else if ((lead as Record<string, unknown>).next_step === 'redirected') status = 'redirected';
    else if ((lead as Record<string, unknown>).next_step === 'book_demo') status = 'demo';
    else if ((lead as Record<string, unknown>).next_step === 'start_trial') status = 'trial';
    else if (convos.some((c) => c.first_response_at)) status = 'responded';
    else if (convos.length > 0) status = 'contacted';

    return {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: (lead as Record<string, unknown>).email as string | null,
      companyName: (lead as Record<string, unknown>).company_name as string | null,
      cityState: (lead as Record<string, unknown>).city_state as string | null,
      leadsPerWeek: (lead as Record<string, unknown>).leads_per_week as string | null,
      currentTools: (lead as Record<string, unknown>).current_tools as string | null,
      nextStep: (lead as Record<string, unknown>).next_step as string | null,
      isLandscaping: (lead as Record<string, unknown>).is_landscaping_company as boolean | null,
      notes: (lead as Record<string, unknown>).notes as string | null,
      accountCompany,
      status,
      conversations: convos.length,
      messages: totalMessages,
      calls: totalCalls,
      avgResponseMs,
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
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total Leads" value={totalLeads.toLocaleString()} />
        <StatCard label="Today" value={leadsToday.toLocaleString()} />
        <StatCard label="Conversations" value={totalConversations.toLocaleString()} />
        <StatCard label="Demo Requests" value={demoRequests.toLocaleString()} />
        <StatCard label="Trial Requests" value={trialRequests.toLocaleString()} />
        <StatCard label="Active Phones" value={activePhones.toLocaleString()} />
      </div>

      {/* Search Form */}
      <form className="mt-6" action="/admin/leads" method="GET">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Filter by name, phone, company, email, or city..."
            className="w-full max-w-lg rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Leads/wk</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tools</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Next Step</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Msgs</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Calls</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Response</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No leads found
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {row.name ?? '--'}
                  {row.isLandscaping === false && (
                    <span className="ml-1 text-[10px] text-red-400" title="Not a landscaping company">
                      (non-lsc)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {row.companyName || row.accountCompany || '--'}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.phone}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                  {row.email || '--'}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {row.cityState || '--'}
                </td>
                <td className="px-4 py-3 text-gray-700 text-center">
                  {row.leadsPerWeek || '--'}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate" title={row.currentTools ?? ''}>
                  {row.currentTools || '--'}
                </td>
                <td className="px-4 py-3">
                  <NextStepBadge step={row.nextStep} />
                </td>
                <td className="px-4 py-3 text-gray-700 text-center">{row.messages}</td>
                <td className="px-4 py-3 text-gray-700 text-center">{row.calls}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {row.avgResponseMs != null
                    ? formatDuration(row.avgResponseMs)
                    : '--'}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes section for leads that have notes */}
      {rows.some((r) => r.notes) && (
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Call Notes</h2>
          <div className="mt-3 space-y-3">
            {rows
              .filter((r) => r.notes)
              .map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span>{r.name ?? 'Unknown'}</span>
                    {r.companyName && (
                      <span className="text-gray-400">({r.companyName})</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{r.notes}</p>
                </div>
              ))}
          </div>
        </div>
      )}
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

function NextStepBadge({ step }: { step: string | null }) {
  if (!step) return <span className="text-gray-400">--</span>;

  const colors: Record<string, string> = {
    book_demo: 'bg-purple-50 text-purple-700',
    start_trial: 'bg-green-50 text-green-700',
    redirected: 'bg-red-50 text-red-700',
    unknown: 'bg-gray-100 text-gray-600',
  };

  const labels: Record<string, string> = {
    book_demo: 'Demo',
    start_trial: 'Trial',
    redirected: 'Redirected',
    unknown: 'Unknown',
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colors[step] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labels[step] ?? step}
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
