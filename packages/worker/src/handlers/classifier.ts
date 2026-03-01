import { type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { checkSpendingCap, incrementSpending } from '../lib/spending-guard.js';
import { trackUsage, estimateCost } from '../lib/usage-tracker.js';

const MODEL = 'gpt-4o-mini';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Classifier handler
// Classifies a chat message intent as 'text_only' or 'rerender'.
// ---------------------------------------------------------------------------
export async function handleClassifier(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  userId: string,
  companyId: string,
): Promise<Record<string, unknown>> {
  const messageId = payload.message_id as string;
  const projectId = payload.project_id as string;
  const content = payload.content as string;

  // 1. Check spending cap (company-scoped)
  const estimatedCostUsd = estimateCost(200, 50, MODEL);
  const estimatedCostCents = Math.ceil(estimatedCostUsd * 100);

  const withinCap = await checkSpendingCap(supabase, companyId, estimatedCostCents);
  if (!withinCap) {
    throw new Error('Spending cap exceeded. Please upgrade your plan or add funds.');
  }

  // 2. Call GPT-4o-mini for intent classification
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for a landscape design chat assistant.
Classify the user's message into exactly one of these intents:
- "text_only" — the user is asking a question, giving feedback, or chatting about the design
- "rerender" — the user is requesting a new visual render, asking to see changes visually, or wants updated concept images

Respond with ONLY the intent string, nothing else.`,
      },
      { role: 'user', content },
    ],
    temperature: 0,
    max_tokens: 20,
  });

  const usage = completion.usage;
  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const rawIntent = (completion.choices[0]?.message?.content ?? 'text_only').trim().toLowerCase();

  // Normalize to valid values
  const intent = rawIntent === 'rerender' ? 'rerender' : 'text_only';

  // 3. Update the message with classified intent
  const { error: updateErr } = await supabase
    .from('messages')
    .update({ intent })
    .eq('id', messageId);

  if (updateErr) {
    console.warn(`[classifier] Failed to update message intent: ${updateErr.message}`);
  }

  // 4. Track usage (company-scoped)
  const actualCost = estimateCost(tokensIn, tokensOut, MODEL);
  await trackUsage(supabase, {
    user_id: userId,
    company_id: companyId,
    project_id: projectId,
    message_id: messageId,
    run_type: 'classify',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    image_count: 0,
    estimated_cost_usd: actualCost,
    provider: 'openai',
    model: MODEL,
  });

  // 5. Increment spending (company-scoped)
  await incrementSpending(supabase, companyId, Math.ceil(actualCost * 100));

  console.log(`[classifier] message ${messageId} intent=${intent}`);

  return { intent };
}
