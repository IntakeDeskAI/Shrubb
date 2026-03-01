import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/ai-settings
 *
 * Persists AI provider configuration.
 * In production, this would write to a database table (e.g. admin_settings).
 * For now, it validates and acknowledges the save.
 */
export async function POST(req: NextRequest) {
  try {
    const { configs, activeProvider } = await req.json();

    if (!configs || !activeProvider) {
      return NextResponse.json({ error: 'Missing configs or activeProvider' }, { status: 400 });
    }

    // Validate structure
    for (const config of configs) {
      if (!config.provider || !config.model) {
        return NextResponse.json({ error: 'Each config must have provider and model' }, { status: 400 });
      }
    }

    // TODO: Persist to database
    // await supabase.from('admin_settings').upsert({
    //   key: 'ai_providers',
    //   value: JSON.stringify({ configs, activeProvider }),
    // });

    return NextResponse.json({
      success: true,
      activeProvider,
      message: 'AI settings saved successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
