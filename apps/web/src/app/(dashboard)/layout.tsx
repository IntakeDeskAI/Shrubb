import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShrubbLogo } from '@/components/shrubb-logo';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <ShrubbLogo size="small" color="green" href="/dashboard" />
            <Link href="/dashboard/projects" className="text-sm text-gray-500 hover:text-gray-900">
              Projects
            </Link>
            <Link href="/dashboard/billing" className="text-sm text-gray-500 hover:text-gray-900">
              Billing
            </Link>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
