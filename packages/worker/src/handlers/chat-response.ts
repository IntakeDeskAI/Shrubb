import { type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { checkSpendingCap, incrementSpending } from '../lib/spending-guard.js';
import { trackUsage, estimateCost } from '../lib/usage-tracker.js';

const MODEL = 'gpt-4o';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Chat response handler
// Generates a conversational assistant reply within project context.
// ---------------------------------------------------------------------------
export async function handleChatResponse(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown>> {
  const projectId = payload.project_id as string;
  const messageId = payload.message_id as string;

  // 1. Load project context
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('name, address, preferences, climate_zone')
    .eq('id', projectId)
    .single();

  if (projErr || !project) {
    throw new Error(`Failed to load project ${projectId}: ${projErr?.message}`);
  }

  // Load latest planner_json from design_runs
  const { data: latestRun } = await supabase
    .from('design_runs')
    .select('planner_json')
    .eq('project_id', projectId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const plannerJson = latestRun?.planner_json ?? null;

  // 2. Load message history (last 20 messages)
  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (msgErr) {
    console.warn(`[chat] Failed to load messages: ${msgErr.message}`);
  }

  // 3. Check spending cap
  const estimatedCostUsd = estimateCost(3000, 1500, MODEL);
  const estimatedCostCents = Math.ceil(estimatedCostUsd * 100);

  const withinCap = await checkSpendingCap(supabase, userId, estimatedCostCents);
  if (!withinCap) {
    throw new Error('Spending cap exceeded. Please upgrade your plan or add funds.');
  }

  // 4. Build messages for GPT-4o
  const preferences = project.preferences ?? {};

  const systemPrompt = `You are a friendly, knowledgeable landscape design assistant for the project "${project.name}".

Project context:
- Address: ${project.address ?? 'Not provided'}
- Climate zone: ${project.climate_zone ?? 'Unknown'}
- Style preference: ${(preferences as Record<string, unknown>).style ?? 'Not specified'}
- Budget: ${(preferences as Record<string, unknown>).budget ?? 'Not specified'}
- Maintenance level: ${(preferences as Record<string, unknown>).maintenance_level ?? 'Not specified'}

${plannerJson ? `Current landscape plan summary:\n${JSON.stringify(plannerJson, null, 2).slice(0, 3000)}` : 'No landscape plan has been generated yet.'}

Guidelines:
- Be helpful and conversational, drawing on the project context above.
- If the user asks about plants, refer to their climate zone and preferences.
- If the user wants visual changes, note that they can request a rerender.
- Keep responses concise but informative.
- Do not make up information about the user's specific property — use the data provided.`;

  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of messages ?? []) {
    const role = msg.role === 'assistant' ? 'assistant' as const : 'user' as const;
    chatMessages.push({ role, content: msg.content });
  }

  // 5. Call GPT-4o
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const usage = completion.usage;
  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const assistantContent = completion.choices[0]?.message?.content ?? '';

  // 6. Insert assistant message
  const { data: newMsg, error: insertErr } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: 'assistant',
      content: assistantContent,
      channel: 'web',
    })
    .select('id')
    .single();

  if (insertErr || !newMsg) {
    throw new Error(`Failed to insert assistant message: ${insertErr?.message}`);
  }

  // 7. Track usage
  const actualCost = estimateCost(tokensIn, tokensOut, MODEL);
  await trackUsage(supabase, {
    user_id: userId,
    project_id: projectId,
    message_id: messageId,
    run_type: 'chat',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    image_count: 0,
    estimated_cost_usd: actualCost,
    provider: 'openai',
    model: MODEL,
  });

  // 8. Increment spending
  await incrementSpending(supabase, userId, Math.ceil(actualCost * 100));

  console.log(`[chat] project ${projectId} — reply ${newMsg.id} (${tokensIn}/${tokensOut} tokens)`);

  return { message_id: newMsg.id };
}
