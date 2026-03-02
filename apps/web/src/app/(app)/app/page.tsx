import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import Link from 'next/link';
import { formatPhone, timeAgo, formatResponseTime } from '@/lib/format';
import { Tooltip, HowTo } from '@/components/tooltip';

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
    return;
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // ── 5 Funnel Metrics ──

  // 1. Calls answered this week
  const { count: callsAnsweredCount } = await supabase
    .from('calls')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id',
      (await supabase
        .from('conversations')
        .select('id')
        .eq('account_id', companyId)
      ).data?.map((c) => c.id) ?? ['__none__']
    )
    .eq('status', 'completed')
    .gte('started_at', weekAgo);

  // 2. Leads qualified (conversations with AI response this week)
  const { count: leadsQualifiedCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', companyId)
    .not('first_response_at', 'is', null)
    .gte('first_inbound_at', weekAgo);

  // 3. Estimates ready (draft proposals this week)
  const { count: estimatesReadyCount } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'draft')
    .gte('created_at', weekAgo);

  // 4. Proposals sent this week
  const { count: proposalsSentCount } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['sent', 'viewed', 'accepted'])
    .gte('sent_at', weekAgo);

  // 5. Accepted this week
  const { count: acceptedCount } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'accepted')
    .gte('accepted_at', weekAgo);

  // ── Activity Feed ──
  type ActivityItem = {
    type: string;
    label: string;
    detail: string;
    date: string;
    href: string;
  };

  const activityItems: ActivityItem[] = [];

  // Recent proposal views
  const { data: recentViews } = await supabase
    .from('proposals')
    .select('id, viewed_at, clients ( name )')
    .eq('company_id', companyId)
    .not('viewed_at', 'is', null)
    .order('viewed_at', { ascending: false })
    .limit(5);

  for (const v of recentViews ?? []) {
    const client = v.clients as unknown as { name: string } | null;
    activityItems.push({
      type: 'viewed',
      label: 'Proposal viewed',
      detail: client?.name ?? 'A client',
      date: v.viewed_at!,
      href: `/app/proposals/${v.id}`,
    });
  }

  // Recent acceptances
  const { data: recentAccepted } = await supabase
    .from('proposals')
    .select('id, accepted_at, clients ( name )')
    .eq('company_id', companyId)
    .eq('status', 'accepted')
    .not('accepted_at', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(3);

  for (const a of recentAccepted ?? []) {
    const client = a.clients as unknown as { name: string } | null;
    activityItems.push({
      type: 'accepted',
      label: 'Proposal accepted',
      detail: client?.name ?? 'A client',
      date: a.accepted_at!,
      href: `/app/proposals/${a.id}`,
    });
  }

  // Recent new leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, name, phone, created_at')
    .eq('account_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5);

  for (const l of recentLeads ?? []) {
    activityItems.push({
      type: 'new_lead',
      label: 'New lead',
      detail: l.name || formatPhone(l.phone),
      date: l.created_at,
      href: '/app/leads',
    });
  }

  // Recent draft estimates
  const { data: recentDrafts } = await supabase
    .from('proposals')
    .select('id, created_at, clients ( name )')
    .eq('company_id', companyId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(3);

  for (const d of recentDrafts ?? []) {
    const client = d.clients as unknown as { name: string } | null;
    activityItems.push({
      type: 'estimate',
      label: 'Estimate created',
      detail: client?.name ?? 'Draft proposal',
      date: d.created_at,
      href: `/app/proposals/${d.id}`,
    });
  }

  // Sort by date, take top 8
  activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activityFeed = activityItems.slice(0, 8);

  // Activity icon colors
  const ACTIVITY_STYLES: Record<string, { icon: string; color: string }> = {
    accepted: { icon: '✓', color: 'bg-emerald-100 text-emerald-700' },
    viewed: { icon: '👁', color: 'bg-blue-100 text-blue-700' },
    new_lead: { icon: '📞', color: 'bg-brand-100 text-brand-700' },
    estimate: { icon: '📋', color: 'bg-amber-100 text-amber-700' },
  };

  // ── Recent leads data for lead status ──
  const leadIds = (recentLeads ?? []).map((l) => l.id);
  let leadConversations: { lead_id: string; channel: string; first_response_at: string | null }[] = [];
  let leadCalls: { conversation_id: string; summary_text: string | null; lead_id?: string }[] = [];
  let leadSmsMessages: { conversation_id: string; direction: string; body: string; lead_id?: string }[] = [];

  if (leadIds.length > 0) {
    const { data: convos } = await supabase
      .from('conversations')
      .select('id, lead_id, channel, first_response_at')
      .in('lead_id', leadIds);

    leadConversations = (convos ?? []) as typeof leadConversations;
    const convoIds = (convos ?? []).map((c) => c.id);

    if (convoIds.length > 0) {
      const { data: calls } = await supabase
        .from('calls')
        .select('conversation_id, summary_text')
        .in('conversation_id', convoIds)
        .order('started_at', { ascending: false });

      leadCalls = (calls ?? []) as typeof leadCalls;

      const { data: msgs } = await supabase
        .from('sms_messages')
        .select('conversation_id, direction, body')
        .in('conversation_id', convoIds)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: true })
        .limit(50);

      leadSmsMessages = (msgs ?? []) as typeof leadSmsMessages;
    }

    const convoToLead = new Map((convos ?? []).map((c) => [c.id, c.lead_id]));
    for (const c of leadCalls) c.lead_id = convoToLead.get(c.conversation_id) ?? undefined;
    for (const m of leadSmsMessages) m.lead_id = convoToLead.get(m.conversation_id) ?? undefined;
  }

  // Load proposals for lead status derivation
  const { data: allProposals } = await supabase
    .from('proposals')
    .select('id, status, clients ( phone )')
    .eq('company_id', companyId)
    .in('status', ['sent', 'viewed', 'accepted', 'declined']);

  const phoneProposalStatus = new Map<string, string>();
  for (const p of allProposals ?? []) {
    const client = p.clients as unknown as { phone: string } | null;
    if (!client?.phone) continue;
    const existing = phoneProposalStatus.get(client.phone);
    if (p.status === 'accepted' || !existing) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (
      (p.status === 'sent' || p.status === 'viewed') &&
      existing !== 'accepted'
    ) {
      phoneProposalStatus.set(client.phone, p.status);
    }
  }

  function getLeadStatus(lead: { phone: string; id: string }): {
    label: string;
    color: string;
  } {
    const proposalStatus = phoneProposalStatus.get(lead.phone);
    if (proposalStatus === 'accepted')
      return { label: 'Accepted', color: 'text-green-600 bg-green-50' };
    if (proposalStatus === 'sent' || proposalStatus === 'viewed')
      return { label: 'Proposal sent', color: 'text-blue-600 bg-blue-50' };

    const hasResponse = leadConversations.some(
      (c) => c.lead_id === lead.id && c.first_response_at,
    );
    if (hasResponse)
      return { label: 'Qualified', color: 'text-amber-600 bg-amber-50' };

    return { label: 'New', color: 'text-gray-600 bg-gray-100' };
  }

  function getLeadProjectType(leadId: string): string {
    const callSummary = leadCalls.find(
      (c) => c.lead_id === leadId && c.summary_text,
    );
    if (callSummary?.summary_text) {
      const first = callSummary.summary_text.split(/[.!?]/)[0];
      return first.length > 60 ? first.slice(0, 57) + '...' : first;
    }
    const firstMsg = leadSmsMessages.find(
      (m) => m.lead_id === leadId,
    );
    if (firstMsg?.body) {
      return firstMsg.body.length > 60
        ? firstMsg.body.slice(0, 57) + '...'
        : firstMsg.body;
    }
    return 'New lead';
  }

  const hasEntitlements = entitlements && entitlements.tier !== 'none';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {hasEntitlements ? (
          <Link
            href="/app/new-project"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Create Proposal
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

      {/* ─── 5 Funnel Metrics ─── */}
      {hasEntitlements && (
        <>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
            This Week
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-lg bg-brand-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-brand-600">
                {callsAnsweredCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Calls answered <Tooltip text="Completed inbound calls to your AI number this week" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-green-600">
                {leadsQualifiedCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Leads qualified <Tooltip text="Leads where AI gathered project details this week" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-amber-600">
                {estimatesReadyCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Estimates ready <Tooltip text="Draft proposals created this week, ready to review and send" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-blue-600">
                {proposalsSentCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Proposals sent <Tooltip text="Proposals emailed to clients this week" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-emerald-600">
                {acceptedCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Accepted <Tooltip text="Proposals approved by clients this week" position="bottom" />
              </p>
            </div>
          </div>
        </>
      )}

      {/* ─── Activity Feed ─── */}
      {hasEntitlements && activityFeed.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent Activity
          </p>
          <div className="mt-3 space-y-2">
            {activityFeed.map((item, i) => {
              const style = ACTIVITY_STYLES[item.type] ?? { icon: '•', color: 'bg-gray-100 text-gray-600' };
              return (
                <Link
                  key={`${item.type}-${i}`}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 transition hover:border-brand-200 hover:shadow-sm"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${style.color}`}>
                    {style.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="truncate text-xs text-gray-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {timeAgo(item.date)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Recent Leads ─── */}
      {hasEntitlements && recentLeads && recentLeads.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Recent Leads
            </p>
            <Link href="/app/leads" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentLeads.map((lead) => {
              const status = getLeadStatus(lead);
              const projectType = getLeadProjectType(lead.id);
              return (
                <Link
                  key={lead.id}
                  href="/app/leads"
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition hover:border-brand-200 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.name || formatPhone(lead.phone)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">
                      {projectType} &middot; {timeAgo(lead.created_at)}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}
                  >
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Quick Links ─── */}
      {hasEntitlements && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/app/leads"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">Leads</p>
            <p className="mt-1 text-sm font-semibold text-brand-600">
              View leads &amp; conversations
            </p>
          </Link>
          <Link
            href="/app/proposals"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">Proposals</p>
            <p className="mt-1 text-sm font-semibold text-brand-600">
              Manage client proposals
            </p>
          </Link>
        </div>
      )}

      {/* ─── Entitlements Summary ─── */}
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

      {/* ─── No plan yet ─── */}
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

      {/* ─── Projects List ─── */}
      {projects && projects.length > 0 && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Projects <Tooltip text="Setup = gathering info · Planning = AI generating design · Active = design complete" />
            </h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      )}
    </div>
  );
}
