'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { redirect } from 'next/navigation';

export async function createProject(formData: FormData) {
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Resolve company
  const company = await getActiveCompany(supabase, user.id);
  if (!company) {
    throw new Error('No company found. Complete onboarding first.');
  }

  const { companyId } = company;

  // Parse form fields
  const inputType = formData.get('inputType') as 'photo' | 'address';
  const address = formData.get('address') as string | null;
  const photoFile = formData.get('photo') as File | null;

  const preferences: Record<string, unknown> = {
    style: formData.get('style') as string,
    budget: formData.get('budget') as string,
    maintenance: formData.get('maintenance') as string,
    watering: formData.get('watering') as string,
    sunExposure: formData.get('sunExposure') as string,
    hasPets: formData.get('hasPets') === 'true',
    needsPlayArea: formData.get('needsPlayArea') === 'true',
    hardscape: formData.get('hardscape') as string,
    notes: formData.get('notes') as string,
  };

  // Determine project name
  const projectName = address?.trim() ? address.trim() : 'My Yard Project';

  // 1. Increment project/proposal usage (company-scoped)
  const { data: usageAllowed, error: usageError } = await supabase.rpc(
    'increment_project_usage',
    { p_company_id: companyId }
  );

  if (usageError || usageAllowed === false) {
    throw new Error(
      'Project limit reached. Please upgrade your plan to create more projects.'
    );
  }

  // 2. Create the project (company-scoped)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      company_id: companyId,
      name: projectName,
      address: address?.trim() || null,
      status: 'setup',
      preferences,
    })
    .select('id')
    .single();

  if (projectError || !project) {
    throw new Error('Failed to create project: ' + (projectError?.message ?? 'Unknown error'));
  }

  const projectId = project.id;

  // 3. Handle input (photo upload or address/satellite)
  if (inputType === 'photo' && photoFile && photoFile.size > 0) {
    // Upload photo to Supabase storage inputs bucket (company-scoped path)
    const fileExt = photoFile.name.split('.').pop() || 'jpg';
    const storagePath = `${companyId}/${projectId}/input.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('inputs')
      .upload(storagePath, photoFile, {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error('Failed to upload photo: ' + uploadError.message);
    }

    // Create project_inputs record for photo
    const { error: inputError } = await supabase
      .from('project_inputs')
      .insert({
        project_id: projectId,
        input_type: 'photo',
        storage_path: storagePath,
      });

    if (inputError) {
      throw new Error('Failed to save project input: ' + inputError.message);
    }
  } else if (inputType === 'address' && address?.trim()) {
    // Create project_inputs record for satellite/address
    const { error: inputError } = await supabase
      .from('project_inputs')
      .insert({
        project_id: projectId,
        input_type: 'satellite',
        storage_path: '', // Will be populated when satellite image is fetched
      });

    if (inputError) {
      throw new Error('Failed to save project input: ' + inputError.message);
    }
  }

  // 4. Create a design_runs record
  const { data: designRun, error: runError } = await supabase
    .from('design_runs')
    .insert({
      project_id: projectId,
      run_type: 'initial',
      status: 'pending',
    })
    .select('id')
    .single();

  if (runError) {
    throw new Error('Failed to create design run: ' + runError.message);
  }

  // 5. Queue planner and visualizer jobs (company-scoped)
  const { error: plannerJobError } = await supabase.from('jobs').insert({
    user_id: user.id,
    company_id: companyId,
    project_id: projectId,
    type: 'planner',
    status: 'queued',
    payload: {
      project_id: projectId,
      design_run_id: designRun.id,
      preferences,
    },
  });

  if (plannerJobError) {
    console.error('Failed to queue planner job:', plannerJobError.message);
  }

  const { error: visualizerJobError } = await supabase.from('jobs').insert({
    user_id: user.id,
    company_id: companyId,
    project_id: projectId,
    type: 'visualizer',
    status: 'queued',
    payload: {
      project_id: projectId,
      design_run_id: designRun.id,
      preferences,
    },
  });

  if (visualizerJobError) {
    console.error('Failed to queue visualizer job:', visualizerJobError.message);
  }

  // 6. Redirect to the new project page
  redirect(`/app/projects/${projectId}`);
}
