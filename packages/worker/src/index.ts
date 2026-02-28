import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MAX_JOB_ATTEMPTS, JOB_LOCK_TIMEOUT_MS } from '@landscape-ai/shared';
import { handleGenerateBrief } from './handlers/generate-brief.js';
import { handleGenerateConcepts } from './handlers/generate-concepts.js';
import { handleReviseConcept } from './handlers/revise-concept.js';
import { handleUpscaleConcept } from './handlers/upscale-concept.js';
import { handleExportPdf } from './handlers/export-pdf.js';

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
  userId: string
) => Promise<Record<string, unknown>>;

const handlers: Record<string, JobHandler> = {
  generate_brief: handleGenerateBrief,
  generate_concepts: handleGenerateConcepts,
  revise_concept: handleReviseConcept,
  upscale_concept: handleUpscaleConcept,
  export_pdf: handleExportPdf,
};

interface JobRow {
  id: string;
  user_id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  attempts: number;
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
      const result = await handler(supabase, jobData.payload, jobData.user_id);

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
