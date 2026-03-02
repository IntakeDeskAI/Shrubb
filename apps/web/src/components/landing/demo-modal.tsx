'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'form' | 'submitting' | 'success' | 'error';

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ModalState>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoNumber, setDemoNumber] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setState('form');
      setErrorMsg('');
      setCopied(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          company_name: companyName,
          phone,
          email: email || undefined,
          company_website: honeypot, // honeypot
          utm_source: searchParams.get('utm_source') || undefined,
          utm_campaign: searchParams.get('utm_campaign') || undefined,
          utm_medium: searchParams.get('utm_medium') || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setState('error');
        return;
      }

      setDemoNumber(data.demo_number || '(208) 600-1285');
      setSmsSent(data.sms_sent || false);
      setState('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText('(208) 600-1285');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {state === 'success' ? (
          /* ─── Success state ─── */
          <div className="p-6 text-center sm:p-8">
            {/* Checkmark */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <svg className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">Your demo is ready</h2>
            <p className="mt-1 text-sm text-gray-500">Call this number to test Shrubb AI</p>

            {/* Big phone number */}
            <div className="mt-6 rounded-xl border-2 border-brand-100 bg-brand-50 px-6 py-4">
              <p className="text-2xl font-extrabold tracking-wide text-brand-700 sm:text-3xl">
                {demoNumber || '(208) 600-1285'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={copyNumber}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy number
                  </>
                )}
              </button>
              <a
                href="tel:+12086001285"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Call now
              </a>
            </div>

            {smsSent && (
              <p className="mt-4 text-xs text-gray-400">
                We texted the details to your phone.
              </p>
            )}

            <p className="mt-3 text-xs text-gray-400">
              Please don&apos;t share this number publicly.
            </p>

            <a
              href="/signup"
              className="mt-5 inline-block text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Start your free trial &rarr;
            </a>
          </div>
        ) : (
          /* ─── Form state ─── */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">Test Shrubb in 60 seconds</h2>
            <p className="mt-1 text-sm text-gray-500">
              For landscaping companies only. Get the demo number instantly.
            </p>

            {(state === 'error') && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="demo_first_name" className="block text-sm font-medium text-gray-700">
                  First name *
                </label>
                <input
                  ref={firstInputRef}
                  id="demo_first_name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="Mike"
                />
              </div>

              <div>
                <label htmlFor="demo_company" className="block text-sm font-medium text-gray-700">
                  Company name *
                </label>
                <input
                  id="demo_company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="Greenscape Landscaping"
                />
              </div>

              <div>
                <label htmlFor="demo_phone" className="block text-sm font-medium text-gray-700">
                  Phone number *
                </label>
                <input
                  id="demo_phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="(208) 555-0123"
                />
              </div>

              <div>
                <label htmlFor="demo_email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="demo_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  placeholder="mike@greenscape.com"
                />
              </div>

              {/* Honeypot — hidden from real users */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <label htmlFor="demo_website">Website</label>
                <input
                  id="demo_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              {state === 'submitting' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up...
                </>
              ) : (
                'Get demo number'
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              We&apos;ll text you the demo details. No spam, ever.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
