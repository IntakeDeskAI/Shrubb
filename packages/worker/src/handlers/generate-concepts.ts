import type { SupabaseClient } from '@supabase/supabase-js';
import type { DesignBriefJson } from '@landscape-ai/shared';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONCEPT_VARIATIONS = [
  { emphasis: 'planting-focused', priority: 'Maximize greenery and planting areas' },
  { emphasis: 'hardscape-focused', priority: 'Emphasize patios, paths, and structural elements' },
  { emphasis: 'balanced', priority: 'Equal balance of plants and hardscape' },
  { emphasis: 'low-maintenance', priority: 'Minimize maintenance requirements' },
];

export async function handleGenerateConcepts(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const areaId = payload.area_id as string;
  if (!areaId) throw new Error('Missing area_id in payload');

  const { data: brief, error: briefError } = await supabase
    .from('design_briefs')
    .select('id, brief_json')
    .eq('area_id', areaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (briefError || !brief) throw new Error('No design brief found. Run generate_brief first.');

  const briefJson = brief.brief_json as DesignBriefJson;
  const conceptIds: string[] = [];

  for (const variation of CONCEPT_VARIATIONS) {
    const descPrompt = `You are a landscape architect. Create a concept title and description.

Design Brief:
Style: ${briefJson.style_primary} / ${briefJson.style_secondary}
Planting Density: ${briefJson.planting_density}
Hardscape Ratio: ${briefJson.hardscape_ratio}
Color Palette: ${briefJson.color_palette?.join(', ')}
Materials: ${briefJson.materials?.join(', ')}
Climate Zone: ${briefJson.climate_zone}
Sun Exposure: ${briefJson.sun_exposure}

Variation: ${variation.emphasis} - ${variation.priority}

Return JSON: { "title": "...", "description": "..." }`;

    const descResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: descPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const descContent = descResponse.choices[0]?.message?.content;
    if (!descContent) throw new Error('Empty concept description response');
    const { title, description } = JSON.parse(descContent);

    const imagePrompt = `Professional landscape design rendering, ${briefJson.style_primary} style garden. ${description}. Materials: ${briefJson.materials?.join(', ')}. Color palette: ${briefJson.color_palette?.join(', ')}. Photorealistic, aerial perspective, high quality.`;

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) throw new Error('Failed to generate image');

    const imageRes = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const storagePath = `${userId}/${areaId}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('concepts')
      .upload(storagePath, imageBuffer, { contentType: 'image/png' });

    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const { data: concept, error: conceptError } = await supabase
      .from('concepts')
      .insert({ brief_id: brief.id, title, description, version: 1 })
      .select('id')
      .single();

    if (conceptError) throw new Error(`Failed to create concept: ${conceptError.message}`);

    await supabase.from('concept_images').insert({
      concept_id: concept.id,
      storage_path: storagePath,
      resolution: 'standard',
    });

    conceptIds.push(concept.id);
  }

  return { concept_ids: conceptIds };
}
