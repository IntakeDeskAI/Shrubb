export type JobType =
  | 'generate_brief'
  | 'generate_concepts'
  | 'revise_concept'
  | 'upscale_concept'
  | 'export_pdf';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface GenerateBriefPayload {
  area_id: string;
  user_constraints?: string;
}

export interface GenerateConceptsPayload {
  brief_id: string;
  area_id: string;
}

export interface ReviseConceptPayload {
  concept_id: string;
  revision_prompt: string;
}

export interface UpscaleConceptPayload {
  concept_image_id: string;
}

export interface ExportPdfPayload {
  concept_ids: string[];
}

export const MAX_JOB_ATTEMPTS = 3;
export const JOB_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
