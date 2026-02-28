// ============================================================
// Job Types for AI Yard Planner
// ============================================================

export type JobType =
  | 'planner'
  | 'visualizer'
  | 'classifier'
  | 'satellite_fetch'
  | 'pdf_generation'
  | 'chat_response';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface PlannerPayload {
  project_id: string;
  design_run_id: string;
}

export interface VisualizerPayload {
  project_id: string;
  design_run_id: string;
  concept_count?: number; // 2-6 depending on tier
}

export interface ClassifierPayload {
  message_id: string;
  project_id: string;
  content: string;
}

export interface SatelliteFetchPayload {
  project_id: string;
  address: string;
  yard_type?: 'front' | 'back';
}

export interface PdfGenerationPayload {
  project_id: string;
  design_run_id: string;
}

export interface ChatResponsePayload {
  project_id: string;
  message_id: string;
  user_id: string;
}

export type JobPayload =
  | PlannerPayload
  | VisualizerPayload
  | ClassifierPayload
  | SatelliteFetchPayload
  | PdfGenerationPayload
  | ChatResponsePayload;

export const MAX_JOB_ATTEMPTS = 3;
export const JOB_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
