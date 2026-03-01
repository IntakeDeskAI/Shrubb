import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import Link from 'next/link';

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
    return; // unreachable but helps TS narrow
  }

  const company = await getActiveCompany(supabase, user.id);

  if (!company) {
    return (
      <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900">No company found</h2>
        <p className="mt-2 text-sm text-gray-500">Complete onboarding to get started.</p>
        <Link
          href="/app/onboarding"
          className="mt-4 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const { companyId } = company;

  // Check company entitlements
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*')
    .eq('company_id', companyId)
    .single();

  // Get company's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  // Load response time stats
  const { data: responseStats } = await supabase
    .from('conversations')
    .select('first_inbound_at, first_response_at')
    .eq('account_id', companyId)
    .not('first_inbound_at', 'is', null)
    .not('first_response_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  let avgResponseSeconds: number | null = null;
  let totalConvosTracked = 0;
  if (responseStats && responseStats.length > 0) {
    const times = responseStats
      .filter((r) => r.first_inbound_at && r.first_response_at)
      .map((r) => {
        const inbound = new Date(r.first_inbound_at!).getTime();
        const response = new Date(r.first_response_at!).getTime();
        return (response - inbound) / 1000;
      })
      .filter((t) => t >= 0 && t < 86400);
    if (times.length > 0) {
      avgResponseSeconds = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      totalConvosTracked = times.length;
    }
  }

  // Load recent lead count (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newLeadsCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', companyId)
    .gte('created_at', weekAgo);

  const hasEntitlements = entitlements && entitlements.tier !== 'none';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        {hasEntitlements ? (
          <Link
            href="/app/new-project"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            New Project
          </Link>
        ) : (
          <Link
            href="/start"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Get Started — Choose a Plan
          </Link>
        )}
      </div>

      {/* Lead Response Stats */}
      {hasEntitlements && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Avg Response Time</p>
            <p className="mt-1 text-2xl font-bold text-brand-600">
              {avgResponseSeconds !== null
                ? avgResponseSeconds < 60
                  ? `${avgResponseSeconds}s`
                  : `${Math.round(avgResponseSeconds / 60)}m`
                : '—'}
            </p>
            {totalConvosTracked > 0 && (
              <p className="mt-0.5 text-[11px] text-gray-400">
                across {totalConvosTracked} conversations
              </p>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">New Leads (7 days)</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{newLeadsCount ?? 0}</p>
          </div>
          <Link href="/app/inbox" className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-200">
            <p className="text-xs font-medium text-gray-500">Inbox</p>
            <p className="mt-1 text-sm font-semibold text-brand-600">View messages &amp; calls</p>
          </Link>
        </div>
      )}

      {/* Entitlements Summary */}
      {hasEntitlements && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Plan:</span>{' '}
              <span className="font-semibold capitalize text-gray-900">{entitlements.tier}</span>
            </div>
            <div>
              <span className="text-gray-500">Proposals:</span>{' '}
              <span className="font-semibold text-gray-900">
                {entitlements.proposals_used}/{entitlements.included_proposals}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Renders:</span>{' '}
              <span className="font-semibold text-gray-900">
                {entitlements.renders_used}/{entitlements.included_renders}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Chat:</span>{' '}
              <span className="font-semibold text-gray-900">
                {entitlements.chat_messages_used}/{entitlements.included_chat_messages}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No plan yet */}
      {!hasEntitlements && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No active plan</h2>
          <p className="mt-2 text-sm text-gray-500">
            Choose a plan to start creating proposals with AI.
          </p>
          <Link
            href="/start"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* Projects List */}
      {projects && projects.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
            >
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              {project.address && (
                <p className="mt-1 text-sm text-gray-500">{project.address}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  project.status === 'active' ? 'bg-brand-50 text-brand-700' :
                  project.status === 'setup' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
