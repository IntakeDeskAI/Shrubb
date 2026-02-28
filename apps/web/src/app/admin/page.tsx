import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createServiceClient();

  // Fetch all stats in parallel
  const [
    profilesResult,
    projectsResult,
    revenueResult,
    aiSpendResult,
    recentPurchasesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('purchases')
      .select('amount_cents')
      .eq('status', 'succeeded'),
    supabase.from('usage_ledger').select('estimated_cost_usd'),
    supabase
      .from('purchases')
      .select('*, profiles!inner(full_name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const totalUsers = profilesResult.count ?? 0;
  const totalProjects = projectsResult.count ?? 0;

  const totalRevenueCents = (revenueResult.data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );
  const totalRevenue = (totalRevenueCents / 100).toFixed(2);

  const totalAiSpend = (aiSpendResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd ?? 0),
    0,
  );

  const recentPurchases = recentPurchasesResult.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} />
        <StatCard label="Total Revenue" value={`$${totalRevenue}`} />
        <StatCard
          label="AI Spend"
          value={`$${totalAiSpend.toFixed(2)}`}
        />
        <StatCard
          label="Active Projects"
          value={totalProjects.toLocaleString()}
        />
      </div>

      {/* Recent Purchases */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">
          Recent Purchases
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPurchases.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No purchases yet
                  </td>
                </tr>
              )}
              {recentPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${purchase.user_id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {(purchase as Record<string, unknown> & { profiles: { full_name: string | null } }).profiles?.full_name ??
                        purchase.user_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {purchase.product_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {purchase.product_type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ${(purchase.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={purchase.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    succeeded: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}
