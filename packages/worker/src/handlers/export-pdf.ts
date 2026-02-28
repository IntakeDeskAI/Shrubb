import type { SupabaseClient } from '@supabase/supabase-js';

interface ConceptWithImages {
  id: string;
  title: string;
  description: string | null;
  version: number;
  images: Array<{ id: string; storage_path: string; resolution: string | null }>;
}

export async function handleExportPdf(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const conceptIds = payload.concept_ids as string[];

  if (!conceptIds || !Array.isArray(conceptIds) || conceptIds.length === 0) {
    throw new Error('Missing or empty concept_ids in payload');
  }

  const concepts: ConceptWithImages[] = [];

  for (const conceptId of conceptIds) {
    const { data: concept } = await supabase
      .from('concepts')
      .select('id, title, description, version')
      .eq('id', conceptId)
      .single();

    if (!concept) continue;

    const { data: images } = await supabase
      .from('concept_images')
      .select('id, storage_path, resolution')
      .eq('concept_id', conceptId)
      .order('resolution', { ascending: false });

    concepts.push({
      id: concept.id,
      title: concept.title,
      description: concept.description,
      version: concept.version,
      images: images ?? [],
    });
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .concept { page-break-after: always; }
    .concept:last-child { page-break-after: auto; }
    h1 { color: #166534; }
    h2 { color: #333; margin-top: 30px; }
    p { color: #666; line-height: 1.6; }
    .meta { font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>LandscapeAI Design Concepts</h1>
  ${concepts.map((c) => `
    <div class="concept">
      <h2>${c.title}</h2>
      <p>${c.description ?? ''}</p>
      <p class="meta">Version ${c.version} | ${c.images.length} image(s)</p>
    </div>
  `).join('')}
</body>
</html>`;

  const exportBuffer = Buffer.from(htmlContent, 'utf-8');
  const storagePath = `${userId}/exports/${crypto.randomUUID()}.html`;

  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(storagePath, exportBuffer, { contentType: 'text/html' });

  if (uploadError) throw new Error(`Export upload failed: ${uploadError.message}`);

  return { export_path: storagePath };
}
