'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveCompany } from '@/lib/company';
import { revalidatePath } from 'next/cache';

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const name = (formData.get('client_name') as string)?.trim();
  if (!name) throw new Error('Client name is required');

  const { error } = await supabase.from('clients').insert({
    company_id: company.companyId,
    name,
    email: (formData.get('client_email') as string)?.trim() || null,
    phone: (formData.get('client_phone') as string)?.trim() || null,
    address: (formData.get('client_address') as string)?.trim() || null,
    status: 'lead',
  });

  if (error) throw new Error('Failed to create client: ' + error.message);

  revalidatePath('/app/clients');
}

export async function updateClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const company = await getActiveCompany(supabase, user.id);
  if (!company) throw new Error('No company found');

  const clientId = formData.get('client_id') as string;

  const { error } = await supabase
    .from('clients')
    .update({
      name: (formData.get('client_name') as string)?.trim() || undefined,
      email: (formData.get('client_email') as string)?.trim() || null,
      phone: (formData.get('client_phone') as string)?.trim() || null,
      address: (formData.get('client_address') as string)?.trim() || null,
      notes: (formData.get('client_notes') as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)
    .eq('company_id', company.companyId);

  if (error) throw new Error('Failed to update client');

  revalidatePath(`/app/clients/${clientId}`);
}
