import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { B2B_ADDONS, type B2BAddonName } from '@landscape-ai/shared';
import { updateProfile } from './actions';

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UsageMeter({
  label,
  used,
  included,
}: {
  label: string;
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
// Add-on keys to display
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

  // Fetch data in parallel (company-scoped)
  const [entitlementsRes, purchasesRes, profileRes] = await Promise.all([
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
  ]);

  const entitlements = entitlementsRes.data as Entitlements | null;
  const purchases = ((purchasesRes as { data: Purchase[] | null }).data ?? []) as Purchase[];
  const profile = profileRes.data as Profile | null;

  const hasEntitlements = entitlements && entitlements.tier !== 'none';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1: Your Plan                                              */}
      {/* ---------------------------------------------------------------- */}
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
                label="Proposals"
                used={entitlements.proposals_used}
                included={entitlements.included_proposals}
              />
              <UsageMeter
                label="Renders"
                used={entitlements.renders_used}
                included={entitlements.included_renders}
              />
              <UsageMeter
                label="Chat Messages"
                used={entitlements.chat_messages_used}
                included={entitlements.included_chat_messages}
              />
              <UsageMeter
                label="Voice Minutes"
                used={entitlements.voice_minutes_used}
                included={entitlements.included_voice_minutes}
              />
            </div>

            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">AI Spending</span>
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

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: Purchase Add-ons                                       */}
      {/* ---------------------------------------------------------------- */}
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

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: Billing History                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Billing History
        </h2>
        <div className="mt-4">
          <PurchaseHistoryTable purchases={purchases} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 4: Company Info                                           */}
      {/* ---------------------------------------------------------------- */}
      {company && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Company</h2>
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{company.companyName}</span>
            <span className="ml-2 text-gray-400">·</span>
            <span className="ml-2 capitalize text-gray-500">{company.role}</span>
          </p>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Section 5: Profile                                                */}
      {/* ---------------------------------------------------------------- */}
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
