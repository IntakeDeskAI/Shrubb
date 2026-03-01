import { B2B_PLANS, B2B_PRICING_COMPARISON } from "@landscape-ai/shared";
import type { B2BPlanName, B2BPricingFeature } from "@landscape-ai/shared";
import Link from "next/link";

const PLAN_ORDER: B2BPlanName[] = ["starter", "pro", "growth"];

function formatPrice(cents: number): string {
  return `$${Math.floor(cents / 100)}`;
}

function CheckIcon() {
  return (
    <svg
      className="mx-auto h-5 w-5 text-brand-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="mx-auto h-5 w-5 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? <CheckIcon /> : <XIcon />;
  }
  return <span className="text-sm text-gray-700">{value}</span>;
}

function PlanCard({
  planKey,
  highlighted,
}: {
  planKey: B2BPlanName;
  highlighted?: boolean;
}) {
  const plan = B2B_PLANS[planKey];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        highlighted
          ? "border-brand-500 shadow-xl ring-2 ring-brand-500"
          : "border-gray-200 shadow-sm"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-gray-900">{plan.label}</h3>

      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          {formatPrice(plan.price_cents)}
        </span>
        <span className="text-sm text-gray-500">/month</span>
      </p>

      <ul className="mt-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={`/start?plan=${planKey}`}
        className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
          highlighted
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-gray-50 text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
        }`}
      >
        Start landscaper trial
      </Link>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="mt-20 overflow-x-auto">
      <h3 className="mb-6 text-center text-xl font-semibold text-gray-900">
        Compare plans
      </h3>
      <table className="mx-auto w-full max-w-3xl text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 pr-4 text-sm font-medium text-gray-500">
              Feature
            </th>
            {PLAN_ORDER.map((key) => (
              <th
                key={key}
                className="px-4 py-3 text-center text-sm font-semibold text-gray-900"
              >
                {B2B_PLANS[key].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {B2B_PRICING_COMPARISON.map((row: B2BPricingFeature) => (
            <tr key={row.label} className="border-b border-gray-100">
              <td className="py-3 pr-4 text-sm text-gray-700">{row.label}</td>
              <td className="px-4 py-3 text-center">
                <ComparisonCell value={row.starter} />
              </td>
              <td className="px-4 py-3 text-center">
                <ComparisonCell value={row.pro} />
              </td>
              <td className="px-4 py-3 text-center">
                <ComparisonCell value={row.growth} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingTable() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Plans that grow with your business
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
        Start with a free trial. If you close one extra $3,000 job a month, Shrubb pays for itself.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {PLAN_ORDER.map((key) => (
          <PlanCard
            key={key}
            planKey={key}
            highlighted={key === "pro"}
          />
        ))}
      </div>

      <ComparisonTable />
    </section>
  );
}
