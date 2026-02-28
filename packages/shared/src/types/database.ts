import type { JobType, JobStatus } from './jobs.js';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
        };
      };
      project_areas: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          sun_exposure: string | null;
          climate_zone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          sun_exposure?: string | null;
          climate_zone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          sun_exposure?: string | null;
          climate_zone?: string | null;
          created_at?: string;
        };
      };
      area_photos: {
        Row: {
          id: string;
          area_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          area_id: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          area_id?: string;
          storage_path?: string;
          created_at?: string;
        };
      };
      design_briefs: {
        Row: {
          id: string;
          area_id: string;
          brief_json: DesignBriefJson;
          created_at: string;
        };
        Insert: {
          id?: string;
          area_id: string;
          brief_json: DesignBriefJson;
          created_at?: string;
        };
        Update: {
          id?: string;
          area_id?: string;
          brief_json?: DesignBriefJson;
          created_at?: string;
        };
      };
      concepts: {
        Row: {
          id: string;
          brief_id: string;
          title: string;
          description: string | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          brief_id: string;
          title: string;
          description?: string | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          brief_id?: string;
          title?: string;
          description?: string | null;
          version?: number;
          created_at?: string;
        };
      };
      concept_images: {
        Row: {
          id: string;
          concept_id: string;
          storage_path: string;
          resolution: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          concept_id: string;
          storage_path: string;
          resolution?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          concept_id?: string;
          storage_path?: string;
          resolution?: string | null;
          created_at?: string;
        };
      };
      revisions: {
        Row: {
          id: string;
          concept_id: string;
          revision_prompt: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          concept_id: string;
          revision_prompt: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          concept_id?: string;
          revision_prompt?: string;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          type: JobType;
          status: JobStatus;
          payload: Record<string, unknown>;
          result: Record<string, unknown> | null;
          error: Record<string, unknown> | null;
          attempts: number;
          locked_at: string | null;
          locked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: JobType;
          status?: JobStatus;
          payload: Record<string, unknown>;
          result?: Record<string, unknown> | null;
          error?: Record<string, unknown> | null;
          attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: JobType;
          status?: JobStatus;
          payload?: Record<string, unknown>;
          result?: Record<string, unknown> | null;
          error?: Record<string, unknown> | null;
          attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          plan: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          created_at?: string;
        };
      };
    };
  };
}

export interface DesignBriefJson {
  style_primary: string;
  style_secondary: string;
  planting_density: string;
  hardscape_ratio: string;
  color_palette: string[];
  materials: string[];
  constraints: string[];
  avoid_list: string[];
  budget_range: string;
  maintenance_level: string;
  climate_zone: string;
  sun_exposure: string;
  must_keep: string[];
  must_hide: string[];
}
