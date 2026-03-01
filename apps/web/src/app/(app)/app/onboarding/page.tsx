'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShrubbLogo } from '@/components/shrubb-logo';
import { AddressAutocomplete } from '@/components/address-autocomplete';

// ---------------------------------------------------------------------------
// Step 1: Company creation
// ---------------------------------------------------------------------------

function StepCompany({
  onComplete,
}: {
  onComplete: (companyId: string) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_company',
          company_name: form.get('company_name'),
          full_name: form.get('full_name'),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      if (data.companyId) {
        onComplete(data.companyId);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Set up your company
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          This is how your company will appear to clients on proposals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700"
          >
            Your Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="John Doe"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-gray-700"
          >
            Company Name
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            required
            placeholder="Green Valley Landscapes"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? 'Creating...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Trial confirmation
// ---------------------------------------------------------------------------

function StepTrial({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <svg
          className="h-8 w-8 text-brand-500"
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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Your 7-day trial is active
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You get 3 proposals, 6 renders, and 15 chat messages to try
          everything. No credit card required.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
        <h3 className="text-sm font-semibold text-gray-700">
          What&apos;s included in your trial:
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {[
            '3 AI-powered proposals',
            '6 photorealistic renders',
            '15 chat refinement messages',
            'PDF export with plant lists',
            'Hosted proposal pages for clients',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-brand-500"
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
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        Add Your First Client
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: First client (optional)
// ---------------------------------------------------------------------------

function StepClient({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = new FormData(e.currentTarget);
    const clientName = (form.get('client_name') as string)?.trim();

    if (!clientName) {
      router.push('/app');
      return;
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_client',
          company_id: companyId,
          client_name: clientName,
          client_email: form.get('client_email'),
          client_address: form.get('client_address'),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      router.push('/app');
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsPending(false);
    }
  }

  function handleSkip() {
    router.push('/app');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Add your first client
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Got a lead or existing client? Add them now, or skip and add
          clients later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="client_name"
            className="block text-sm font-medium text-gray-700"
          >
            Client Name
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            placeholder="Jane Smith"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="client_email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            placeholder="jane@example.com"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="client_address"
            className="block text-sm font-medium text-gray-700"
          >
            Property Address
          </label>
          <AddressAutocomplete
            id="client_address"
            name="client_address"
            placeholder="123 Oak Street, Austin, TX"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Add Client & Go to Dashboard'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
      >
        Skip — I&apos;ll add clients later
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  const steps = ['Company', 'Trial', 'First Client'];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i < current
                ? 'bg-brand-500 text-white'
                : i === current
                  ? 'border-2 border-brand-500 text-brand-600'
                  : 'border border-gray-300 text-gray-400'
            }`}
          >
            {i < current ? (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`hidden text-xs sm:inline ${
              i === current
                ? 'font-semibold text-gray-900'
                : 'text-gray-400'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                i < current ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main onboarding page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      <div className="mb-8">
        <ShrubbLogo size="default" color="green" />
      </div>

      <div className="mb-8">
        <StepIndicator current={step} />
      </div>

      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {step === 0 && (
          <StepCompany
            onComplete={(id) => {
              setCompanyId(id);
              setStep(1);
            }}
          />
        )}
        {step === 1 && <StepTrial onContinue={() => setStep(2)} />}
        {step === 2 && companyId && <StepClient companyId={companyId} />}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        You can always update these settings later.
      </p>
    </div>
  );
}
