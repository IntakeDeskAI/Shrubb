import { type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { checkSpendingCap, incrementSpending } from '../lib/spending-guard.js';
import { trackUsage, estimateCost } from '../lib/usage-tracker.js';

const MODEL = 'gpt-4o';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Planner handler
// Takes a design_run_id + project_id and produces structured PlannerJson.
// ---------------------------------------------------------------------------
export async function handlePlanner(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string,
  companyId: string,
): Promise<Record<string, unknown>> {
  const designRunId = payload.design_run_id as string;
  const projectId = payload.project_id as string;

  // 1. Load project data
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('name, address, preferences, climate_zone')
    .eq('id', projectId)
    .single();

  if (projErr || !project) {
    throw new Error(`Failed to load project ${projectId}: ${projErr?.message}`);
  }

  // Load project inputs (photo references)
  const { data: inputs } = await supabase
    .from('project_inputs')
    .select('input_type, storage_path')
    .eq('project_id', projectId);

  // 2. Check spending cap (company-scoped)
  const estimatedCostUsd = estimateCost(2000, 4000, MODEL);
  const estimatedCostCents = Math.ceil(estimatedCostUsd * 100);

  const withinCap = await checkSpendingCap(supabase, companyId, estimatedCostCents);
  if (!withinCap) {
    throw new Error('Spending cap exceeded. Please upgrade your plan or add funds.');
  }

  // 3. Build prompt
  const preferences = project.preferences ?? {};
  const photoList = (inputs ?? [])
    .map((i: { input_type: string; storage_path: string }) => `- ${i.input_type}: ${i.storage_path}`)
    .join('\n');

  const systemPrompt = `You are an expert landscape architect AI. Produce a structured JSON landscape plan.
Return ONLY valid JSON matching this schema — no markdown, no explanation outside the JSON object.

Schema:
{
  "beds": [{ "name": string, "shape": string, "plants": [{ "common_name": string, "botanical_name": string, "quantity_estimate": number, "spacing_inches": number, "zone_ok": boolean, "sun_ok": boolean, "water_ok": boolean, "notes?": string }] }],
  "plant_palette": [{ "common_name": string, "botanical_name": string, "quantity_estimate": number, "spacing_inches": string, "zone_range": string, "sun": string, "water": string, "pet_safe?": boolean, "notes?": string }],
  "hardscape": [{ "element": string, "material": string, "area_sqft?": number, "notes?": string }],
  "materials": [{ "name": string, "quantity": string, "estimated_cost": string }],
  "maintenance_notes": [string],
  "assumptions": [string],
  "disclaimers": [string],
  "questions_for_user": [string],
  "style": string,
  "estimated_budget": string
}`;

  const userPrompt = `Design a landscape plan for:
Project: ${project.name}
Address: ${project.address ?? 'Not provided'}
Climate zone: ${project.climate_zone ?? 'Unknown'}

User preferences:
- Style: ${(preferences as Record<string, unknown>).style ?? 'Not specified'}
- Budget: ${(preferences as Record<string, unknown>).budget ?? 'Not specified'}
- Maintenance level: ${(preferences as Record<string, unknown>).maintenance_level ?? 'Not specified'}
- Watering: ${(preferences as Record<string, unknown>).watering ?? 'Not specified'}
- Sun exposure: ${(preferences as Record<string, unknown>).sun_exposure ?? 'Not specified'}
- Pets: ${(preferences as Record<string, unknown>).pets ?? 'Not specified'}
- Kids play area: ${(preferences as Record<string, unknown>).kids_play_area ?? 'Not specified'}
- Hardscape level: ${(preferences as Record<string, unknown>).hardscape_level ?? 'Not specified'}
- Additional notes: ${(preferences as Record<string, unknown>).notes ?? 'None'}

${photoList ? `Uploaded photos:\n${photoList}` : 'No photos uploaded.'}

Produce a complete landscape plan as JSON.`;

  // 4. Call GPT-4o
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096,
  });

  const usage = completion.usage;
  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const rawContent = completion.choices[0]?.message?.content ?? '{}';

  let plannerJson: Record<string, unknown>;
  try {
    plannerJson = JSON.parse(rawContent);
  } catch {
    throw new Error('GPT-4o returned invalid JSON for planner output');
  }

  // 5. Track usage (company-scoped)
  const actualCost = estimateCost(tokensIn, tokensOut, MODEL);
  await trackUsage(supabase, {
    user_id: userId,
    company_id: companyId,
    project_id: projectId,
    run_type: 'planner',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    image_count: 0,
    estimated_cost_usd: actualCost,
    provider: 'openai',
    model: MODEL,
  });

  // 6. Increment spending (company-scoped)
  await incrementSpending(supabase, companyId, Math.ceil(actualCost * 100));

  // 7. Save planner_json to design_runs
  const { error: updateErr } = await supabase
    .from('design_runs')
    .update({
      planner_json: plannerJson,
      status: 'succeeded',
    })
    .eq('id', designRunId);

  if (updateErr) {
    throw new Error(`Failed to update design_run: ${updateErr.message}`);
  }

  console.log(`[planner] design_run ${designRunId} completed — ${tokensIn}/${tokensOut} tokens`);

  return { design_run_id: designRunId, planner_json: plannerJson };
}
