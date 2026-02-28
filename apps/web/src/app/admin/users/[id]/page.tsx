import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  const supabase = await createServiceClient();

  // Fetch user from auth
  const {
    data: { user: authUser },
  } = await supabase.auth.admin.getUserById(userId);

  if (!authUser) redirect('/admin/users');

  // Fetch profile, entitlements, purchases, usage in parallel
  const [profileResult, entitlementsResult, purchasesResult, usageResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('usage_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  const profile = profileResult.data;
  const entitlements = entitlementsResult.data;
  const purchases = purchasesResult.data ?? [];
  const usage = usageResult.data ?? [];

  // --- Server Actions ---

  async function grantChatCredits(formData: FormData) {
    'use server';
    const amount = parseInt(formData.get('amount') as string, 10);
    if (!amount || amount <= 0) return;
    const supa = await createServiceClient();
    await supa.rpc('increment_entitlement_field', {
      p_user_id: userId,
      p_field: 'included_chat_messages',
      p_amount: amount,
    });
    revalidatePath(`/admin/users/${userId}`);
  }

  async function grantRerenderCredits(formData: FormData) {
    'use server';
    const amount = parseInt(formData.get('amount') as string, 10);
    if (!amount || amount <= 0) return;
    const supa = await createServiceClient();
    await supa.rpc('increment_entitlement_field', {
      p_user_id: userId,
      p_field: 'included_rerenders',
      p_amount: amount,
    });
    revalidatePath(`/admin/users/${userId}`);
  }

  async function markRefund(formData: FormData) {
    'use server';
    const purchaseId = formData.get('purchase_id') as string;
    if (!purchaseId) return;
    const supa = await createServiceClient();
    await supa
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('id', purchaseId)
      .eq('user_id', userId);
    revalidatePath(`/admin/users/${userId}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <a
          href="/admin/users"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          &larr; Users
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">
          {profile?.full_name ?? authUser.email ?? userId.slice(0, 8)}
        </h1>
      </div>

      {/* User Info Card */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          User Info
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm lg:grid-cols-4">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">
              {authUser.email ?? '--'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-900">
              {profile?.full_name ?? '--'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-900">
              {profile?.phone ?? '--'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Joined</dt>
            <dd className="font-medium text-gray-900">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : '--'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">User ID</dt>
            <dd className="font-mono text-xs text-gray-600">{userId}</dd>
          </div>
        </dl>
      </div>

      {/* Entitlements Card */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Entitlements
        </h2>
        {entitlements ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm lg:grid-cols-4">
            <div>
              <dt className="text-gray-500">Tier</dt>
              <dd className="font-semibold capitalize text-gray-900">
                {entitlements.tier}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Chat Messages</dt>
              <dd className="font-medium text-gray-900">
                {entitlements.chat_messages_used} /{' '}
                {entitlements.included_chat_messages}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Rerenders</dt>
              <dd className="font-medium text-gray-900">
                {entitlements.rerenders_used} /{' '}
                {entitlements.included_rerenders}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Projects</dt>
              <dd className="font-medium text-gray-900">
                {entitlements.projects_used} /{' '}
                {entitlements.included_projects}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Voice Minutes</dt>
              <dd className="font-medium text-gray-900">
                {entitlements.voice_minutes_used} /{' '}
                {entitlements.included_voice_minutes}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Spending Cap</dt>
              <dd className="font-medium text-gray-900">
                ${(entitlements.spending_used_cents / 100).toFixed(2)} / $
                {(entitlements.spending_cap_cents / 100).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Expires</dt>
              <dd className="font-medium text-gray-900">
                {entitlements.expires_at
                  ? new Date(entitlements.expires_at).toLocaleDateString()
                  : 'Never'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-gray-400">No entitlements record</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Grant Chat Credits */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">
            Grant Chat Credits
          </h3>
          <form action={grantChatCredits} className="mt-3 flex gap-2">
            <input
              type="number"
              name="amount"
              min="1"
              placeholder="Amount"
              required
              className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Grant
            </button>
          </form>
        </div>

        {/* Grant Rerender Credits */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">
            Grant Rerender Credits
          </h3>
          <form action={grantRerenderCredits} className="mt-3 flex gap-2">
            <input
              type="number"
              name="amount"
              min="1"
              placeholder="Amount"
              required
              className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Grant
            </button>
          </form>
        </div>

        {/* Mark Refund */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">Mark Refund</h3>
          <form action={markRefund} className="mt-3 flex gap-2">
            <select
              name="purchase_id"
              required
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select purchase...</option>
              {purchases
                .filter((p) => p.status === 'succeeded')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name} - $
                    {(p.amount_cents / 100).toFixed(2)} (
                    {new Date(p.created_at).toLocaleDateString()})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Refund
            </button>
          </form>
        </div>
      </div>

      {/* Purchases */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Purchases</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
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
              {purchases.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No purchases
                  </td>
                </tr>
              )}
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {p.product_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.product_type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ${(p.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Usage */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">
          Recent Usage (Last 20)
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Provider
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Model
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Tokens In
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Tokens Out
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Images
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Cost
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usage.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No usage records
                  </td>
                </tr>
              )}
              {usage.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {entry.run_type}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {entry.provider}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {entry.model ?? '--'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.tokens_in?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.tokens_out?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.image_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ${Number(entry.estimated_cost_usd).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
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
