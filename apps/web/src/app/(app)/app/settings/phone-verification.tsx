'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'enter_phone' | 'verify_code' | 'verified';

interface PhoneVerificationProps {
  currentPhone: string | null;
  isVerified: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhoneVerification({
  currentPhone,
  isVerified,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>(
    isVerified && currentPhone ? 'verified' : 'enter_phone'
  );
  const [phone, setPhone] = useState(currentPhone ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Send verification code ----
  async function handleSendCode() {
    setError(null);

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to send verification code.');
      }

      setStep('verify_code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Verify code ----
  async function handleVerifyCode() {
    setError(null);

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const res = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Verification failed.');
      }

      setStep('verified');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Change number ----
  function handleChangeNumber() {
    setStep('enter_phone');
    setCode('');
    setError(null);
  }

  // ---- Render ----
  return (
    <div className="space-y-3">
      {/* Step 1: Enter phone number */}
      {step === 'enter_phone' && (
        <>
          <div>
            <label
              htmlFor="phone_verify"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              id="phone_verify"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </>
      )}

      {/* Step 2: Enter 6-digit code */}
      {step === 'verify_code' && (
        <>
          <p className="text-sm text-gray-600">
            We sent a verification code to{' '}
            <span className="font-medium text-gray-900">{phone}</span>.
          </p>

          <div>
            <label
              htmlFor="verify_code"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <input
              id="verify_code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              className="mt-1 block w-40 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-mono tracking-widest text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={loading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={handleChangeNumber}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Change number
            </button>
          </div>
        </>
      )}

      {/* Step 3: Verified */}
      {step === 'verified' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-900">{phone}</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Verified
            </span>
          </div>
          <button
            type="button"
            onClick={handleChangeNumber}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Change Number
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
