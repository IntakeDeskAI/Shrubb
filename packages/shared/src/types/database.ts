// ============================================================
// Database Types for AI Yard Planner
// Matches supabase/migrations/00003_pivot_schema.sql
// ============================================================

import type { JobType, JobStatus } from './jobs.js';
import type { PlannerJson, ProjectPreferences } from './tiers.js';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          phone_verified: boolean;
          sms_opt_in: boolean;
          voice_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          phone_verified?: boolean;
          sms_opt_in?: boolean;
          voice_opt_in?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          phone_verified?: boolean;
          sms_opt_in?: boolean;
          voice_opt_in?: boolean;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          status: string;
          preferences: ProjectPreferences;
          climate_zone: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          status?: string;
          preferences?: ProjectPreferences;
          climate_zone?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          status?: string;
          preferences?: ProjectPreferences;
          climate_zone?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
      };
      entitlements: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          included_chat_messages: number;
          included_rerenders: number;
          included_projects: number;
          included_voice_minutes: number;
          chat_messages_used: number;
          rerenders_used: number;
          projects_used: number;
          voice_minutes_used: number;
          spending_cap_cents: number;
          spending_used_cents: number;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: string;
          included_chat_messages?: number;
          included_rerenders?: number;
          included_projects?: number;
          included_voice_minutes?: number;
          chat_messages_used?: number;
          rerenders_used?: number;
          projects_used?: number;
          voice_minutes_used?: number;
          spending_cap_cents?: number;
          spending_used_cents?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: string;
          included_chat_messages?: number;
          included_rerenders?: number;
          included_projects?: number;
          included_voice_minutes?: number;
          chat_messages_used?: number;
          rerenders_used?: number;
          projects_used?: number;
          voice_minutes_used?: number;
          spending_cap_cents?: number;
          spending_used_cents?: number;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_payment_intent_id: string | null;
          product_type: string;
          product_name: string;
          amount_cents: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_payment_intent_id?: string | null;
          product_type: string;
          product_name: string;
          amount_cents: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: string;
        };
      };
      project_inputs: {
        Row: {
          id: string;
          project_id: string;
          input_type: string;
          storage_path: string;
          editable_area_polygon: Record<string, unknown> | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          input_type: string;
          storage_path: string;
          editable_area_polygon?: Record<string, unknown> | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          editable_area_polygon?: Record<string, unknown> | null;
          lat?: number | null;
          lng?: number | null;
        };
      };
      design_runs: {
        Row: {
          id: string;
          project_id: string;
          run_type: string;
          status: string;
          planner_json: PlannerJson | null;
          style_prompt: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          run_type: string;
          status?: string;
          planner_json?: PlannerJson | null;
          style_prompt?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          planner_json?: PlannerJson | null;
          style_prompt?: string | null;
        };
      };
      design_assets: {
        Row: {
          id: string;
          design_run_id: string;
          asset_type: string;
          storage_path: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          design_run_id: string;
          asset_type: string;
          storage_path: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          metadata?: Record<string, unknown>;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          content: string;
          channel: string;
          external_id: string | null;
          media_urls: string[];
          intent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: string;
          content: string;
          channel?: string;
          external_id?: string | null;
          media_urls?: string[];
          intent?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          intent?: string | null;
        };
      };
      usage_ledger: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          message_id: string | null;
          run_type: string;
          tokens_in: number;
          tokens_out: number;
          image_count: number;
          estimated_cost_usd: number;
          provider: string;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          message_id?: string | null;
          run_type: string;
          tokens_in?: number;
          tokens_out?: number;
          image_count?: number;
          estimated_cost_usd: number;
          provider: string;
          model?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      plant_catalog: {
        Row: {
          id: string;
          common_name: string;
          botanical_name: string;
          category: string | null;
          zone_min: number | null;
          zone_max: number | null;
          sun: string | null;
          water: string | null;
          pet_safe: boolean;
          native_region: string | null;
          spacing_inches: number | null;
          mature_height_inches: number | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          common_name: string;
          botanical_name: string;
          category?: string | null;
          zone_min?: number | null;
          zone_max?: number | null;
          sun?: string | null;
          water?: string | null;
          pet_safe?: boolean;
          native_region?: string | null;
          spacing_inches?: number | null;
          mature_height_inches?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          common_name?: string;
          botanical_name?: string;
          category?: string | null;
          zone_min?: number | null;
          zone_max?: number | null;
          sun?: string | null;
          water?: string | null;
          pet_safe?: boolean;
          native_region?: string | null;
          spacing_inches?: number | null;
          mature_height_inches?: number | null;
          image_url?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
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
          project_id?: string | null;
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
          project_id?: string | null;
          type?: JobType;
          status?: JobStatus;
          payload?: Record<string, unknown>;
          result?: Record<string, unknown> | null;
          error?: Record<string, unknown> | null;
          attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
