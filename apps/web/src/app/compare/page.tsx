import Link from "next/link";
import type { Metadata } from "next";
import { ShrubbLogo } from "@/components/shrubb-logo";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { getAllComparisons } from "@/data/comparisons";

export const metadata: Metadata = {
  title: "How Shrubb Compares | Shrubb",
  description:
    "See how Shrubb stacks up against other tools landscapers use for proposals, designs, and client management.",
};

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

export default function ComparePage() {
  const comparisons = getAllComparisons();

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
            <Link href="/compare" className="font-medium text-gray-900">
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
            { label: "Compare" },
          ]}
        />
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-8 pb-16">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            How Shrubb Compares
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            See how Shrubb stacks up against other tools landscapers use.
          </p>
        </div>
      </section>

      {/* ═══════════ COMPARISON CARDS ═══════════ */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-lg"
            >
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-brand-600">
                {c.competitor}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                {c.competitorDescription}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <span className="text-sm font-semibold text-brand-600">
                  See full comparison
                </span>
                <ArrowRightIcon />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-50 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to see the difference?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Try Shrubb free and send your first AI-powered proposal in minutes.
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
