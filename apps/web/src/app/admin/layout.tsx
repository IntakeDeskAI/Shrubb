import { createClient } from '@/lib/supabase/server';
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
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Users
          </Link>
          <Link
            href="/admin/usage"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Usage
          </Link>
          <Link
            href="/admin/jobs"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Jobs
          </Link>
          <Link
            href="/admin/leads"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Leads
          </Link>
          <Link
            href="/admin/content"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Content
          </Link>
          <Link
            href="/admin/settings"
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            AI Settings
          </Link>
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
