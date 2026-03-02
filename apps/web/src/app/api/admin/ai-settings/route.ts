import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const SETTINGS_KEY = 'ai_provider_settings';

/**
 * GET /api/admin/ai-settings
 * Load persisted AI / comm provider settings from admin_settings table.
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error('[ai-settings] GET error:', error.message);
      return NextResponse.json({
        configs: null,
        activeProvider: null,
        commConfigs: null,
        googleMapsKey: null,
      });
    }

    if (!data || !data.value) {
      // No settings saved yet — return empty defaults
      return NextResponse.json({
        configs: null,
        activeProvider: null,
        commConfigs: null,
        googleMapsKey: null,
      });
    }

    return NextResponse.json(data.value);
  } catch (err) {
    console.error('[ai-settings] GET unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/ai-settings
 * Persist AI / comm provider settings to admin_settings table.
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

    const payload = {
      configs,
      activeProvider,
      commConfigs: commConfigs ?? null,
      googleMapsKey: googleMapsKey ?? null,
      updatedAt: new Date().toISOString(),
    };

    // Upsert into admin_settings table
    const { error } = await supabase
      .from('admin_settings')
      .upsert(
        {
          key: SETTINGS_KEY,
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );

    if (error) {
      console.error('[ai-settings] POST error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activeProvider,
      message: 'Settings saved successfully.',
    });
  } catch (err) {
    console.error('[ai-settings] POST unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
