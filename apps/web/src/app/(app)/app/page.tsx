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
    }
  }

  // Load new lead count (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newLeadsCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', companyId)
    .gte('created_at', weekAgo);

  // Count proposals sent this week
  const { count: proposalsSentCount } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['sent', 'viewed', 'accepted'])
    .gte('sent_at', weekAgo);

  // Load recent leads with conversations for status derivation
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, name, phone, created_at')
    .eq('account_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get conversations + calls for recent leads to extract project type
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

    // Tag calls and messages with lead_id via conversation lookup
    const convoToLead = new Map((convos ?? []).map((c) => [c.id, c.lead_id]));
    for (const c of leadCalls) c.lead_id = convoToLead.get(c.conversation_id) ?? undefined;
    for (const m of leadSmsMessages) m.lead_id = convoToLead.get(m.conversation_id) ?? undefined;
  }

  // Load proposals with clients to match leads by phone
  const { data: allProposals } = await supabase
    .from('proposals')
    .select('id, status, clients ( phone )')
    .eq('company_id', companyId)
    .in('status', ['sent', 'viewed', 'accepted', 'declined']);

  // Build phone → best proposal status map
  const phoneProposalStatus = new Map<string, string>();
  for (const p of allProposals ?? []) {
    const client = p.clients as unknown as { phone: string } | null;
    if (!client?.phone) continue;
    const existing = phoneProposalStatus.get(client.phone);
    // Priority: accepted > sent/viewed > declined
    if (p.status === 'accepted' || !existing) {
      phoneProposalStatus.set(client.phone, p.status);
    } else if (
      (p.status === 'sent' || p.status === 'viewed') &&
      existing !== 'accepted'
    ) {
      phoneProposalStatus.set(client.phone, p.status);
    }
  }

  // Derive lead status and project type
  function getLeadStatus(lead: { phone: string; id: string }): {
    label: string;
    color: string;
  } {
    const proposalStatus = phoneProposalStatus.get(lead.phone);
    if (proposalStatus === 'accepted')
      return { label: 'Accepted', color: 'text-green-600 bg-green-50' };
    if (proposalStatus === 'sent' || proposalStatus === 'viewed')
      return { label: 'Proposal sent', color: 'text-blue-600 bg-blue-50' };

    // Check if there's a conversation with AI response
    const hasResponse = leadConversations.some(
      (c) => c.lead_id === lead.id && c.first_response_at,
    );
    if (hasResponse)
      return { label: 'Qualified', color: 'text-amber-600 bg-amber-50' };

    return { label: 'New', color: 'text-gray-600 bg-gray-100' };
  }

  function getLeadProjectType(leadId: string): string {
    // Try call summary first
    const callSummary = leadCalls.find(
      (c) => c.lead_id === leadId && c.summary_text,
    );
    if (callSummary?.summary_text) {
      // Take first sentence or first 60 chars
      const first = callSummary.summary_text.split(/[.!?]/)[0];
      return first.length > 60 ? first.slice(0, 57) + '...' : first;
    }
    // Try first inbound SMS
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

      {/* ─── Stat Cards ─── */}
      {hasEntitlements && (
        <>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
            This Week
          </p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-brand-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-brand-600">
                {newLeadsCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Leads captured <Tooltip text="Inbound SMS and calls to your Shrubb number this week" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-green-600">
                {avgResponseSeconds !== null
                  ? formatResponseTime(avgResponseSeconds)
                  : '—'}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Avg response <Tooltip text="Average time between first inbound message and AI's first reply" position="bottom" />
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-amber-600">
                {proposalsSentCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Proposals sent <Tooltip text="Proposals emailed to clients this week" position="bottom" />
              </p>
            </div>
          </div>
        </>
      )}

      {/* ─── Recent Leads ─── */}
      {hasEntitlements && recentLeads && recentLeads.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-500">
            Recent Leads <Tooltip text="New = just contacted · Qualified = AI gathered project details · Proposal sent = estimate emailed · Accepted = client approved" position="bottom" />
          </p>
          <div className="mt-2 space-y-2">
            {recentLeads.map((lead) => {
              const status = getLeadStatus(lead);
              const projectType = getLeadProjectType(lead.id);
              return (
                <Link
                  key={lead.id}
                  href="/app/inbox"
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
            href="/app/inbox"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">Inbox</p>
            <p className="mt-1 text-sm font-semibold text-brand-600">
              View messages &amp; calls
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

      {hasEntitlements && (
        <HowTo text="Start by adding a client, then create a project to generate an AI landscape design and proposal." className="mt-4" />
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
