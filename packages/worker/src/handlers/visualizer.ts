import { type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { checkSpendingCap, incrementSpending } from '../lib/spending-guard.js';
import {
  trackUsage,
  estimateCost,
  COST_PER_IMAGE_DALLE3_STANDARD,
} from '../lib/usage-tracker.js';

const DALLE_MODEL = 'dall-e-3';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Visualizer handler
// Generates DALL-E 3 concept renders from planner_json.
// ---------------------------------------------------------------------------
export async function handleVisualizer(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string,
  companyId: string,
): Promise<Record<string, unknown>> {
  const designRunId = payload.design_run_id as string;
  const projectId = payload.project_id as string;
  const conceptCount = Math.min(Math.max(Number(payload.concept_count) || 2, 1), 6);

  // 1. Load design_run + planner_json
  const { data: run, error: runErr } = await supabase
    .from('design_runs')
    .select('planner_json, style_prompt')
    .eq('id', designRunId)
    .single();

  if (runErr || !run) {
    throw new Error(`Failed to load design_run ${designRunId}: ${runErr?.message}`);
  }

  const plannerJson = run.planner_json as Record<string, unknown> | null;
  if (!plannerJson) {
    throw new Error('No planner_json found on design_run — run planner first');
  }

  // 2. Check spending cap (company-scoped)
  const estimatedCostUsd = COST_PER_IMAGE_DALLE3_STANDARD * conceptCount;
  const estimatedCostCents = Math.ceil(estimatedCostUsd * 100);

  const withinCap = await checkSpendingCap(supabase, companyId, estimatedCostCents);
  if (!withinCap) {
    throw new Error('Spending cap exceeded. Please upgrade your plan or add funds.');
  }

  // Build a description prompt from the planner output
  const style = (plannerJson.style as string) ?? 'modern';
  const beds = (plannerJson.beds as Array<Record<string, unknown>>) ?? [];
  const hardscape = (plannerJson.hardscape as Array<Record<string, unknown>>) ?? [];

  const plantList = beds
    .flatMap((b) => (b.plants as Array<Record<string, unknown>>) ?? [])
    .map((p) => p.common_name)
    .slice(0, 10)
    .join(', ');

  const hardscapeList = hardscape
    .map((h) => `${h.element} (${h.material})`)
    .slice(0, 5)
    .join(', ');

  const imagePrompt = `A photorealistic aerial-perspective rendering of a ${style} residential landscape design.
Features: ${plantList || 'mixed perennial garden'}.
Hardscape: ${hardscapeList || 'flagstone pathway and patio'}.
Natural lighting, lush greenery, high detail. No text or labels.`;

  // 3. Generate images
  const assetIds: string[] = [];

  for (let i = 0; i < conceptCount; i++) {
    const imageResponse = await openai.images.generate({
      model: DALLE_MODEL,
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      console.warn(`[visualizer] Image ${i + 1} returned no URL, skipping`);
      continue;
    }

    // Download image bytes
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.warn(`[visualizer] Failed to download image ${i + 1}: ${imageRes.statusText}`);
      continue;
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // 4. Upload to storage (company-scoped path)
    const fileId = crypto.randomUUID();
    const storagePath = `${companyId}/${projectId}/${fileId}.png`;

    const { error: uploadErr } = await supabase.storage
      .from('concepts')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadErr) {
      console.warn(`[visualizer] Upload error for image ${i + 1}: ${uploadErr.message}`);
      continue;
    }

    // 5. Create design_asset record
    const { data: asset, error: assetErr } = await supabase
      .from('design_assets')
      .insert({
        design_run_id: designRunId,
        asset_type: 'render',
        storage_path: storagePath,
        metadata: { prompt: imagePrompt, index: i },
      })
      .select('id')
      .single();

    if (assetErr || !asset) {
      console.warn(`[visualizer] Failed to insert design_asset: ${assetErr?.message}`);
      continue;
    }

    assetIds.push(asset.id);

    // 6. Track usage per image (company-scoped)
    const imageCost = COST_PER_IMAGE_DALLE3_STANDARD;
    await trackUsage(supabase, {
      user_id: userId,
      company_id: companyId,
      project_id: projectId,
      run_type: 'render',
      tokens_in: 0,
      tokens_out: 0,
      image_count: 1,
      estimated_cost_usd: imageCost,
      provider: 'openai',
      model: DALLE_MODEL,
    });

    // 7. Increment spending per image (company-scoped)
    await incrementSpending(supabase, companyId, Math.ceil(imageCost * 100));
  }

  console.log(
    `[visualizer] design_run ${designRunId} — generated ${assetIds.length}/${conceptCount} concepts`,
  );

  return { asset_ids: assetIds };
}
