// ============================================================
// B2B Plan & Add-on Configuration
// Single source of truth for pricing, entitlements, and spending caps
// ============================================================

export const B2B_PLANS = {
  trial: {
    label: 'Trial', price_cents: 0, interval: null as null, trial_days: 7,
    seats: 3, proposals_per_month: 3, chat_messages: 15, renders: 6,
    spending_cap_cents: 1000,
    features: ['3 proposals', '6 renders', '7 day trial', 'No overages'],
  },
  starter: {
    label: 'Starter', price_cents: 19900, interval: 'month' as const,
    seats: 3, proposals_per_month: 15, chat_messages: 30, renders: 10,
    spending_cap_cents: 3000,
    features: ['3 users', '15 proposals/mo', '30 chat messages/mo', '10 renders/mo', '1 proposal template', 'Email send + tracking'],
  },
  pro: {
    label: 'Pro', price_cents: 39900, interval: 'month' as const,
    seats: 8, proposals_per_month: 50, chat_messages: 120, renders: 40,
    spending_cap_cents: 8000,
    features: ['8 users', '50 proposals/mo', '120 chat messages/mo', '40 renders/mo', 'Brand kit + templates', 'Client records + follow-ups', 'Priority render queue'],
  },
  growth: {
    label: 'Growth', price_cents: 69900, interval: 'month' as const,
    seats: 15, proposals_per_month: 120, chat_messages: 300, renders: 100,
    spending_cap_cents: 20000,
    features: ['15 users', '120 proposals/mo', '300 chat messages/mo', '100 renders/mo', 'Multi-location', 'Team roles + approvals', 'API access roadmap'],
  },
} as const;

export type B2BPlanName = keyof typeof B2B_PLANS;

export const B2B_ADDONS = {
  proposal_pack: { label: 'Proposal Pack', description: '20 additional proposals', price_cents: 7900, proposals: 20 },
  render_pack: { label: 'Render Pack', description: '25 additional renders', price_cents: 5900, renders: 25 },
  chat_pack: { label: 'Chat Pack', description: '200 additional messages', price_cents: 3900, chat_messages: 200 },
  voice_pack: { label: 'Voice Pack', description: '60 minutes of AI voice calls', price_cents: 9900, voice_minutes: 60 },
  extra_seat: { label: 'Extra Seat', description: '1 additional user/month', price_cents: 1900, seats: 1 },
} as const;

export type B2BAddonName = keyof typeof B2B_ADDONS;

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

/** B2B comparison table feature for pricing display */
export interface B2BPricingFeature {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  growth: string | boolean;
}

export const B2B_PRICING_COMPARISON: B2BPricingFeature[] = [
  { label: 'Users', starter: '3', pro: '8', growth: '15' },
  { label: 'Proposals/month', starter: '15', pro: '50', growth: '120' },
  { label: 'Chat messages/month', starter: '30', pro: '120', growth: '300' },
  { label: 'Renders/month', starter: '10', pro: '40', growth: '100' },
  { label: 'Proposal templates', starter: '1', pro: '5', growth: 'Unlimited' },
  { label: 'Brand kit', starter: false, pro: true, growth: true },
  { label: 'Client records', starter: false, pro: true, growth: true },
  { label: 'Priority queue', starter: false, pro: true, growth: true },
  { label: 'Multi-location', starter: false, pro: false, growth: true },
  { label: 'Team roles', starter: false, pro: false, growth: true },
];
