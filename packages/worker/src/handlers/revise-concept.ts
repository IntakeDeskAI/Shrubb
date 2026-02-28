import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleReviseConcept(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const conceptId = payload.concept_id as string;
  const revisionPrompt = payload.revision_prompt as string;

  if (!conceptId) throw new Error('Missing concept_id in payload');
  if (!revisionPrompt) throw new Error('Missing revision_prompt in payload');

  const { data: concept, error: conceptError } = await supabase
    .from('concepts')
    .select('id, title, description, brief_id, version')
    .eq('id', conceptId)
    .single();

  if (conceptError || !concept) throw new Error('Concept not found');

  const { data: brief } = await supabase
    .from('design_briefs')
    .select('brief_json, area_id')
    .eq('id', concept.brief_id)
    .single();

  const descResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a landscape architect revising a design concept.' },
      {
        role: 'user',
        content: `Original: "${concept.title}" - ${concept.description}
Brief: ${JSON.stringify(brief?.brief_json)}
Revision: ${revisionPrompt}

Return JSON: { "title": "...", "description": "..." }`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const descContent = descResponse.choices[0]?.message?.content;
  if (!descContent) throw new Error('Empty revision response');
  const { title, description } = JSON.parse(descContent);

  const imagePrompt = `Professional landscape design rendering. ${description}. Revision: ${revisionPrompt}. Photorealistic, aerial perspective, high quality.`;

  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });

  const imageUrl = imageResponse.data?.[0]?.url;
  if (!imageUrl) throw new Error('Failed to generate revised image');

  const imageRes = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const areaId = brief?.area_id ?? 'unknown';
  const storagePath = `${userId}/${areaId}/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('concepts')
    .upload(storagePath, imageBuffer, { contentType: 'image/png' });

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const { data: newConcept, error: insertError } = await supabase
    .from('concepts')
    .insert({
      brief_id: concept.brief_id,
      title,
      description,
      version: concept.version + 1,
    })
    .select('id')
    .single();

  if (insertError) throw new Error(`Failed to create revised concept: ${insertError.message}`);

  await supabase.from('concept_images').insert({
    concept_id: newConcept.id,
    storage_path: storagePath,
    resolution: 'standard',
  });

  await supabase.from('revisions').insert({
    concept_id: conceptId,
    revision_prompt: revisionPrompt,
  });

  return { concept_id: newConcept.id };
}
