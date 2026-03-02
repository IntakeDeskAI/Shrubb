import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createCompanyForUser } from '@/lib/create-company';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  const serviceClient = await createServiceClient();

  // ---- Create Company ----
  if (action === 'create_company') {
    const { company_name, full_name, company_address, company_address_place_id, company_address_formatted, company_address_lat, company_address_lng } = body;
    if (!company_name?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const result = await createCompanyForUser(serviceClient, {
      userId: user.id,
      companyName: company_name,
      fullName: full_name,
      companyAddress: company_address,
      companyAddressPlaceId: company_address_place_id,
      companyAddressFormatted: company_address_formatted,
      companyAddressLat: company_address_lat,
      companyAddressLng: company_address_lng,
      areaCode: body.area_code,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ companyId: result.companyId });
  }

  // ---- Create Client ----
  if (action === 'create_client') {
    const { company_id, client_name, client_email, client_address, client_address_place_id, client_address_formatted, client_address_lat, client_address_lng } = body;
    if (!company_id) {
      return NextResponse.json({ error: 'Missing company' }, { status: 400 });
    }

    if (!client_name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const { error: clientError } = await serviceClient
      .from('clients')
      .insert({
        company_id,
        name: client_name.trim(),
        email: client_email?.trim() || null,
        phone: null,
        address: client_address_formatted?.trim() || client_address?.trim() || null,
        property_place_id: client_address_place_id?.trim() || null,
        property_formatted: client_address_formatted?.trim() || null,
        property_lat: client_address_lat ? parseFloat(client_address_lat) : null,
        property_lng: client_address_lng ? parseFloat(client_address_lng) : null,
        property_address_raw: client_address?.trim() || null,
        status: 'lead',
      });

    if (clientError) {
      return NextResponse.json(
        { error: 'Failed to create client: ' + clientError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
