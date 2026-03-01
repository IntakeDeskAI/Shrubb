import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MAX_JOB_ATTEMPTS, JOB_LOCK_TIMEOUT_MS } from '@landscape-ai/shared';
import { handlePlanner } from './handlers/planner.js';
import { handleVisualizer } from './handlers/visualizer.js';
import { handleClassifier } from './handlers/classifier.js';
import { handleSatelliteFetch } from './handlers/satellite-fetch.js';
import { handlePdfGeneration } from './handlers/pdf-generation.js';
import { handleChatResponse } from './handlers/chat-response.js';

const POLL_INTERVAL = parseInt(process.env.JOB_POLL_INTERVAL_MS ?? '3000', 10);
const WORKER_ID = process.env.WORKER_ID ?? `worker-${crypto.randomUUID().slice(0, 8)}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type WorkerSupabase = SupabaseClient;

type JobHandler = (
  supabase: WorkerSupabase,
  payload: Record<string, unknown>,
  userId: string,
  companyId: string,
) => Promise<Record<string, unknown>>;

const handlers: Record<string, JobHandler> = {
  planner: handlePlanner,
  visualizer: handleVisualizer,
  classifier: handleClassifier,
  satellite_fetch: handleSatelliteFetch,
  pdf_generation: handlePdfGeneration,
  chat_response: handleChatResponse,
};

interface JobRow {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  attempts: number;
}

/**
 * Resolve company_id for a job. Uses job.company_id if present,
 * otherwise falls back to looking it up from the project.
 */
async function resolveCompanyId(job: JobRow): Promise<string> {
  if (job.company_id) return job.company_id;

  // Fallback: resolve from project
  const projectId = job.payload.project_id as string | undefined;
  if (projectId) {
    const { data } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .single();
    if (data?.company_id) return data.company_id;
  }

  // Last resort: resolve from user's company membership
  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', job.user_id)
    .limit(1)
    .maybeSingle();

  if (membership?.company_id) return membership.company_id;

  throw new Error(`Cannot resolve company_id for job ${job.id}`);
}

async function pollAndProcess(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - JOB_LOCK_TIMEOUT_MS).toISOString();

    const { data: job, error: fetchError } = await supabase.rpc('acquire_job', {
      p_worker_id: WORKER_ID,
      p_stale_threshold: staleThreshold,
    });

    if (fetchError) {
      console.error('Error acquiring job:', fetchError.message);
      return;
    }

    if (!job || (Array.isArray(job) && job.length === 0)) {
      return;
    }

    const jobData: JobRow = Array.isArray(job) ? job[0] : job;
    if (!jobData?.id) return;

    console.log(`[${WORKER_ID}] Processing job ${jobData.id} (${jobData.type}) attempt ${jobData.attempts}`);

    const handler = handlers[jobData.type];
    if (!handler) {
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error: { message: `Unknown job type: ${jobData.type}` } as unknown as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobData.id);
      return;
    }

    try {
      // Resolve company_id before calling handler
      const companyId = await resolveCompanyId(jobData);

      const result = await handler(supabase, jobData.payload, jobData.user_id, companyId);

      await supabase
        .from('jobs')
        .update({
          status: 'succeeded',
          result: result as unknown as string,
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobData.id);

      console.log(`[${WORKER_ID}] Job ${jobData.id} succeeded`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const attempts = jobData.attempts ?? 0;

      if (attempts >= MAX_JOB_ATTEMPTS) {
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            error: { message: errorMessage } as unknown as string,
            locked_at: null,
            locked_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobData.id);

        console.error(`[${WORKER_ID}] Job ${jobData.id} failed permanently: ${errorMessage}`);
      } else {
        await supabase
          .from('jobs')
          .update({
            status: 'queued',
            error: { message: errorMessage } as unknown as string,
            locked_at: null,
            locked_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobData.id);

        console.warn(`[${WORKER_ID}] Job ${jobData.id} failed, will retry: ${errorMessage}`);
      }
    }
  } catch (err) {
    console.error('Worker loop error:', err);
  }
}

async function main() {
  console.log(`[${WORKER_ID}] Worker starting, polling every ${POLL_INTERVAL}ms`);

  while (true) {
    await pollAndProcess();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch(console.error);
