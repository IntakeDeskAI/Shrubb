import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/generate-content
 *
 * Generates or refreshes SEO content for a given page using the configured AI provider.
 * In production, reads the active provider + API key from the database.
 * For now, supports both OpenAI and Anthropic APIs.
 */
export async function POST(req: NextRequest) {
  try {
    const { type, slug, title } = await req.json();

    if (!type || !slug || !title) {
      return NextResponse.json({ error: 'Missing type, slug, or title' }, { status: 400 });
    }

    // In production, load these from DB/env
    const provider = process.env.AI_CONTENT_PROVIDER || 'openai';
    const apiKey =
      provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Set it in Admin > AI Settings.` },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt(type);
    const userPrompt = buildUserPrompt(type, slug, title);

    let content: string;

    if (provider === 'anthropic') {
      content = await generateWithAnthropic(apiKey, systemPrompt, userPrompt);
    } else {
      content = await generateWithOpenAI(apiKey, systemPrompt, userPrompt);
    }

    return NextResponse.json({ content, provider, slug });
  } catch (err) {
    console.error('Content generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

function buildSystemPrompt(type: string): string {
  switch (type) {
    case 'blog':
      return `You are an expert SEO content writer for the landscaping industry. Write high-quality, genuinely useful blog posts targeting landscaping business owners and design-build teams. Include proper HTML heading tags (h2, h3), paragraphs, and lists. Content should be 800-1500 words and naturally mention Shrubb (AI proposal software for landscapers) where relevant without being salesy.`;
    case 'geo':
      return `You are a local SEO specialist for the landscaping industry. Generate city-specific landing page content with accurate USDA hardiness zone data, locally appropriate plant recommendations, regional landscaping trends, and market insights. Content should feel authentic and locally informed, not generic.`;
    case 'comparison':
      return `You are a product marketing writer for Shrubb, an AI proposal tool for landscaping companies. Write fair, honest comparison content that acknowledges competitor strengths while highlighting Shrubb's unique advantages for landscapers: purpose-built proposals, zone-aware plant lists, client accept tracking, and branded proposal pages.`;
    default:
      return `You are an expert content writer for Shrubb, an AI-powered proposal platform for landscaping companies.`;
  }
}

function buildUserPrompt(type: string, slug: string, title: string): string {
  switch (type) {
    case 'blog':
      return `Write a comprehensive blog post with the title "${title}". Target landscaping business owners searching for "${slug.replace(/-/g, ' ')}". Include practical advice, industry data, and actionable takeaways. Format as HTML with h2 subheadings, paragraphs, and bullet lists where appropriate.`;
    case 'geo':
      return `Write landing page content for landscapers in the city referenced by slug "${slug}". Title: "${title}". Include local USDA zone info, popular native/adapted plants, common landscaping services in the area, typical project sizes, and why Shrubb helps local landscapers win more jobs. Format as HTML.`;
    case 'comparison':
      return `Write comparison page content for "${title}" (slug: ${slug}). Create a detailed feature-by-feature comparison. Be factual about competitor capabilities while highlighting Shrubb advantages for landscaping companies specifically. Format as HTML.`;
    default:
      return `Write content for "${title}".`;
  }
}

async function generateWithOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenAI API error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function generateWithAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Anthropic API error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
