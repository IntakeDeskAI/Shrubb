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

  // Badge counts for sidebar
  let badgeCounts = { leads: 0, proposals: 0 };
  if (company) {
    const [newLeadsRes, draftProposalsRes, viewedProposalsRes] = await Promise.all([
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', company.companyId)
        .is('first_response_at', null),
      supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.companyId)
        .eq('status', 'draft'),
      supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.companyId)
        .eq('status', 'viewed'),
    ]);
    badgeCounts = {
      leads: newLeadsRes.count ?? 0,
      proposals: (draftProposalsRes.count ?? 0) + (viewedProposalsRes.count ?? 0),
    };
  }

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
        counts={badgeCounts}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
