'use client';

import { useState } from 'react';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { SubmitButton } from './submit-button';

interface SignupFormProps {
  signup: (formData: FormData) => Promise<void>;
  errorMessage?: string;
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

// Inline eye / eye-slash SVGs (Heroicons outline)
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export function SignupForm({ signup, errorMessage }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string;
    const confirm = formData.get('password_confirm') as string;

    if (password !== confirm) {
      setMismatch(true);
      return;
    }

    setMismatch(false);
    // Remove confirm field before sending to server action
    formData.delete('password_confirm');
    return signup(formData);
  }

  return (
    <>
      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {mismatch && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Passwords do not match.
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {/* ── Personal info ── */}
        <div>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="Full Name"
            className={inputClass}
          />
        </div>
        <div>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Email"
            className={inputClass}
          />
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            placeholder="Password (min 8 characters)"
            className={inputClass + ' pr-10'}
            onChange={() => mismatch && setMismatch(false)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="relative">
          <input
            id="password_confirm"
            name="password_confirm"
            type={showConfirm ? 'text' : 'password'}
            required
            minLength={8}
            placeholder="Confirm Password"
            className={inputClass + ' pr-10'}
            onChange={() => mismatch && setMismatch(false)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* ── Business info ── */}
        <p className="pt-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          Business Details
        </p>
        <div>
          <input
            id="company_name"
            name="company_name"
            type="text"
            required
            placeholder="Business Name"
            className={inputClass}
          />
        </div>
        <div>
          <AddressAutocomplete
            id="company_address"
            name="company_address"
            placeholder="Business Address"
            enforceVerified
            required
            className={inputClass}
          />
        </div>

        <SubmitButton>Create Account</SubmitButton>
      </form>
    </>
  );
}
