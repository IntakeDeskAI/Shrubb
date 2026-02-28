import type { SupabaseClient } from '@supabase/supabase-js';
import type { DesignBriefJson } from '@landscape-ai/shared';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleGenerateBrief(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const areaId = payload.area_id as string;
  const userConstraints = (payload.user_constraints as string) ?? '';

  if (!areaId) throw new Error('Missing area_id in payload');

  const { data: area, error: areaError } = await supabase
    .from('project_areas')
    .select('name, sun_exposure, climate_zone')
    .eq('id', areaId)
    .single();

  if (areaError || !area) throw new Error('Area not found');

  const { data: photos } = await supabase
    .from('area_photos')
    .select('storage_path')
    .eq('area_id', areaId);

  const photoCount = photos?.length ?? 0;

  const prompt = `You are a professional landscape designer. Generate a structured design brief for a landscape project.

Area: ${area.name}
Sun Exposure: ${area.sun_exposure ?? 'unknown'}
Climate Zone: ${area.climate_zone ?? 'unknown'}
Number of reference photos provided: ${photoCount}
User constraints: ${userConstraints || 'None specified'}

Return a JSON object with exactly these fields:
- style_primary: main landscape style (e.g. "Modern", "Cottage", "Mediterranean", "Japanese", "Tropical")
- style_secondary: complementary style
- planting_density: "sparse", "moderate", or "dense"
- hardscape_ratio: percentage as string (e.g. "30%")
- color_palette: array of 4-6 colors
- materials: array of 3-5 materials
- constraints: array of constraints
- avoid_list: array of things to avoid
- budget_range: estimated range (e.g. "$5,000 - $15,000")
- maintenance_level: "low", "medium", or "high"
- climate_zone: the climate zone
- sun_exposure: the sun exposure
- must_keep: array of features to preserve
- must_hide: array of features to screen

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');

  const briefJson = JSON.parse(content) as DesignBriefJson;

  const { data: brief, error: insertError } = await supabase
    .from('design_briefs')
    .insert({ area_id: areaId, brief_json: briefJson })
    .select('id')
    .single();

  if (insertError) throw new Error(`Failed to store brief: ${insertError.message}`);

  return { brief_id: brief.id };
}
