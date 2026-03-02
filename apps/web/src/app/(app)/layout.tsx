import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveCompany } from '@/lib/company';
import { AppSidebar } from '@/components/app-sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const company = await getActiveCompany(supabase, user.id);

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar
        companyName={company?.companyName ?? null}
        signOutAction={signOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
