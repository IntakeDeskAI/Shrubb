'use client';

import { useState, useTransition } from 'react';

export function SendProposalButton({
  proposalId,
  hasClientEmail,
}: {
  proposalId: string;
  hasClientEmail: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent?: boolean; error?: string } | null>(null);

  function handleSend() {
    if (!hasClientEmail) {
      setResult({ error: 'Client has no email address. Add an email first.' });
      return;
    }

    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/proposals/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal_id: proposalId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setResult({ error: data.error ?? 'Failed to send' });
        } else {
          setResult({ sent: true });
          // Refresh the page to show updated status
          window.location.reload();
        }
      } catch {
        setResult({ error: 'Network error. Please try again.' });
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? (
          'Sending...'
        ) : (
          <>
            Send to Client
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </>
        )}
      </button>
      {result?.error && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}
    </div>
  );
}
