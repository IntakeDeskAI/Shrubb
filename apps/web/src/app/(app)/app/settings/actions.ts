'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const fullName = (formData.get('full_name') as string)?.trim() ?? '';

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (error) {
    throw new Error('Failed to update profile');
  }

  revalidatePath('/app/settings');
}

export async function updateAiSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const aiSmsEnabled = formData.get('ai_sms_enabled') === 'true';
  const aiCallsEnabled = formData.get('ai_calls_enabled') === 'true';
  const callForwardingEnabled = formData.get('call_forwarding_enabled') === 'true';
  const forwardPhone = (formData.get('forward_phone_e164') as string)?.trim() || null;
  const bhStart = (formData.get('business_hours_start') as string) || '08:00';
  const bhEnd = (formData.get('business_hours_end') as string) || '18:00';
  const bhTimezone = (formData.get('business_hours_timezone') as string) || 'America/New_York';

  const { error } = await supabase
    .from('company_settings')
    .update({
      ai_sms_enabled: aiSmsEnabled,
      ai_calls_enabled: aiCallsEnabled,
      call_forwarding_enabled: callForwardingEnabled,
      forward_phone_e164: forwardPhone,
      business_hours_start: bhStart,
      business_hours_end: bhEnd,
      business_hours_timezone: bhTimezone,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', company.companyId);

  if (error) throw new Error('Failed to update AI settings');

  revalidatePath('/app/settings');
}
