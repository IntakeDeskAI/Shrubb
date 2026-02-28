import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PhotoUploader } from '@/components/photo-uploader';
import { GenerateButton } from '@/components/generate-button';

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch area with its project for breadcrumb
  const { data: area } = await supabase
    .from('project_areas')
    .select('*, projects:project_id(id, name, user_id)')
    .eq('id', id)
    .single();

  if (!area) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from('area_photos')
    .select('id, storage_path, created_at')
    .eq('area_id', id)
    .order('created_at', { ascending: false });

  // Fetch briefs and concepts
  const { data: briefs } = await supabase
    .from('design_briefs')
    .select('id, brief_json, created_at')
    .eq('area_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestBrief = briefs?.[0];

  let concepts: Array<{
    id: string;
    title: string;
    description: string | null;
    version: number;
    created_at: string;
  }> | null = null;

  if (latestBrief) {
    const { data } = await supabase
      .from('concepts')
      .select('id, title, description, version, created_at')
      .eq('brief_id', latestBrief.id)
      .order('created_at', { ascending: false });
    concepts = data;
  }

  // Check for running jobs
  const { data: { user } } = await supabase.auth.getUser();
  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('id, type, status')
    .eq('user_id', user!.id)
    .in('status', ['queued', 'running'])
    .in('type', ['generate_brief', 'generate_concepts']);

  const hasActiveJob = activeJobs && activeJobs.length > 0;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${(area.projects as { id: string }).id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {(area.projects as { name: string }).name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{area.name}</h1>
        <div className="mt-1 flex gap-2">
          {area.sun_exposure && (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
              {area.sun_exposure.replace('_', ' ')}
            </span>
          )}
          {area.climate_zone && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
              Zone {area.climate_zone}
            </span>
          )}
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Yard Photos</h2>
        <PhotoUploader areaId={id} existingPhotos={photos ?? []} />
      </div>

      {/* Generate Concepts */}
      <div className="mb-8">
        <GenerateButton areaId={id} hasPhotos={(photos?.length ?? 0) > 0} hasActiveJob={hasActiveJob ?? false} />
      </div>

      {/* Concepts Gallery */}
      {concepts && concepts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Concepts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {concepts.map((concept) => (
              <Link
                key={concept.id}
                href={`/dashboard/concepts/${concept.id}`}
                className="rounded-lg border bg-white p-6 hover:shadow-md"
              >
                <h3 className="font-semibold">{concept.title}</h3>
                {concept.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {concept.description}
                  </p>
                )}
                <span className="mt-2 inline-block text-xs text-gray-400">
                  v{concept.version}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
