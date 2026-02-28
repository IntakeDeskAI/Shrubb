-- Atomic job acquisition function for worker
-- Uses FOR UPDATE SKIP LOCKED to prevent double execution

create or replace function public.acquire_job(
  p_worker_id text,
  p_stale_threshold timestamptz
)
returns setof public.jobs
language plpgsql
security definer
as $$
declare
  v_job public.jobs;
begin
  -- Select and lock a single queued job (or stale running job)
  select * into v_job
  from public.jobs
  where (
    status = 'queued'
    or (status = 'running' and locked_at < p_stale_threshold)
  )
  and attempts < 3
  order by created_at asc
  limit 1
  for update skip locked;

  if v_job.id is null then
    return;
  end if;

  -- Update the job to running
  update public.jobs
  set
    status = 'running',
    locked_at = now(),
    locked_by = p_worker_id,
    attempts = attempts + 1,
    updated_at = now()
  where id = v_job.id;

  -- Return the updated job
  v_job.status := 'running';
  v_job.locked_by := p_worker_id;
  v_job.locked_at := now();
  v_job.attempts := v_job.attempts + 1;

  return next v_job;
end;
$$;
