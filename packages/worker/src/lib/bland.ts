// ---------------------------------------------------------------------------
// Bland.ai voice call utility
// Initiates outbound AI voice calls via the Bland.ai REST API.
// ---------------------------------------------------------------------------

interface InitiateCallParams {
  phoneNumber: string;    // E.164 format (+1XXXXXXXXXX)
  task: string;           // What the AI should discuss
  projectContext?: string; // Optional project/design context
  maxDuration?: number;   // Max call duration in minutes (default 5)
}

export async function initiateCall(
  params: InitiateCallParams,
): Promise<{ callId: string }> {
  const apiKey = process.env.BLAND_API_KEY;
  const webhookUrl = process.env.BLAND_WEBHOOK_URL;

  if (!apiKey) {
    throw new Error(
      'Missing Bland.ai configuration. Ensure BLAND_API_KEY is set.',
    );
  }

  const url = 'https://api.bland.ai/v1/calls';

  const requestBody = {
    phone_number: params.phoneNumber,
    task: params.task,
    model: 'enhanced',
    language: 'en',
    max_duration: params.maxDuration ?? 5,
    voice: 'nat',
    first_sentence:
      'Hi, this is Shrubb, your AI landscape assistant. ' + params.task,
    wait_for_greeting: true,
    ...(webhookUrl ? { webhook: webhookUrl } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Bland.ai API error (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as { call_id: string };

  return { callId: data.call_id };
}
