import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServiceClient();

  let users: Array<{
    id: string;
    email: string;
    full_name: string | null;
    tier: string;
    projects_used: number;
    chat_messages_used: number;
    created_at: string;
  }> = [];

  if (q && q.trim().length > 0) {
    const search = q.trim();

    // Search profiles by name
    const { data: profileResults } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .or(`full_name.ilike.%${search}%`)
      .limit(50);

    // Also look up users by email via auth admin API
    const {
      data: { users: authUsers },
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    const emailMatches = (authUsers ?? []).filter(
      (u) =>
        u.email?.toLowerCase().includes(search.toLowerCase()),
    );

    // Merge: start with profile matches, add email matches not already included
    const profileIds = new Set((profileResults ?? []).map((p) => p.id));
    const allIds = new Set(profileIds);

    for (const authUser of emailMatches) {
      allIds.add(authUser.id);
    }

    // Build email lookup from auth users
    const emailMap = new Map<string, string>();
    for (const u of authUsers ?? []) {
      emailMap.set(u.id, u.email ?? '');
    }

    // Fetch entitlements for all matched users
    const userIds = Array.from(allIds);
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('user_id, tier, projects_used, chat_messages_used')
      .in('user_id', userIds);

    const entMap = new Map(
      (entitlements ?? []).map((e) => [e.user_id, e]),
    );

    // Fetch profiles for email-only matches
    const missingProfileIds = userIds.filter((id) => !profileIds.has(id));
    let extraProfiles: Array<{
      id: string;
      full_name: string | null;
      created_at: string;
    }> = [];
    if (missingProfileIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .in('id', missingProfileIds);
      extraProfiles = data ?? [];
    }

    const allProfiles = [...(profileResults ?? []), ...extraProfiles];
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    users = userIds.map((id) => {
      const profile = profileMap.get(id);
      const ent = entMap.get(id);
      return {
        id,
        email: emailMap.get(id) ?? '',
        full_name: profile?.full_name ?? null,
        tier: ent?.tier ?? 'none',
        projects_used: ent?.projects_used ?? 0,
        chat_messages_used: ent?.chat_messages_used ?? 0,
        created_at: profile?.created_at ?? '',
      };
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>

      {/* Search Form */}
      <form className="mt-6" action="/admin/users" method="GET">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by email or name..."
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {q && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-gray-500">
            {users.length} result{users.length !== 1 ? 's' : ''} for
            &ldquo;{q}&rdquo;
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Projects
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Chats
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
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
                    <td className="px-4 py-3 text-gray-700">
                      {user.full_name ?? '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.projects_used}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.chat_messages_used}
                    </td>
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
      )}

      {!q && (
        <p className="mt-8 text-sm text-gray-400">
          Enter a search term to find users by email or name.
        </p>
      )}
    </div>
  );
}
