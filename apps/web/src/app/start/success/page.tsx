import { ShrubbLogo } from '@/components/shrubb-logo';
import Link from 'next/link';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <ShrubbLogo />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        {/* Green checkmark */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <svg
            className="h-10 w-10 text-brand-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-gray-900">
          Purchase Confirmed!
        </h1>

        <p className="mt-4 text-lg text-gray-500">
          Your plan is active and you&apos;re ready to go. Let&apos;s design your
          dream yard.
        </p>

        {params.session_id && (
          <p className="mt-2 text-xs text-gray-400">
            Session: {params.session_id}
          </p>
        )}

        <Link
          href="/app/new-project"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Start Your Project
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>

        <p className="mt-6 text-sm text-gray-400">
          A receipt has been sent to your email.
        </p>
      </main>
    </div>
  );
}
