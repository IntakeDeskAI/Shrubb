'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import DemoModal from './demo-modal';

/**
 * Client component wrapper for the hero CTA section.
 * Replaces the server-rendered hero CTA with interactive demo modal support.
 */
function DemoCtaInner() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Primary CTA — same as original */}
      <Link
        href="/signup"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:px-12 sm:py-4 sm:text-lg"
      >
        Start free trial
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>

      {/* Demo CTA */}
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 block text-sm text-brand-300 underline underline-offset-4 transition hover:text-white"
      >
        Or call a live demo &rarr;
      </button>

      <p className="mt-2 text-sm text-gray-500">No credit card. AI number live in 60 seconds.</p>

      <DemoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

/**
 * Wrapper with Suspense boundary for useSearchParams() in DemoModal.
 */
export default function DemoCta() {
  return (
    <Suspense fallback={
      <>
        <Link
          href="/signup"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:px-12 sm:py-4 sm:text-lg"
        >
          Start free trial
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-3 text-sm text-gray-500">No credit card. AI number live in 60 seconds.</p>
      </>
    }>
      <DemoCtaInner />
    </Suspense>
  );
}

// ─── Bottom CTA variant (for Final CTA section) ───

function DemoCtaBottomInner() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Link
        href="/signup"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:text-lg"
      >
        Get your AI number now — free trial
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 block text-sm text-brand-300 underline underline-offset-4 transition hover:text-white"
      >
        Or call a live demo &rarr;
      </button>
      <p className="mt-2 text-sm text-gray-500">
        No credit card &middot; Live in 60 seconds &middot; Cancel anytime
      </p>
      <DemoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export function DemoCtaBottom() {
  return (
    <Suspense fallback={
      <>
        <Link
          href="/signup"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:text-lg"
        >
          Get your AI number now — free trial
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          No credit card &middot; Live in 60 seconds &middot; Cancel anytime
        </p>
      </>
    }>
      <DemoCtaBottomInner />
    </Suspense>
  );
}
