import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ShrubbLogo } from "@/components/shrubb-logo";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import {
  getAllComparisons,
  getComparisonBySlug,
} from "@/data/comparisons";

/* ───────────────────────── Static params ───────────────────────── */

export function generateStaticParams() {
  return getAllComparisons().map((c) => ({ slug: c.slug }));
}

/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) return {};

  return {
    title: `${comparison.title} | Shrubb`,
    description: comparison.subtitle,
  };
}

/* ───────────────────────── Icons ───────────────────────── */

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-brand-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) notFound();

  const otherComparisons = getAllComparisons().filter(
    (c) => c.slug !== comparison.slug,
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ═══════════ NAV ═══════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <ShrubbLogo size="default" color="green" />
          <nav className="hidden items-center gap-8 text-sm text-gray-500 sm:flex">
            <Link href="/" className="transition hover:text-gray-900">
              Home
            </Link>
            <Link href="/blog" className="transition hover:text-gray-900">
              Blog
            </Link>
            <Link href="/compare" className="transition hover:text-gray-900">
              Compare
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Try Shrubb free
            </Link>
          </nav>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Try free
          </Link>
        </div>
      </header>

      {/* ═══════════ BREADCRUMBS ═══════════ */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-24 pb-2">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Compare", href: "/compare" },
            { label: comparison.title },
          ]}
        />
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-8 pb-16">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {comparison.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            {comparison.subtitle}
          </p>
        </div>
      </section>

      {/* ═══════════ FEATURE COMPARISON TABLE ═══════════ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Feature-by-Feature Comparison
          </h2>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Feature
                  </th>
                  <th className="px-6 py-4 font-semibold text-brand-700">
                    Shrubb
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500">
                    {comparison.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.features.map((f, i) => (
                  <tr
                    key={f.feature}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {f.feature}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className="flex items-start gap-2">
                        <CheckIcon />
                        <span>{f.shrubb}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{f.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {comparison.features.map((f) => (
              <div
                key={f.feature}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="mb-3 text-sm font-bold text-gray-900">
                  {f.feature}
                </p>
                <div className="mb-3 rounded-lg bg-brand-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Shrubb
                  </p>
                  <p className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon />
                    <span>{f.shrubb}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {comparison.competitor}
                  </p>
                  <p className="text-sm text-gray-500">{f.competitor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ KEY ADVANTAGES ═══════════ */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Why Landscapers Choose Shrubb
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {comparison.shrubWins.map((win) => (
              <div
                key={win}
                className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <CheckIcon />
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{win}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ VERDICT ═══════════ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            The Verdict
          </h2>
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-8">
            <p className="text-center text-base leading-relaxed text-gray-700">
              {comparison.verdict}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-50 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to upgrade your proposals?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Join landscapers who close more jobs with AI-powered proposals.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
          >
            Try Shrubb free
            <ArrowRightIcon />
          </Link>
          <p className="mt-3 text-sm text-gray-400">
            7-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ═══════════ OTHER COMPARISONS ═══════════ */}
      {otherComparisons.length > 0 && (
        <section className="border-t border-gray-100 bg-white px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Other Comparisons
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {otherComparisons.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="group rounded-xl border border-gray-200 p-6 transition hover:border-brand-300 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{c.subtitle}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                    Read comparison
                    <ArrowRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-light tracking-wide text-gray-900">
            shrubb
          </span>
          <nav className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link href="/compare" className="hover:text-gray-600">
              Compare
            </Link>
            <Link href="/blog" className="hover:text-gray-600">
              Blog
            </Link>
            <Link href="/login" className="hover:text-gray-600">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Shrubb. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
