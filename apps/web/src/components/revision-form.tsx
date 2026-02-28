'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RevisionFormProps {
  conceptId: string;
}

export function RevisionForm({ conceptId }: RevisionFormProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'revise_concept',
          payload: {
            concept_id: conceptId,
            revision_prompt: prompt,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create revision job');
      }

      setPrompt('');
      router.refresh();
    } catch (err) {
      console.error('Revision error:', err);
      alert('Failed to start revision. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you'd like changed... e.g., 'More native plants, less hardscape, add a water feature'"
        rows={3}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={!prompt.trim() || loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Revision'}
      </button>
    </form>
  );
}
