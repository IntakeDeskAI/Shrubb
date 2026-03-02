import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Tooltip, HowTo } from '@/components/tooltip';

const STATUS_FILTERS = ['all', 'queued', 'running', 'failed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeFilter: StatusFilter = STATUS_FILTERS.includes(
    statusParam as StatusFilter,
  )
    ? (statusParam as StatusFilter)
    : 'all';

  const supabase = await createServiceClient();

  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter);
  }

  const { data: jobs } = await query;
  const jobsList = jobs ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
      <HowTo text="Check this page when users report stuck projects. Failed jobs with high attempt counts may need manual intervention." className="mt-3" />

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter}
            href={
              filter === 'all'
                ? '/admin/jobs'
                : `/admin/jobs?status=${filter}`
            }
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === filter
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Link>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Type <Tooltip text="planner = landscape design AI · visualizer = rendering AI · phone_provision = number setup" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Status <Tooltip text="queued = waiting · running = in progress · completed = done · failed = error after max retries" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Attempts <Tooltip text="Number of times the job has been tried. Jobs retry automatically on failure." />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Created
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Updated
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobsList.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No jobs found
                </td>
              </tr>
            )}
            {jobsList.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                  {job.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">
                  {job.type}
                </td>
                <td className="px-4 py-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{job.attempts}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${job.user_id}`}
                    className="font-mono text-xs text-brand-600 hover:underline"
                  >
                    {job.user_id.slice(0, 8)}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {new Date(job.updated_at).toLocaleString()}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-xs text-red-600">
                  {job.status === 'failed' && job.error
                    ? typeof job.error === 'string'
                      ? job.error
                      : JSON.stringify(job.error)
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Showing up to 100 most recent jobs
        {activeFilter !== 'all' ? ` with status "${activeFilter}"` : ''}.
      </p>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: 'bg-yellow-50 text-yellow-700',
    running: 'bg-blue-50 text-blue-700',
    succeeded: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}
