// ============================================================
// Tier & Add-on Configuration
// Single source of truth for pricing, entitlements, and spending caps
// ============================================================

export const TIER_CONFIG = {
  starter: {
    label: 'Starter',
    price_cents: 4900,
    chat_messages: 5,
    rerenders: 0,
    projects: 1,
    concepts: 2,
    voice_minutes: 0,
    spending_cap_cents: 800,
    features: [
      '1 project',
      '2 concepts',
      'Plant palette & shopping list',
      '5 chat messages',
    ],
  },
  standard: {
    label: 'Standard',
    price_cents: 9900,
    chat_messages: 25,
    rerenders: 1,
    projects: 1,
    concepts: 4,
    voice_minutes: 0,
    spending_cap_cents: 1800,
    features: [
      '1 project',
      '4 concepts',
      'Annotated layout',
      'PDF export',
      '25 chat messages',
      '1 rerender pass included',
    ],
  },
  premium: {
    label: 'Premium',
    price_cents: 24900,
    chat_messages: 80,
    rerenders: 2,
    projects: 2,
    concepts: 6,
    voice_minutes: 0,
    spending_cap_cents: 4500,
    features: [
      '2 projects',
      '6 concepts',
      'Install-ready pack: phased plan, irrigation notes, lighting notes',
      'PDF export',
      '80 chat messages',
      '2 rerender passes included',
    ],
  },
} as const;

export const ADDON_CONFIG = {
  chat_pack: {
    label: 'Chat Pack',
    description: '20 additional messages',
    price_cents: 1900,
    chat_messages: 20,
  },
  rerender_pack: {
    label: 'Rerender Pack',
    description: '2 additional rerenders',
    price_cents: 2900,
    rerenders: 2,
  },
  second_project: {
    label: 'Second Project',
    description: '1 additional project',
    price_cents: 4900,
    projects: 1,
  },
  voice_pack_15: {
    label: 'Voice Pack (15 min)',
    description: '15 minutes of AI voice calls',
    price_cents: 2900,
    voice_minutes: 15,
  },
  voice_pack_40: {
    label: 'Voice Pack (40 min)',
    description: '40 minutes of AI voice calls',
    price_cents: 5900,
    voice_minutes: 40,
  },
} as const;

export type TierName = keyof typeof TIER_CONFIG;
export type AddonName = keyof typeof ADDON_CONFIG;

/** Structured planner output schema */
export interface PlannerJson {
  beds: Array<{
    name: string;
    shape: string;
    polygon?: Array<{ x: number; y: number }>;
    plants: Array<{
      common_name: string;
      botanical_name: string;
      quantity_estimate: number;
      spacing_inches: number;
      zone_ok: boolean;
      sun_ok: boolean;
      water_ok: boolean;
      notes?: string;
    }>;
  }>;
  plant_palette: Array<{
    common_name: string;
    botanical_name: string;
    quantity_estimate: number;
    spacing_inches: string;
    zone_range: string;
    sun: string;
    water: string;
    pet_safe?: boolean;
    notes?: string;
  }>;
  hardscape: Array<{
    element: string;
    material: string;
    area_sqft?: number;
    notes?: string;
  }>;
  materials: Array<{
    name: string;
    quantity: string;
    estimated_cost: string;
  }>;
  maintenance_notes: string[];
  assumptions: string[];
  disclaimers: string[];
  questions_for_user?: string[];
  style: string;
  estimated_budget: string;
}

/** Project preferences collected during wizard */
export interface ProjectPreferences {
  style?: string;
  budget?: string;
  maintenance_level?: string;
  watering?: string;
  sun_exposure?: string;
  pets?: boolean;
  kids_play_area?: boolean;
  hardscape_level?: string;
  notes?: string;
}

/** Comparison table feature for pricing display */
export interface PricingFeature {
  label: string;
  starter: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

export const PRICING_COMPARISON: PricingFeature[] = [
  { label: 'Projects', starter: '1', standard: '1', premium: '2' },
  { label: 'Concepts', starter: '2', standard: '4', premium: '6' },
  { label: 'Chat iterations', starter: '5', standard: '25', premium: '80' },
  { label: 'Plant palette & shopping list', starter: true, standard: true, premium: true },
  { label: 'Annotated layout', starter: false, standard: true, premium: true },
  { label: 'PDF export', starter: false, standard: true, premium: true },
  { label: 'Rerender passes', starter: '0', standard: '1', premium: '2' },
  { label: 'Install-ready pack', starter: false, standard: false, premium: true },
  { label: 'Phased plan', starter: false, standard: false, premium: true },
  { label: 'Irrigation & lighting notes', starter: false, standard: false, premium: true },
];
