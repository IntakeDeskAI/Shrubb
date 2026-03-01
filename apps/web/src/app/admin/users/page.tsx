import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServiceClient();

  // Always fetch all auth users
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const allAuthUsers = authUsers ?? [];

  // Build email lookup
  const emailMap = new Map<string, string>();
  for (const u of allAuthUsers) {
    emailMap.set(u.id, u.email ?? '');
  }

  // Determine which user IDs to show (all, or filtered by search)
  let visibleIds: string[];
  if (q && q.trim().length > 0) {
    const search = q.trim().toLowerCase();

    // Filter auth users by email
    const emailMatchIds = new Set(
      allAuthUsers
        .filter((u) => u.email?.toLowerCase().includes(search))
        .map((u) => u.id),
    );

    // Search profiles by name
    const { data: profileResults } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${q.trim()}%`)
      .limit(200);

    const nameMatchIds = new Set((profileResults ?? []).map((p) => p.id));

    // Merge both
    const merged = new Set([...emailMatchIds, ...nameMatchIds]);
    visibleIds = Array.from(merged);
  } else {
    visibleIds = allAuthUsers.map((u) => u.id);
  }

  // Fetch profiles for visible users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .in('id', visibleIds.length > 0 ? visibleIds : ['__none__']);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Fetch entitlements for visible users
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('user_id, tier, projects_used, chat_messages_used')
    .in('user_id', visibleIds.length > 0 ? visibleIds : ['__none__']);

  const entMap = new Map((entitlements ?? []).map((e) => [e.user_id, e]));

  // Fetch company memberships
  const { data: memberships } = await supabase
    .from('company_members')
    .select('user_id, role, company_id, companies(name)')
    .in('user_id', visibleIds.length > 0 ? visibleIds : ['__none__']);

  const memberMap = new Map(
    (memberships ?? []).map((m) => [
      m.user_id,
      {
        role: m.role,
        companyName: (m.companies as unknown as { name: string })?.name ?? '',
      },
    ]),
  );

  // Build user list
  const users = visibleIds.map((id) => {
    const profile = profileMap.get(id);
    const ent = entMap.get(id);
    const membership = memberMap.get(id);
    return {
      id,
      email: emailMap.get(id) ?? '',
      full_name: profile?.full_name ?? null,
      tier: ent?.tier ?? 'none',
      projects_used: ent?.projects_used ?? 0,
      chat_messages_used: ent?.chat_messages_used ?? 0,
      company: membership?.companyName ?? '',
      role: membership?.role ?? '',
      created_at: profile?.created_at ?? '',
    };
  });

  // Sort by created_at descending (newest first)
  users.sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <span className="text-sm text-gray-400">{users.length} total</span>
      </div>

      {/* Search Form */}
      <form className="mt-6" action="/admin/users" method="GET">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Filter by email or name..."
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
              href="/admin/users"
              className="flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </div>
        {q && (
          <p className="mt-2 text-sm text-gray-500">
            Showing {users.length} result{users.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {/* Results */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tier</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Projects</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Chats</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    {user.email || user.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{user.full_name ?? '--'}</td>
                <td className="px-4 py-3 text-gray-700">{user.company || '--'}</td>
                <td className="px-4 py-3">
                  {user.role ? (
                    <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                      {user.role}
                    </span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                    {user.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{user.projects_used}</td>
                <td className="px-4 py-3 text-gray-700">{user.chat_messages_used}</td>
                <td className="px-4 py-3 text-gray-500">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
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
