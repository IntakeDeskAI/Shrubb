'use client';

import { AddressAutocomplete } from '@/components/address-autocomplete';

interface CompanyAddressFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultAddress: string;
}

export function CompanyAddressForm({ action, defaultAddress }: CompanyAddressFormProps) {
  return (
    <form action={action} className="mt-3 space-y-3">
      <AddressAutocomplete
        name="company_address"
        defaultValue={defaultAddress}
        enforceVerified
        placeholder="Business address (verified)"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Save Address
        </button>
      </div>
    </form>
  );
}
