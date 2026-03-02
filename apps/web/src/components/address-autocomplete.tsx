'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaceData {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressAutocompleteProps {
  /** Form field name — populates hidden <input>s for FormData / server actions */
  name?: string;
  id?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Controlled mode: current value */
  value?: string;
  className?: string;
  required?: boolean;
  /** When true, user MUST select from Google Places dropdown. Blocks save otherwise. */
  enforceVerified?: boolean;
  /** Called with the formatted address on selection (and on every keystroke in controlled mode) */
  onChange?: (address: string) => void;
  /** Called with structured place data when a suggestion is selected */
  onPlaceSelect?: (place: PlaceData) => void;
}

// ---------------------------------------------------------------------------
// Lazy-load Google Places SDK (singleton)
// ---------------------------------------------------------------------------

let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;
let optionsSet = false;

function loadPlaces(): Promise<google.maps.PlacesLibrary> | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  if (!optionsSet) {
    setOptions({ key, v: 'weekly' });
    optionsSet = true;
  }

  if (!placesPromise) {
    placesPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  }
  return placesPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddressAutocomplete({
  name,
  id,
  placeholder = 'Start typing an address…',
  defaultValue = '',
  value: controlledValue,
  className,
  required,
  enforceVerified = false,
  onChange,
  onPlaceSelect,
}: AddressAutocompleteProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const displayValue = isControlled ? controlledValue : internalValue;

  // The "committed" address for the hidden input (set on selection, or equals displayValue)
  const [committedAddress, setCommittedAddress] = useState(defaultValue);

  // Structured place data — set when user selects from dropdown, cleared on manual edit
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [verified, setVerified] = useState(false);
  const [touched, setTouched] = useState(false);

  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasPlaces, setHasPlaces] = useState(false);

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const placeIdInputRef = useRef<HTMLInputElement>(null);

  // Should we enforce verification?
  const shouldEnforce = enforceVerified && hasPlaces;
  const showError = shouldEnforce && touched && !verified && displayValue.length > 0;

  // Initialize Places service
  useEffect(() => {
    const promise = loadPlaces();
    if (!promise) return; // No API key — plain input fallback

    promise
      .then((lib) => {
        serviceRef.current = new lib.AutocompleteService();
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setHasPlaces(true);
      })
      .catch(() => {
        // SDK failed to load — fall back to plain input
      });
  }, []);

  // Update custom validity for form enforcement
  useEffect(() => {
    if (placeIdInputRef.current && shouldEnforce) {
      if (!verified && displayValue.length > 0) {
        placeIdInputRef.current.setCustomValidity('Select a verified address from the suggestions');
      } else {
        placeIdInputRef.current.setCustomValidity('');
      }
    }
  }, [verified, displayValue, shouldEnforce]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (shouldEnforce && displayValue.length > 0 && !verified) {
          setTouched(true);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shouldEnforce, displayValue, verified]);

  // Fetch predictions (debounced)
  const fetchPredictions = useCallback(
    (input: string) => {
      clearTimeout(debounceRef.current);

      if (input.length < 3 || !serviceRef.current || !hasPlaces) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        serviceRef.current!.getPlacePredictions(
          {
            input,
            sessionToken: sessionTokenRef.current!,
            types: ['address'],
            componentRestrictions: { country: 'us' },
          },
          (results, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              setPredictions(results);
              setIsOpen(true);
            } else {
              setPredictions([]);
              setIsOpen(false);
            }
          },
        );
      }, 300);
    },
    [hasPlaces],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!isControlled) {
      setInternalValue(val);
      setCommittedAddress(val);
    }
    onChange?.(val);
    fetchPredictions(val);
    setActiveIndex(-1);

    // Reset verification on manual edit
    if (verified) {
      setPlaceData(null);
      setVerified(false);
    }
    if (val.length === 0) {
      setTouched(false);
    }
  }

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    const address = prediction.description;

    if (!isControlled) setInternalValue(address);
    setCommittedAddress(address);
    setPredictions([]);
    setIsOpen(false);
    onChange?.(address);

    // Always fetch place details for structured data
    const placesService = new google.maps.places.PlacesService(
      document.createElement('div'),
    );
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'place_id'],
        sessionToken: sessionTokenRef.current!,
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place
        ) {
          const data: PlaceData = {
            formattedAddress: place.formatted_address ?? address,
            lat: place.geometry?.location?.lat() ?? 0,
            lng: place.geometry?.location?.lng() ?? 0,
            placeId: place.place_id ?? prediction.place_id,
          };
          setPlaceData(data);
          setVerified(true);
          setTouched(false);

          // Update committed address with the formatted version
          if (!isControlled) setInternalValue(data.formattedAddress);
          setCommittedAddress(data.formattedAddress);
          onChange?.(data.formattedAddress);

          onPlaceSelect?.(data);
        }
      },
    );

    // Refresh session token
    const promise = loadPlaces();
    if (promise) {
      promise.then((lib) => {
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleBlur() {
    if (shouldEnforce && displayValue.length > 0 && !verified) {
      setTouched(true);
    }
  }

  const inputClasses =
    className ??
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden inputs for FormData (server actions / manual form reads) */}
      {name && (
        <>
          <input type="hidden" name={name} value={committedAddress} />
          <input
            ref={placeIdInputRef}
            type="hidden"
            name={`${name}_place_id`}
            value={placeData?.placeId ?? ''}
            required={shouldEnforce && required}
          />
          <input type="hidden" name={`${name}_formatted`} value={placeData?.formattedAddress ?? ''} />
          <input type="hidden" name={`${name}_lat`} value={placeData?.lat?.toString() ?? ''} />
          <input type="hidden" name={`${name}_lng`} value={placeData?.lng?.toString() ?? ''} />
        </>
      )}

      {/* Visible autocomplete input */}
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => predictions.length > 0 && setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={showError || undefined}
        className={`${inputClasses}${showError ? ' !border-red-400 !ring-red-100' : ''}`}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
        }
      />

      {/* Validation message */}
      {showError && (
        <p className="mt-1 text-xs text-red-600">
          Select a verified address from the suggestions
        </p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && predictions.length > 0 && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-3 py-2.5 text-sm ${
                i === activeIndex
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
              onMouseDown={() => handleSelect(p)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="font-medium">
                {p.structured_formatting.main_text}
              </span>
              <span className="ml-1 text-gray-500">
                {p.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
