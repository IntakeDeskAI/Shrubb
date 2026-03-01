import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'admin-config';
const FILE = 'ai-settings.json';

/**
 * GET /api/admin/ai-settings
 * Load persisted AI / comm provider settings from Supabase Storage.
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});

    const { data, error } = await supabase.storage.from(BUCKET).download(FILE);

    if (error || !data) {
      // No settings saved yet — return empty defaults
      return NextResponse.json({
        configs: null,
        activeProvider: null,
        commConfigs: null,
        googleMapsKey: null,
      });
    }

    const text = await data.text();
    const settings = JSON.parse(text);
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/ai-settings
 * Persist AI / comm provider settings to Supabase Storage.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configs, activeProvider, commConfigs, googleMapsKey } = body;

    if (!configs || !activeProvider) {
      return NextResponse.json(
        { error: 'Missing configs or activeProvider' },
        { status: 400 },
      );
    }

    for (const config of configs) {
      if (!config.provider || !config.model) {
        return NextResponse.json(
          { error: 'Each config must have provider and model' },
          { status: 400 },
        );
      }
    }

    const supabase = await createServiceClient();

    // Ensure bucket exists
    await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});

    const payload = JSON.stringify(
      {
        configs,
        activeProvider,
        commConfigs: commConfigs ?? null,
        googleMapsKey: googleMapsKey ?? null,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    );

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(FILE, payload, { contentType: 'application/json', upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activeProvider,
      message: 'Settings saved successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
