-- ============================================================
-- LandscapeAI: Initial Schema + RLS Policies
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz default now() not null
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz default now() not null
);

-- Project Areas
create table public.project_areas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  sun_exposure text,
  climate_zone text,
  created_at timestamptz default now() not null
);

-- Area Photos
create table public.area_photos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.project_areas(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now() not null
);

-- Design Briefs
create table public.design_briefs (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.project_areas(id) on delete cascade,
  brief_json jsonb not null,
  created_at timestamptz default now() not null
);

-- Concepts
create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.design_briefs(id) on delete cascade,
  title text not null,
  description text,
  version integer default 1 not null,
  created_at timestamptz default now() not null
);

-- Concept Images
create table public.concept_images (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  storage_path text not null,
  resolution text,
  created_at timestamptz default now() not null
);

-- Revisions
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  revision_prompt text not null,
  created_at timestamptz default now() not null
);

-- Jobs (worker queue)
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}',
  result jsonb,
  error jsonb,
  attempts integer default 0 not null,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active',
  plan text not null default 'free',
  created_at timestamptz default now() not null
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_projects_user_id on public.projects(user_id);
create index idx_project_areas_project_id on public.project_areas(project_id);
create index idx_area_photos_area_id on public.area_photos(area_id);
create index idx_design_briefs_area_id on public.design_briefs(area_id);
create index idx_concepts_brief_id on public.concepts(brief_id);
create index idx_concept_images_concept_id on public.concept_images(concept_id);
create index idx_revisions_concept_id on public.revisions(concept_id);
create index idx_jobs_status on public.jobs(status);
create index idx_jobs_user_id on public.jobs(user_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create free subscription on profile creation
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, plan)
  values (new.id, 'active', 'free');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'role' = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ---- PROFILES ----
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- ---- PROJECTS ----
alter table public.projects enable row level security;

create policy "projects_select_own"
  on public.projects for select
  using (user_id = auth.uid() or public.is_admin());

create policy "projects_insert_own"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "projects_update_own"
  on public.projects for update
  using (user_id = auth.uid());

create policy "projects_delete_own"
  on public.projects for delete
  using (user_id = auth.uid());

-- ---- PROJECT AREAS ----
alter table public.project_areas enable row level security;

create policy "project_areas_select_own"
  on public.project_areas for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_areas.project_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "project_areas_insert_own"
  on public.project_areas for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_areas.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "project_areas_update_own"
  on public.project_areas for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_areas.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "project_areas_delete_own"
  on public.project_areas for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_areas.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- AREA PHOTOS ----
alter table public.area_photos enable row level security;

create policy "area_photos_select_own"
  on public.area_photos for select
  using (
    exists (
      select 1 from public.project_areas
      join public.projects on projects.id = project_areas.project_id
      where project_areas.id = area_photos.area_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "area_photos_insert_own"
  on public.area_photos for insert
  with check (
    exists (
      select 1 from public.project_areas
      join public.projects on projects.id = project_areas.project_id
      where project_areas.id = area_photos.area_id
      and projects.user_id = auth.uid()
    )
  );

create policy "area_photos_delete_own"
  on public.area_photos for delete
  using (
    exists (
      select 1 from public.project_areas
      join public.projects on projects.id = project_areas.project_id
      where project_areas.id = area_photos.area_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- DESIGN BRIEFS ----
alter table public.design_briefs enable row level security;

create policy "design_briefs_select_own"
  on public.design_briefs for select
  using (
    exists (
      select 1 from public.project_areas
      join public.projects on projects.id = project_areas.project_id
      where project_areas.id = design_briefs.area_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "design_briefs_insert_own"
  on public.design_briefs for insert
  with check (
    exists (
      select 1 from public.project_areas
      join public.projects on projects.id = project_areas.project_id
      where project_areas.id = design_briefs.area_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- CONCEPTS ----
alter table public.concepts enable row level security;

create policy "concepts_select_own"
  on public.concepts for select
  using (
    exists (
      select 1 from public.design_briefs
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where design_briefs.id = concepts.brief_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "concepts_insert_own"
  on public.concepts for insert
  with check (
    exists (
      select 1 from public.design_briefs
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where design_briefs.id = concepts.brief_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- CONCEPT IMAGES ----
alter table public.concept_images enable row level security;

create policy "concept_images_select_own"
  on public.concept_images for select
  using (
    exists (
      select 1 from public.concepts
      join public.design_briefs on design_briefs.id = concepts.brief_id
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where concepts.id = concept_images.concept_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "concept_images_insert_own"
  on public.concept_images for insert
  with check (
    exists (
      select 1 from public.concepts
      join public.design_briefs on design_briefs.id = concepts.brief_id
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where concepts.id = concept_images.concept_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- REVISIONS ----
alter table public.revisions enable row level security;

create policy "revisions_select_own"
  on public.revisions for select
  using (
    exists (
      select 1 from public.concepts
      join public.design_briefs on design_briefs.id = concepts.brief_id
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where concepts.id = revisions.concept_id
      and projects.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "revisions_insert_own"
  on public.revisions for insert
  with check (
    exists (
      select 1 from public.concepts
      join public.design_briefs on design_briefs.id = concepts.brief_id
      join public.project_areas on project_areas.id = design_briefs.area_id
      join public.projects on projects.id = project_areas.project_id
      where concepts.id = revisions.concept_id
      and projects.user_id = auth.uid()
    )
  );

-- ---- JOBS ----
alter table public.jobs enable row level security;

create policy "jobs_select_own"
  on public.jobs for select
  using (user_id = auth.uid() or public.is_admin());

create policy "jobs_insert_own"
  on public.jobs for insert
  with check (user_id = auth.uid());

-- ---- SUBSCRIPTIONS ----
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public) values ('originals', 'originals', false);
insert into storage.buckets (id, name, public) values ('concepts', 'concepts', false);
insert into storage.buckets (id, name, public) values ('exports', 'exports', false);

-- Storage policies: authenticated users can upload to their own path
create policy "originals_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'originals'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "originals_select"
  on storage.objects for select
  using (
    bucket_id = 'originals'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "concepts_select"
  on storage.objects for select
  using (
    bucket_id = 'concepts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports_select"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can insert into concepts and exports (used by worker)
create policy "concepts_insert_service"
  on storage.objects for insert
  with check (
    bucket_id = 'concepts'
    and auth.role() = 'service_role'
  );

create policy "exports_insert_service"
  on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and auth.role() = 'service_role'
  );
