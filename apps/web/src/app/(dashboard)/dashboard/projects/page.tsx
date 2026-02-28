import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  async function createProject(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/auth/login');

    const { data, error } = await supabase
      .from('projects')
      .insert({ name, address, user_id: user.id })
      .select('id')
      .single();

    if (error) throw error;
    redirect(`/dashboard/projects/${data.id}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projects</h1>

      <form action={createProject} className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">New Project</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Front Yard Redesign"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Create Project
        </button>
      </form>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-lg border bg-white p-6 hover:shadow-md"
            >
              <h3 className="font-semibold">{project.name}</h3>
              {project.address && (
                <p className="mt-1 text-sm text-gray-500">{project.address}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No projects yet. Create your first project above.</p>
      )}
    </div>
  );
}
