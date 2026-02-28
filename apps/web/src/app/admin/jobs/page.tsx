import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Check admin role
  const { data: userData } = await supabase.auth.getUser();
  const isAdmin = userData.user?.user_metadata?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    );
  }

  // Use service role to bypass RLS for admin view
  const { createClient: createServiceSupa } = await import('@supabase/supabase-js');
  const serviceClient = createServiceSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: jobs } = await serviceClient
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin: Jobs Dashboard</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Attempts</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Locked By</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {jobs?.map((job) => (
              <tr key={job.id}>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-500">
                  {job.id.slice(0, 8)}...
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">{job.type}</td>
                <td className="whitespace-nowrap px-4 py-3">
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
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">{job.attempts}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {job.locked_by ?? '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-xs text-red-600">
                  {job.error ? JSON.stringify(job.error) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
