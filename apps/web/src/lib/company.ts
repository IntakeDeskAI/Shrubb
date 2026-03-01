import type { SupabaseClient } from '@supabase/supabase-js';

export interface ActiveCompany {
  companyId: string;
  role: string;
  companyName: string;
}

/**
 * Resolve the authenticated user's primary company.
 * Returns null if the user doesn't belong to any company yet.
 */
export async function getActiveCompany(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveCompany | null> {
  const { data, error } = await supabase.rpc('get_user_company', {
    p_user_id: userId,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    companyId: row.company_id,
    role: row.role,
    companyName: row.company_name,
  };
}
