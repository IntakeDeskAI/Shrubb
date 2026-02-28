import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleUpscaleConcept(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const conceptImageId = payload.concept_image_id as string;
  if (!conceptImageId) throw new Error('Missing concept_image_id in payload');

  const { data: image, error: imageError } = await supabase
    .from('concept_images')
    .select('id, concept_id, storage_path')
    .eq('id', conceptImageId)
    .single();

  if (imageError || !image) throw new Error('Concept image not found');

  const { data: concept } = await supabase
    .from('concepts')
    .select('title, description')
    .eq('id', image.concept_id)
    .single();

  const imagePrompt = `Professional landscape design rendering, ultra high detail. ${concept?.title}: ${concept?.description}. Photorealistic, 4K quality, architectural visualization, magazine quality.`;

  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    size: '1792x1024',
    quality: 'hd',
    n: 1,
  });

  const imageUrl = imageResponse.data?.[0]?.url;
  if (!imageUrl) throw new Error('Failed to generate upscaled image');

  const imageRes = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const storagePath = `${userId}/upscaled/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('concepts')
    .upload(storagePath, imageBuffer, { contentType: 'image/png' });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: newImage, error: insertError } = await supabase
    .from('concept_images')
    .insert({
      concept_id: image.concept_id,
      storage_path: storagePath,
      resolution: 'high',
    })
    .select('id')
    .single();

  if (insertError) throw new Error(`Failed to store upscaled image: ${insertError.message}`);

  return { concept_image_id: newImage.id };
}
