import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ConceptViewer } from '@/components/concept-viewer';
import { RevisionForm } from '@/components/revision-form';

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: concept } = await supabase
    .from('concepts')
    .select(`
      *,
      design_briefs:brief_id(
        id,
        area_id,
        project_areas:area_id(
          id,
          name,
          projects:project_id(id, name)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!concept) notFound();

  const { data: images } = await supabase
    .from('concept_images')
    .select('id, storage_path, resolution, created_at')
    .eq('concept_id', id)
    .order('created_at', { ascending: false });

  const { data: revisions } = await supabase
    .from('revisions')
    .select('id, revision_prompt, created_at')
    .eq('concept_id', id)
    .order('created_at', { ascending: false });

  // Generate signed URLs for images
  const signedImages = await Promise.all(
    (images ?? []).map(async (img) => {
      const { data } = await supabase.storage
        .from('concepts')
        .createSignedUrl(img.storage_path, 3600);
      return { ...img, signedUrl: data?.signedUrl ?? null };
    })
  );

  const brief = concept.design_briefs as { id: string; area_id: string; project_areas: { id: string; name: string; projects: { id: string; name: string } } };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/areas/${brief.area_id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {brief.project_areas.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{concept.title}</h1>
        {concept.description && (
          <p className="mt-1 text-gray-600">{concept.description}</p>
        )}
        <span className="mt-1 inline-block text-sm text-gray-400">Version {concept.version}</span>
      </div>

      {/* Concept Images */}
      <div className="mb-8">
        <ConceptViewer images={signedImages} />
      </div>

      {/* Revision Form */}
      <div className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Revise This Concept</h2>
        <RevisionForm conceptId={id} />
      </div>

      {/* Revision History */}
      {revisions && revisions.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Revision History</h2>
          <ul className="space-y-3">
            {revisions.map((rev) => (
              <li key={rev.id} className="rounded-lg border p-3">
                <p className="text-sm">{rev.revision_prompt}</p>
                <span className="mt-1 block text-xs text-gray-400">
                  {new Date(rev.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
