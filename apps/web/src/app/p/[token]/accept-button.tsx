'use client';

import { useState, useTransition } from 'react';

export function AcceptProposalButton({
  proposalId,
  token,
}: {
  proposalId: string;
  token: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/proposals/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal_id: proposalId, token }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Something went wrong');
          return;
        }

        setAccepted(true);
        // Refresh to show accepted state
        window.location.reload();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  if (accepted) {
    return (
      <p className="text-lg font-semibold text-green-600">
        Proposal accepted! The team will be in touch.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? 'Accepting...' : 'Accept This Proposal'}
        {!isPending && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
