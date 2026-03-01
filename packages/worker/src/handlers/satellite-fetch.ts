import { type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Satellite fetch handler (placeholder)
// Will eventually call Google Maps Static API or Mapbox for aerial imagery.
// ---------------------------------------------------------------------------
export async function handleSatelliteFetch(
  _supabase: SupabaseClient,
  payload: Record<string, unknown>,
  _userId: string,
  _companyId: string,
): Promise<Record<string, unknown>> {
  const projectId = payload.project_id as string;
  const address = payload.address as string;
  const yardType = (payload.yard_type as string) ?? 'back';

  console.log(
    `[satellite_fetch] Placeholder — project=${projectId} address="${address}" yard=${yardType}`,
  );

  // TODO: Integrate Google Maps Static API or Mapbox Satellite
  // 1. Geocode address to lat/lng
  // 2. Fetch satellite tile at appropriate zoom level
  // 3. Upload to storage bucket 'satellite' (company-scoped path)
  // 4. Create project_input record with storage_path
  // 5. Optionally update project lat/lng

  return { status: 'placeholder', address };
}
