import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/test-ai
 *
 * Tests connectivity to an AI provider with the given API key and model.
 */
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Missing provider or apiKey' }, { status: 400 });
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-6',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Say "Connection successful" in exactly those words.' }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return NextResponse.json({ message: data.content[0].text, provider: 'anthropic' });
    }

    // OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "Connection successful" in exactly those words.' }],
        max_tokens: 50,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ message: data.choices[0].message.content, provider: 'openai' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
