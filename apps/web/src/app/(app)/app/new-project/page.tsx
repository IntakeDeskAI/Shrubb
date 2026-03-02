'use client';

import { useState, useRef, useTransition } from 'react';
import { createProject } from './actions';
import { AddressAutocomplete, type PlaceData } from '@/components/address-autocomplete';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InputMethod = 'photo' | 'address';

interface WizardData {
  // Step 1
  inputMethod: InputMethod | null;
  photo: File | null;
  photoPreview: string | null;
  address: string;
  addressPlaceId: string | null;
  addressFormatted: string | null;
  addressLat: number | null;
  addressLng: number | null;
  // Step 2
  style: string;
  budget: string;
  maintenance: string;
  watering: string;
  sunExposure: string;
  hasPets: boolean;
  needsPlayArea: boolean;
  hardscape: string;
  notes: string;
}

const INITIAL_DATA: WizardData = {
  inputMethod: null,
  photo: null,
  photoPreview: null,
  address: '',
  addressPlaceId: null,
  addressFormatted: null,
  addressLat: null,
  addressLng: null,
  style: 'Modern',
  budget: '$1K-$5K',
  maintenance: 'Medium',
  watering: 'Moderate',
  sunExposure: 'Full sun',
  hasPets: false,
  needsPlayArea: false,
  hardscape: 'Moderate',
  notes: '',
};

// ---------------------------------------------------------------------------
// Option constants
// ---------------------------------------------------------------------------

const STYLE_OPTIONS = [
  'Modern',
  'Cottage',
  'Mediterranean',
  'Japanese',
  'Tropical',
  'Desert',
  'Native',
  'Woodland',
];

const BUDGET_OPTIONS = [
  'Under $1K',
  '$1K-$5K',
  '$5K-$15K',
  '$15K-$50K',
  '$50K+',
];

const MAINTENANCE_OPTIONS = ['Low', 'Medium', 'High'];

const WATERING_OPTIONS = [
  'Drought-tolerant',
  'Low water',
  'Moderate',
  'Regular irrigation',
];

const SUN_OPTIONS = ['Full sun', 'Partial shade', 'Full shade', 'Mixed'];

const HARDSCAPE_OPTIONS = ['Minimal', 'Moderate', 'Extensive'];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { num: 1, label: 'Input' },
    { num: 2, label: 'Preferences' },
    { num: 3, label: 'Review' },
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step.num < current
                    ? 'bg-brand-500 text-white'
                    : step.num === current
                      ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.num < current ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  step.num === current ? 'text-brand-700' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-px w-10 sm:w-16 ${
                  step.num < current ? 'bg-brand-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-gray-500">
        Step {current} of 3
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select field component
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Handlers ---------------------------------------------------------------

  function updateData(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old preview URL to prevent memory leaks
    if (data.photoPreview) {
      URL.revokeObjectURL(data.photoPreview);
    }

    updateData({
      photo: file,
      photoPreview: URL.createObjectURL(file),
      inputMethod: 'photo',
    });
  }

  function canAdvanceStep1(): boolean {
    if (data.inputMethod === 'photo') return !!data.photo;
    if (data.inputMethod === 'address') return !!data.addressPlaceId;
    return false;
  }

  function handleGenerate() {
    setError(null);

    const fd = new FormData();
    fd.set('inputType', data.inputMethod!);
    if (data.inputMethod === 'photo' && data.photo) {
      fd.set('photo', data.photo);
    }
    if (data.inputMethod === 'address') {
      fd.set('address', data.addressFormatted ?? data.address);
      fd.set('address_place_id', data.addressPlaceId ?? '');
      fd.set('address_lat', data.addressLat?.toString() ?? '');
      fd.set('address_lng', data.addressLng?.toString() ?? '');
    }
    fd.set('style', data.style);
    fd.set('budget', data.budget);
    fd.set('maintenance', data.maintenance);
    fd.set('watering', data.watering);
    fd.set('sunExposure', data.sunExposure);
    fd.set('hasPets', String(data.hasPets));
    fd.set('needsPlayArea', String(data.needsPlayArea));
    fd.set('hardscape', data.hardscape);
    fd.set('notes', data.notes);

    startTransition(async () => {
      try {
        await createProject(fd);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
      }
    });
  }

  // -- Step renderers ---------------------------------------------------------

  function renderStep1() {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          How would you like to start?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload a photo of your yard or enter your address so we can pull a
          satellite view.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Upload photo card */}
          <button
            type="button"
            onClick={() => {
              updateData({ inputMethod: 'photo' });
              // If no photo yet, trigger file picker
              if (!data.photo) {
                fileInputRef.current?.click();
              }
            }}
            className={`group rounded-xl border-2 p-6 text-left transition ${
              data.inputMethod === 'photo'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">
              Upload a photo
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Take or upload a photo of your yard for the most accurate design.
            </p>
          </button>

          {/* Enter address card */}
          <button
            type="button"
            onClick={() => updateData({ inputMethod: 'address' })}
            className={`group rounded-xl border-2 p-6 text-left transition ${
              data.inputMethod === 'address'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">
              Enter your address
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll use satellite imagery to get a view of your property.
            </p>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Photo preview */}
        {data.inputMethod === 'photo' && data.photoPreview && (
          <div className="mt-6">
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photoPreview}
                alt="Yard photo preview"
                className="h-48 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/30 to-transparent p-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {data.photo?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-brand-600 hover:bg-white"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo selected but no preview yet - trigger file picker */}
        {data.inputMethod === 'photo' && !data.photoPreview && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-sm text-gray-500 transition hover:border-brand-400 hover:text-brand-600"
            >
              Click to select a photo
            </button>
          </div>
        )}

        {/* Address input */}
        {data.inputMethod === 'address' && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Street address
            </label>
            <AddressAutocomplete
              value={data.address}
              onChange={(address) => updateData({ address })}
              onPlaceSelect={(place: PlaceData) =>
                updateData({
                  address: place.formattedAddress,
                  addressPlaceId: place.placeId,
                  addressFormatted: place.formattedAddress,
                  addressLat: place.lat,
                  addressLng: place.lng,
                })
              }
              enforceVerified
              placeholder="123 Main St, City, State"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        )}

        {/* Next button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={!canAdvanceStep1()}
            onClick={() => setStep(2)}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Design preferences
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your ideal yard so our AI can create the perfect plan.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Style"
            value={data.style}
            onChange={(v) => updateData({ style: v })}
            options={STYLE_OPTIONS}
          />
          <SelectField
            label="Budget"
            value={data.budget}
            onChange={(v) => updateData({ budget: v })}
            options={BUDGET_OPTIONS}
          />
          <SelectField
            label="Maintenance level"
            value={data.maintenance}
            onChange={(v) => updateData({ maintenance: v })}
            options={MAINTENANCE_OPTIONS}
          />
          <SelectField
            label="Watering preference"
            value={data.watering}
            onChange={(v) => updateData({ watering: v })}
            options={WATERING_OPTIONS}
          />
          <SelectField
            label="Sun exposure"
            value={data.sunExposure}
            onChange={(v) => updateData({ sunExposure: v })}
            options={SUN_OPTIONS}
          />
          <SelectField
            label="Hardscape level"
            value={data.hardscape}
            onChange={(v) => updateData({ hardscape: v })}
            options={HARDSCAPE_OPTIONS}
          />
        </div>

        {/* Checkboxes */}
        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data.hasPets}
              onChange={(e) => updateData({ hasPets: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">
              Yes, my yard has pets
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data.needsPlayArea}
              onChange={(e) => updateData({ needsPlayArea: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">
              Yes, I need a kids play area
            </span>
          </label>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Additional notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            rows={3}
            placeholder="Anything else you'd like us to know — favorite plants, specific features, etc."
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    const summaryItems: { label: string; value: string }[] = [
      {
        label: 'Input',
        value:
          data.inputMethod === 'photo'
            ? `Photo: ${data.photo?.name ?? 'uploaded'}`
            : `Address: ${data.address}`,
      },
      { label: 'Style', value: data.style },
      { label: 'Budget', value: data.budget },
      { label: 'Maintenance', value: data.maintenance },
      { label: 'Watering', value: data.watering },
      { label: 'Sun exposure', value: data.sunExposure },
      { label: 'Pets', value: data.hasPets ? 'Yes' : 'No' },
      { label: 'Kids play area', value: data.needsPlayArea ? 'Yes' : 'No' },
      { label: 'Hardscape', value: data.hardscape },
    ];

    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Review your project
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Confirm your selections before we generate your personalized yard
          plan.
        </p>

        {/* Photo preview in review */}
        {data.inputMethod === 'photo' && data.photoPreview && (
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photoPreview}
              alt="Yard photo"
              className="h-40 w-full object-cover"
            />
          </div>
        )}

        {/* Summary grid */}
        <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {data.notes.trim() && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <span className="text-sm text-gray-500">Notes</span>
            <p className="mt-1 text-sm text-gray-900">{data.notes}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={isPending}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isPending ? 'Generating...' : 'Generate My Plan'}
          </button>
        </div>
      </div>
    );
  }

  // -- Render -----------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl py-4">
      <StepIndicator current={step} />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
