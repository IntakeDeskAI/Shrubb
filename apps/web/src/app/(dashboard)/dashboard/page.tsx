import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/projects"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New Project
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Projects</h2>
          {projects && projects.length > 0 ? (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="block rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <span className="font-medium">{project.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No projects yet. Create one to get started.</p>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Jobs</h2>
          {recentJobs && recentJobs.length > 0 ? (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{job.type.replace('_', ' ')}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      job.status === 'succeeded'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : job.status === 'running'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No jobs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
