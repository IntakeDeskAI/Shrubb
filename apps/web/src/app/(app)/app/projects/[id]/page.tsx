import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ChatPanel } from '@/components/chat/chat-panel';
import { PreviewTabs } from '@/components/chat/preview-tabs';
import type { PlannerJson } from '@landscape-ai/shared';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Load project and verify ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Load messages for this project
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at, intent')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  // Load latest design_run with planner_json
  const { data: latestRun } = await supabase
    .from('design_runs')
    .select('id, planner_json')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Load design assets (from the latest run if exists)
  let assets: Array<{
    id: string;
    asset_type: string;
    storage_path: string;
    metadata: Record<string, unknown>;
  }> = [];

  if (latestRun) {
    const { data: designAssets } = await supabase
      .from('design_assets')
      .select('id, asset_type, storage_path, metadata')
      .eq('design_run_id', latestRun.id)
      .order('created_at', { ascending: false });

    assets = designAssets ?? [];
  }

  const plannerJson = (latestRun?.planner_json as PlannerJson) ?? null;

  return (
    // Break out of parent layout padding to fill the viewport
    <div className="-mx-6 -my-8">
      <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
        {/* Chat Panel - left side */}
        <div className="flex flex-col border-b lg:w-[60%] lg:border-b-0 lg:border-r border-gray-200">
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {project.name}
            </h1>
            {project.address && (
              <p className="mt-0.5 text-sm text-gray-500">{project.address}</p>
            )}
          </div>
          <ChatPanel
            projectId={id}
            initialMessages={
              messages?.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                created_at: m.created_at,
                intent: m.intent ?? undefined,
              })) ?? []
            }
          />
        </div>

        {/* Preview Tabs - right side */}
        <div className="flex-1 lg:w-[40%]">
          <PreviewTabs
            projectId={id}
            plannerJson={plannerJson}
            assets={assets}
          />
        </div>
      </div>
    </div>
  );
}
