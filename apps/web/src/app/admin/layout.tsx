import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check admin via user metadata (matches the is_admin() DB function which checks raw_user_meta_data->>'role' = 'admin')
  const isAdmin =
    user.app_metadata?.is_admin === true ||
    user.user_metadata?.is_admin === true ||
    user.user_metadata?.role === 'admin';

  if (!isAdmin) redirect('/app');

  // Fetch badge counts in parallel
  const svc = await createServiceClient();
  const [usersRes, jobsRes, leadsRes, leadsTodayRes] = await Promise.all([
    svc.from('profiles').select('id', { count: 'exact', head: true }),
    svc
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['queued', 'running']),
    svc.from('leads').select('id', { count: 'exact', head: true }),
    svc
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().slice(0, 10)),
  ]);

  const counts: Record<string, number> = {
    '/admin/users': usersRes.count ?? 0,
    '/admin/jobs': jobsRes.count ?? 0,
    '/admin/leads': (leadsTodayRes.count ?? 0) || (leadsRes.count ?? 0),
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/usage', label: 'Usage' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/content', label: 'Content' },
    { href: '/admin/settings', label: 'AI Settings' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-6">
        <Link
          href="/admin"
          className="mb-8 block text-lg font-light tracking-wide text-brand-700"
        >
          shrubb admin
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
              {(counts[item.href] ?? 0) > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                  {counts[item.href]}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <Link
            href="/app"
            className="block rounded-lg px-3 py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Back to App
          </Link>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
