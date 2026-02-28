'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GenerateButtonProps {
  areaId: string;
  hasPhotos: boolean;
  hasActiveJob: boolean;
}

export function GenerateButton({ areaId, hasPhotos, hasActiveJob }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      // Step 1: Create generate_brief job
      const briefRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_brief',
          payload: { area_id: areaId },
        }),
      });

      if (!briefRes.ok) {
        const err = await briefRes.json();
        throw new Error(err.error || 'Failed to create job');
      }

      // Step 2: Create generate_concepts job (will wait for brief)
      const conceptsRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_concepts',
          payload: { area_id: areaId },
        }),
      });

      if (!conceptsRes.ok) {
        const err = await conceptsRes.json();
        throw new Error(err.error || 'Failed to create job');
      }

      router.refresh();
    } catch (err) {
      console.error('Generate error:', err);
      alert('Failed to start generation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (hasActiveJob) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">Generation in progress. Refresh to check status.</p>
        <button
          onClick={() => router.refresh()}
          className="mt-2 text-sm font-medium text-yellow-700 underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={!hasPhotos || loading}
      className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Starting...' : 'Generate Concepts'}
    </button>
  );
}
