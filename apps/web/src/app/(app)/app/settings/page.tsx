import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { B2B_ADDONS, type B2BAddonName } from '@landscape-ai/shared';
import { updateProfile, updateAiSettings, updateCompanyAddress } from './actions';
import { CompanyAddressForm } from './company-address-form';
import { CopyButton } from './copy-button';
import { Tooltip, HowTo } from '@/components/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Entitlements {
  tier: string;
  included_chat_messages: number;
  included_rerenders: number;
  included_projects: number;
  included_voice_minutes: number;
  included_proposals: number;
  included_renders: number;
  included_seats: number;
  chat_messages_used: number;
  rerenders_used: number;
  projects_used: number;
  voice_minutes_used: number;
  proposals_used: number;
  renders_used: number;
  spending_cap_cents: number;
  spending_used_cents: number;
}

interface Purchase {
  id: string;
  product_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

interface PhoneNumber {
  id: string;
  phone_e164: string;
  area_code: string | null;
  status: string;
}

interface CompanySettingsRow {
  ai_sms_enabled: boolean;
  ai_calls_enabled: boolean;
  call_forwarding_enabled: boolean;
  forward_phone_e164: string | null;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_timezone: string;
  auto_nudge_enabled: boolean;
  nudge_delay_hours: number;
  nudge_max_count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UsageMeter({
  label,
  used,
  included,
}: {
  label: React.ReactNode;
  used: number;
  included: number;
}) {
  const pct = included > 0 ? Math.min((used / included) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {used} / {included}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AddonCard({
  addonKey,
  addon,
}: {
  addonKey: string;
  addon: { label: string; description: string; price_cents: number };
}) {
  const priceStr = `$${(addon.price_cents / 100).toFixed(2)}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h4 className="font-semibold text-gray-900">{addon.label}</h4>
      <p className="mt-1 text-sm text-gray-500">{addon.description}</p>
      <p className="mt-3 text-lg font-bold text-gray-900">{priceStr}</p>
      <form action="/api/stripe/checkout" method="POST" className="mt-4">
        <input type="hidden" name="product_type" value="addon" />
        <input type="hidden" name="product_name" value={addonKey} />
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Buy
        </button>
      </form>
    </div>
  );
}

function PurchaseHistoryTable({ purchases }: { purchases: Purchase[] }) {
  if (purchases.length === 0) {
    return (
      <p className="text-sm text-gray-500">No purchases yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-2 pr-4 font-medium text-gray-500">Date</th>
            <th className="pb-2 pr-4 font-medium text-gray-500">Product</th>
            <th className="pb-2 pr-4 font-medium text-gray-500">Amount</th>
            <th className="pb-2 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {purchases.map((p) => (
            <tr key={p.id}>
              <td className="py-3 pr-4 text-gray-600">
                {new Date(p.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 pr-4 font-medium text-gray-900">
                {p.product_name}
              </td>
              <td className="py-3 pr-4 text-gray-900">
                ${(p.amount_cents / 100).toFixed(2)}
              </td>
              <td className="py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === 'succeeded'
                      ? 'bg-green-50 text-green-700'
                      : p.status === 'refunded'
                        ? 'bg-yellow-50 text-yellow-700'
                        : p.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add-on keys
// ---------------------------------------------------------------------------

const VISIBLE_ADDONS: B2BAddonName[] = [
  'proposal_pack',
  'render_pack',
  'chat_pack',
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const company = await getActiveCompany(supabase, user.id);

  // Fetch data in parallel
  const [entitlementsRes, purchasesRes, profileRes, phoneRes, settingsRes, companyAddressRes] = await Promise.all([
    company
      ? supabase
          .from('entitlements')
          .select('*')
          .eq('company_id', company.companyId)
          .single()
      : Promise.resolve({ data: null }),
    company
      ? supabase
          .from('purchases')
          .select('*')
          .eq('company_id', company.companyId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single(),
    company
      ? supabase
          .from('phone_numbers')
          .select('id, phone_e164, area_code, status')
          .eq('account_id', company.companyId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    company
      ? supabase
          .from('company_settings')
          .select('*')
          .eq('company_id', company.companyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    company
      ? supabase
          .from('companies')
          .select('address_place_id, address_formatted, address_lat, address_lng, address_raw')
          .eq('id', company.companyId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const entitlements = entitlementsRes.data as Entitlements | null;
  const purchases = ((purchasesRes as { data: Purchase[] | null }).data ?? []) as Purchase[];
  const profile = profileRes.data as Profile | null;
  const phoneNumber = phoneRes.data as PhoneNumber | null;
  const aiSettings = settingsRes.data as CompanySettingsRow | null;
  const companyAddress = companyAddressRes.data as {
    address_place_id: string | null;
    address_formatted: string | null;
    address_lat: number | null;
    address_lng: number | null;
    address_raw: string | null;
  } | null;

  const hasEntitlements = entitlements && entitlements.tier !== 'none';

  // ── Activation checklist ──
  let hasTestCall = false;
  let hasTestText = false;
  let hasFirstLead = false;

  if (company) {
    const [callCountRes, smsCountRes, leadCountRes] = await Promise.all([
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id',
          (await supabase
            .from('conversations')
            .select('id')
            .eq('account_id', company.companyId)
          ).data?.map((c) => c.id) ?? ['__none__']
        ),
      supabase
        .from('sms_messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id',
          (await supabase
            .from('conversations')
            .select('id')
            .eq('account_id', company.companyId)
          ).data?.map((c) => c.id) ?? ['__none__']
        ),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', company.companyId),
    ]);

    hasTestCall = (callCountRes.count ?? 0) > 0;
    hasTestText = (smsCountRes.count ?? 0) > 0;
    hasFirstLead = (leadCountRes.count ?? 0) > 0;
  }

  const checklist = [
    { label: 'Business address added', done: !!companyAddress?.address_place_id },
    { label: 'AI number live', done: !!phoneNumber && phoneNumber.status === 'active' },
    { label: 'Test call completed', done: hasTestCall },
    { label: 'Test text completed', done: hasTestText },
    { label: 'First lead received', done: hasFirstLead },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

  // Phone number status
  let phoneStatus: { label: string; color: string; borderColor: string } = {
    label: 'Provisioning',
    color: 'bg-yellow-50 text-yellow-700',
    borderColor: 'border-yellow-300',
  };
  if (phoneNumber) {
    if (phoneNumber.status === 'active') {
      phoneStatus = { label: 'Live', color: 'bg-green-50 text-green-700', borderColor: 'border-green-300' };
    } else {
      phoneStatus = { label: 'Error', color: 'bg-red-50 text-red-700', borderColor: 'border-red-300' };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Activation Checklist                                              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {company && checklistDone < 5 && (
        <section className="rounded-xl border border-brand-200 bg-brand-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Get Started</h2>
            <span className="text-sm font-medium text-brand-600">
              {checklistDone}/5 complete
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${(checklistDone / 5) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <svg className="h-5 w-5 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={item.done ? 'text-gray-700' : 'text-gray-500'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* AI Number Status Module                                           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {company && (
        <section className={`rounded-xl border bg-white p-6 shadow-sm ${phoneStatus.borderColor}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Shrubb AI Number</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${phoneStatus.color}`}>
              {phoneStatus.label}
            </span>
          </div>

          {phoneNumber && phoneNumber.status === 'active' ? (
            <div className="mt-4">
              <p className="text-3xl font-bold text-brand-600">
                {formatPhone(phoneNumber.phone_e164)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Dedicated local number &middot; SMS + inbound calls
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton text={phoneNumber.phone_e164} label="Copy Number" />
                <a
                  href={`tel:${phoneNumber.phone_e164}`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Test Call
                </a>
                <a
                  href={`sms:${phoneNumber.phone_e164}`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Test Text
                </a>
              </div>
            </div>
          ) : phoneNumber ? (
            <p className="mt-3 text-sm text-red-600">
              There was an issue with your AI number. Please contact support.
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Your AI number is being provisioned. This usually takes less than a minute.
            </p>
          )}

          {/* Forwarding instructions */}
          <details className="mt-6 rounded-lg border border-gray-100">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900">
              How to forward your calls to Shrubb
            </summary>
            <div className="space-y-4 px-4 pb-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-700">iPhone</p>
                <ol className="mt-1 list-inside list-decimal space-y-1 text-xs">
                  <li>Open Settings → Phone → Call Forwarding</li>
                  <li>Toggle on Call Forwarding</li>
                  <li>Enter your Shrubb AI number</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Android</p>
                <ol className="mt-1 list-inside list-decimal space-y-1 text-xs">
                  <li>Open Phone app → ⋮ → Settings → Calls → Call Forwarding</li>
                  <li>Tap &quot;Always forward&quot;</li>
                  <li>Enter your Shrubb AI number</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Voicemail-only forwarding</p>
                <p className="mt-1 text-xs">
                  Dial <code className="rounded bg-gray-100 px-1">*71</code> followed by your Shrubb number to forward unanswered calls only. This lets you try before fully committing.
                </p>
              </div>
            </div>
          </details>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Workflow Settings                                                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {company && aiSettings && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Workflow Settings</h2>

          <form action={updateAiSettings} className="mt-6 space-y-6">
            {/* ── Business Hours ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Business Hours</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Outside these hours, calls go to AI voicemail and texts get an auto-reply.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="bh_start" className="block text-sm font-medium text-gray-700">
                    Start
                  </label>
                  <input
                    id="bh_start"
                    name="business_hours_start"
                    type="time"
                    defaultValue={aiSettings.business_hours_start}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="bh_end" className="block text-sm font-medium text-gray-700">
                    End
                  </label>
                  <input
                    id="bh_end"
                    name="business_hours_end"
                    type="time"
                    defaultValue={aiSettings.business_hours_end}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="bh_tz" className="block text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <select
                    id="bh_tz"
                    name="business_hours_timezone"
                    defaultValue={aiSettings.business_hours_timezone}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="America/New_York">Eastern</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="America/Anchorage">Alaska</option>
                    <option value="Pacific/Honolulu">Hawaii</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Lead Intake ── */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">Lead Intake</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Control how your AI handles inbound messages and calls.
              </p>
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable AI SMS auto-replies <Tooltip text="When enabled, the AI responds to inbound texts within seconds using your company context" /></p>
                    <p className="text-xs text-gray-400">AI responds to inbound text messages</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" name="ai_sms_enabled" value="true" defaultChecked={aiSettings.ai_sms_enabled} className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable AI to answer inbound calls <Tooltip text="AI picks up calls, asks about the project, and saves a transcript you can review" /></p>
                    <p className="text-xs text-gray-400">AI answers and transcribes phone calls</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" name="ai_calls_enabled" value="true" defaultChecked={aiSettings.ai_calls_enabled} className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>
            </div>

            {/* ── Call Handling ── */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">Call Handling</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Route calls to your personal phone after the AI greeting.
              </p>
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Forward calls to my phone <Tooltip text="Routes calls to your personal number after the AI greeting. Turn off to let AI handle the full call." /></p>
                    <p className="text-xs text-gray-400">Route calls to your personal number</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" name="call_forwarding_enabled" value="true" defaultChecked={aiSettings.call_forwarding_enabled} className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div>
                  <label htmlFor="forward_phone" className="block text-sm font-medium text-gray-700">
                    Forwarding Number
                  </label>
                  <input
                    id="forward_phone"
                    name="forward_phone_e164"
                    type="tel"
                    defaultValue={aiSettings.forward_phone_e164 ?? ''}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            {/* ── Follow-up Automation ── */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">Follow-up Automation</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Automatically nudge clients who viewed a proposal but haven&apos;t responded.
              </p>
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable auto-nudge follow-ups <Tooltip text="Sends a friendly SMS follow-up to clients who viewed a proposal but haven't responded" /></p>
                    <p className="text-xs text-gray-400">Send SMS reminders for viewed proposals</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" name="auto_nudge_enabled" value="true" defaultChecked={aiSettings.auto_nudge_enabled} className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nudge_delay" className="block text-sm font-medium text-gray-700">
                      Delay before first nudge (hours)
                    </label>
                    <input
                      id="nudge_delay"
                      name="nudge_delay_hours"
                      type="number"
                      min={12}
                      max={168}
                      defaultValue={aiSettings.nudge_delay_hours}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="nudge_max" className="block text-sm font-medium text-gray-700">
                      Max follow-ups per proposal
                    </label>
                    <select
                      id="nudge_max"
                      name="nudge_max_count"
                      defaultValue={aiSettings.nudge_max_count}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Proposal Automation ── */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">Proposal Automation</h3>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Auto-send proposals</p>
                  <p className="text-xs text-gray-400">Automatically send proposals when estimates are ready</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-500">
                  Coming soon
                </span>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                Save Settings
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Company Info                                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {company && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Company</h2>
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{company.companyName}</span>
            <span className="ml-2 text-gray-400">·</span>
            <span className="ml-2 capitalize text-gray-500">{company.role}</span>
          </p>

          {/* Company Address */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-900">Business Address</h3>
            <p className="mt-1 text-xs text-gray-400">
              Used for proposal branding and travel estimates. Always review pricing.
            </p>
            {companyAddress?.address_raw && !companyAddress.address_place_id && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Your business address has not been verified. Please select from the autocomplete suggestions below.
              </div>
            )}
            <CompanyAddressForm
              action={updateCompanyAddress}
              defaultAddress={companyAddress?.address_formatted ?? companyAddress?.address_raw ?? ''}
            />
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Your Plan                                                         */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your Plan</h2>

        {hasEntitlements ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-2xl font-bold capitalize text-brand-600">
                {entitlements.tier}
              </p>
              {entitlements.tier === 'trial' && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Trial
                </span>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <UsageMeter
                label={<>Proposals <Tooltip text="Proposals generated this billing period. Buy a Proposal Pack add-on if you run out." /></>}
                used={entitlements.proposals_used}
                included={entitlements.included_proposals}
              />
              <UsageMeter
                label={<>Renders <Tooltip text="AI landscape renderings generated this period" /></>}
                used={entitlements.renders_used}
                included={entitlements.included_renders}
              />
              <UsageMeter
                label={<>Chat Messages <Tooltip text="Messages exchanged with AI on project pages" /></>}
                used={entitlements.chat_messages_used}
                included={entitlements.included_chat_messages}
              />
              <UsageMeter
                label={<>Voice Minutes <Tooltip text="Minutes of AI-answered phone calls" /></>}
                used={entitlements.voice_minutes_used}
                included={entitlements.included_voice_minutes}
              />
            </div>

            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">AI Spending <Tooltip text="Total API costs for AI operations. The spending cap protects against unexpected charges." /></span>
                <span className="font-medium text-gray-900">
                  ${(entitlements.spending_used_cents / 100).toFixed(2)} / $
                  {(entitlements.spending_cap_cents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <a
                href="/start"
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                {entitlements.tier === 'trial' ? 'Upgrade Plan' : 'Change Plan'}
              </a>
            </div>
          </>
        ) : (
          <div className="mt-4 text-sm text-gray-500">
            No active plan.{' '}
            <a
              href="/start"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Choose a plan
            </a>{' '}
            to get started.
          </div>
        )}
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Purchase Add-ons                                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {hasEntitlements && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Purchase Add-ons
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Need more capacity? Add extra resources to your plan.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {VISIBLE_ADDONS.map((key) => (
              <AddonCard
                key={key}
                addonKey={key}
                addon={B2B_ADDONS[key]}
              />
            ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Billing History                                                   */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Billing History
        </h2>
        <div className="mt-4">
          <PurchaseHistoryTable purchases={purchases} />
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Profile                                                           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

        <form action={updateProfile} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700"
            >
              Display Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile?.full_name ?? ''}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ''}
              disabled
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 shadow-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Phone verification coming soon.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
