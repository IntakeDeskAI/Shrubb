'use client';

import { useState } from 'react';

interface BillingActionsProps {
  currentPlan: string;
}

export function BillingActions({ currentPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to create checkout session');

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (currentPlan === 'pro') {
    return <span className="text-sm font-medium text-brand-600">Current plan</span>;
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? 'Redirecting...' : 'Upgrade to Pro'}
    </button>
  );
}
