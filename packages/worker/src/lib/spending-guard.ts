import { type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Check whether the company can afford the estimated cost
// Returns true if spending is within cap, false if it would exceed.
// ---------------------------------------------------------------------------
export async function checkSpendingCap(
  supabase: SupabaseClient,
  companyId: string,
  estimatedCostCents: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_spending_cap', {
    p_company_id: companyId,
    p_additional_cost_cents: estimatedCostCents,
  });

  if (error) {
    console.error('check_spending_cap RPC error:', error.message);
    // Fail open so we don't silently block users when the RPC is down,
    // but log loudly so we notice.
    return true;
  }

  // The RPC returns a boolean (true = within cap)
  return !!data;
}

// ---------------------------------------------------------------------------
// Record actual spending after a successful AI call
// ---------------------------------------------------------------------------
export async function incrementSpending(
  supabase: SupabaseClient,
  companyId: string,
  costCents: number,
): Promise<void> {
  const { error } = await supabase.rpc('increment_spending', {
    p_company_id: companyId,
    p_amount: costCents,
  });

  if (error) {
    console.error('increment_spending RPC error:', error.message);
  }
}
