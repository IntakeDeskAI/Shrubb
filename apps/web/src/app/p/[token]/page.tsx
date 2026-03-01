import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { PlannerJson } from '@landscape-ai/shared';
import { AcceptProposalButton } from './accept-button';

interface PublicProposalProps {
  params: Promise<{ token: string }>;
}

export default async function PublicProposalPage({ params }: PublicProposalProps) {
  const { token } = await params;

  // Use service client — this page has no auth
  const supabase = await createServiceClient();

  // Load proposal by share_token
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error || !proposal) notFound();

  // Load related data
  const [{ data: company }, { data: client }, { data: project }] = await Promise.all([
    supabase.from('companies').select('name').eq('id', proposal.company_id).single(),
    supabase.from('clients').select('name').eq('id', proposal.client_id).single(),
    supabase.from('projects').select('id, name, address').eq('id', proposal.project_id).single(),
  ]);

  // Load planner JSON and renders
  let plannerJson: PlannerJson | null = null;
  let renderUrls: string[] = [];

  if (project) {
    const { data: latestRun } = await supabase
      .from('design_runs')
      .select('id, planner_json')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun) {
      plannerJson = (latestRun.planner_json as PlannerJson) ?? null;

      const { data: assets } = await supabase
        .from('design_assets')
        .select('storage_path, asset_type')
        .eq('design_run_id', latestRun.id)
        .eq('asset_type', 'render')
        .order('created_at', { ascending: true });

      if (assets) {
        renderUrls = assets.map((a) => {
          const { data: urlData } = supabase.storage
            .from('renders')
            .getPublicUrl(a.storage_path);
          return urlData.publicUrl;
        });
      }
    }
  }

  // Track view (only if proposal is in 'sent' status — first view)
  if (proposal.status === 'sent' && !proposal.viewed_at) {
    await supabase
      .from('proposals')
      .update({
        viewed_at: new Date().toISOString(),
        status: 'viewed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);
  }

  const isAccepted = proposal.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {company?.name ?? 'Landscape Company'}
            </p>
            <p className="text-sm text-gray-500">Landscape Proposal</p>
          </div>
          {isAccepted && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              Accepted
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Hi {client?.name ?? 'there'},
          </h1>
          {proposal.message && (
            <p className="mt-4 text-lg leading-relaxed text-gray-600 whitespace-pre-line">
              {proposal.message}
            </p>
          )}
        </div>

        {/* Project info */}
        {project && (
          <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Project:</span> {project.name}</p>
              {project.address && (
                <p><span className="font-medium text-gray-900">Address:</span> {project.address}</p>
              )}
            </div>
          </section>
        )}

        {/* Renders */}
        {renderUrls.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900">Design Renders</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {renderUrls.map((url, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-gray-200 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Landscape render ${i + 1}`}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plant List */}
        {plannerJson?.plant_palette && plannerJson.plant_palette.length > 0 && (
          <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Plant List</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 pr-4 font-medium text-gray-500">Plant</th>
                    <th className="pb-2 pr-4 font-medium text-gray-500">Qty</th>
                    <th className="pb-2 font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plannerJson.plant_palette.map((plant, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-900">
                          {plant.common_name}
                        </span>
                        {plant.botanical_name && (
                          <span className="ml-2 text-xs italic text-gray-400">
                            {plant.botanical_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {plant.quantity_estimate ?? '—'}
                      </td>
                      <td className="py-3 text-gray-500">
                        {plant.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Materials */}
        {plannerJson?.materials && plannerJson.materials.length > 0 && (
          <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Materials</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {plannerJson.materials.map((mat, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {mat.name}
                  {mat.quantity && (
                    <span className="text-gray-400">— {mat.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Accept button */}
        {!isAccepted && (
          <div className="mt-12 text-center">
            <AcceptProposalButton proposalId={proposal.id} token={token} />
          </div>
        )}

        {isAccepted && (
          <div className="mt-12 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-green-800">
              Proposal Accepted
            </h3>
            <p className="mt-2 text-sm text-green-700">
              Thank you! {company?.name} will be in touch with next steps.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8">
        <p className="text-center text-xs text-gray-400">
          Powered by <span className="font-medium">Shrubb</span>
        </p>
      </footer>
    </div>
  );
}
