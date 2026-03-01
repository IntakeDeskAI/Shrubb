import { type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Cost constants per model / output type
// ---------------------------------------------------------------------------
export const COST_PER_1K_INPUT_GPT4O = 0.005;
export const COST_PER_1K_OUTPUT_GPT4O = 0.015;
export const COST_PER_1K_INPUT_GPT4O_MINI = 0.00015;
export const COST_PER_1K_OUTPUT_GPT4O_MINI = 0.0006;
export const COST_PER_IMAGE_DALLE3_STANDARD = 0.04;
export const COST_PER_IMAGE_DALLE3_HD = 0.08;

// ---------------------------------------------------------------------------
// Cost estimation helper
// ---------------------------------------------------------------------------
export function estimateCost(
  tokensIn: number,
  tokensOut: number,
  model: string,
  imageCount: number = 0,
): number {
  let cost = 0;

  if (model.includes('gpt-4o-mini')) {
    cost += (tokensIn / 1000) * COST_PER_1K_INPUT_GPT4O_MINI;
    cost += (tokensOut / 1000) * COST_PER_1K_OUTPUT_GPT4O_MINI;
  } else if (model.includes('gpt-4o')) {
    cost += (tokensIn / 1000) * COST_PER_1K_INPUT_GPT4O;
    cost += (tokensOut / 1000) * COST_PER_1K_OUTPUT_GPT4O;
  }

  if (model.includes('dall-e-3')) {
    // Default to standard pricing; callers can override if HD
    cost += imageCount * COST_PER_IMAGE_DALLE3_STANDARD;
  }

  return Math.round(cost * 1_000_000) / 1_000_000; // avoid floating-point dust
}

// ---------------------------------------------------------------------------
// Usage entry shape
// ---------------------------------------------------------------------------
export interface UsageEntry {
  user_id: string;
  company_id: string;
  project_id?: string;
  message_id?: string;
  run_type: string; // 'planner' | 'render' | 'classify' | 'pdf' | 'chat' | 'satellite'
  tokens_in: number;
  tokens_out: number;
  image_count: number;
  estimated_cost_usd: number;
  provider: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Persist a usage row to the usage_ledger table
// ---------------------------------------------------------------------------
export async function trackUsage(
  supabase: SupabaseClient,
  entry: UsageEntry,
): Promise<void> {
  const { error } = await supabase.from('usage_ledger').insert({
    user_id: entry.user_id,
    company_id: entry.company_id,
    project_id: entry.project_id ?? null,
    message_id: entry.message_id ?? null,
    run_type: entry.run_type,
    tokens_in: entry.tokens_in,
    tokens_out: entry.tokens_out,
    image_count: entry.image_count,
    estimated_cost_usd: entry.estimated_cost_usd,
    provider: entry.provider,
    model: entry.model,
  });

  if (error) {
    console.error('Failed to track usage:', error.message);
  }
}
