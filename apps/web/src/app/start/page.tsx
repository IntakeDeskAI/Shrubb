import { createClient } from '@/lib/supabase/server';
import { ShrubbLogo } from '@/components/shrubb-logo';
import { B2B_PLANS } from '@landscape-ai/shared';
import type { B2BPlanName } from '@landscape-ai/shared';

const PLAN_ORDER: B2BPlanName[] = ['starter', 'pro', 'growth'];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <ShrubbLogo />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Canceled banner */}
        {params.canceled && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Start with a 7-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PLAN_ORDER.map((planName) => {
            const plan = B2B_PLANS[planName];
            const isHighlighted = planName === 'pro';

            return (
              <div
                key={planName}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md ${
                  isHighlighted
                    ? 'border-brand-500 ring-2 ring-brand-500'
                    : 'border-gray-200'
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}

                <h2 className="text-xl font-semibold text-gray-900">
                  {plan.label}
                </h2>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price_cents)}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {user ? (
                  <form action="/api/stripe/checkout" method="POST" className="mt-8">
                    <input type="hidden" name="product_type" value="plan" />
                    <input type="hidden" name="product_name" value={planName} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                        isHighlighted
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Start Free Trial
                    </button>
                  </form>
                ) : (
                  <a
                    href={`/login?redirect=/start&plan=${planName}`}
                    className={`mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                      isHighlighted
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Start Free Trial
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
