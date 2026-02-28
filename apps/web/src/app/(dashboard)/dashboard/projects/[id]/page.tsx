import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) notFound();

  const { data: areas } = await supabase
    .from('project_areas')
    .select('id, name, sun_exposure, climate_zone, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  async function createArea(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const sun_exposure = formData.get('sun_exposure') as string;
    const climate_zone = formData.get('climate_zone') as string;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('project_areas')
      .insert({ project_id: id, name, sun_exposure, climate_zone })
      .select('id')
      .single();

    if (error) throw error;
    redirect(`/dashboard/areas/${data.id}`);
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/projects" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>
        {project.address && <p className="text-gray-500">{project.address}</p>}
      </div>

      <form action={createArea} className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Add Area</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Area Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Front Yard"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="sun_exposure" className="block text-sm font-medium text-gray-700">
              Sun Exposure
            </label>
            <select
              id="sun_exposure"
              name="sun_exposure"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="full_sun">Full Sun</option>
              <option value="partial_shade">Partial Shade</option>
              <option value="full_shade">Full Shade</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label htmlFor="climate_zone" className="block text-sm font-medium text-gray-700">
              Climate Zone
            </label>
            <input
              id="climate_zone"
              name="climate_zone"
              type="text"
              placeholder="e.g. 7b"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add Area
        </button>
      </form>

      <h2 className="mb-4 text-lg font-semibold">Areas</h2>
      {areas && areas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/dashboard/areas/${area.id}`}
              className="rounded-lg border bg-white p-6 hover:shadow-md"
            >
              <h3 className="font-semibold">{area.name}</h3>
              <div className="mt-2 flex gap-2">
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
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No areas yet. Add one above.</p>
      )}
    </div>
  );
}
