'use client';

import { useState } from 'react';

interface AiProviderConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  enabled: boolean;
}

interface CommProviderConfig {
  provider: 'bland' | 'twilio';
  enabled: boolean;
  fields: Record<string, string>;
}

const DEFAULT_CONFIGS: AiProviderConfig[] = [
  { provider: 'openai', apiKey: '', model: 'gpt-4o', enabled: false },
  { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-6', enabled: false },
];

const AVAILABLE_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini'],
  anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
};

const DEFAULT_COMM_CONFIGS: CommProviderConfig[] = [
  {
    provider: 'bland',
    enabled: false,
    fields: { apiKey: '', webhookSecret: '' },
  },
  {
    provider: 'twilio',
    enabled: false,
    fields: { accountSid: '', authToken: '', webhookSecret: '', phoneNumber: '' },
  },
];

const WEBHOOK_URLS = {
  bland: 'https://shrubb.com/api/webhooks/bland',
  twilio: {
    sms: 'https://shrubb.com/api/webhooks/twilio',
    smsAdvanced: 'https://shrubb.com/api/webhooks/twilio/sms',
    voice: 'https://shrubb.com/api/webhooks/twilio/voice',
    voiceStatus: 'https://shrubb.com/api/webhooks/twilio/voice-status',
  },
};

export default function AiSettingsPage() {
  const [configs, setConfigs] = useState<AiProviderConfig[]>(DEFAULT_CONFIGS);
  const [commConfigs, setCommConfigs] = useState<CommProviderConfig[]>(DEFAULT_COMM_CONFIGS);
  const [activeProvider, setActiveProvider] = useState<'openai' | 'anthropic'>('openai');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  function updateConfig(provider: string, updates: Partial<AiProviderConfig>) {
    setConfigs((prev) =>
      prev.map((c) => (c.provider === provider ? { ...c, ...updates } : c)),
    );
  }

  function updateCommConfig(provider: string, field: string, value: string) {
    setCommConfigs((prev) =>
      prev.map((c) =>
        c.provider === provider
          ? { ...c, fields: { ...c.fields, [field]: value } }
          : c,
      ),
    );
  }

  function toggleCommProvider(provider: string, enabled: boolean) {
    setCommConfigs((prev) =>
      prev.map((c) => (c.provider === provider ? { ...c, enabled } : c)),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs, activeProvider, commConfigs }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setTestResult('Settings saved successfully.');
    } catch {
      setTestResult('Error saving settings. Check console.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(provider: string) {
    const config = configs.find((c) => c.provider === provider);
    if (!config?.apiKey) {
      setTestResult('Please enter an API key first.');
      return;
    }
    setTesting(provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: config.apiKey, model: config.model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test failed');
      setTestResult(`${provider} connection successful: "${data.message}"`);
    } catch (err) {
      setTestResult(`${provider} test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTesting(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">AI Provider Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure OpenAI and Anthropic API keys for automated content generation. Content can be
        generated for blog posts, GEO pages, and comparison pages.
      </p>

      {/* Active provider selector */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">Active Provider for Content Generation</h2>
        <div className="mt-3 flex gap-3">
          {(['openai', 'anthropic'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className={`flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition ${
                activeProvider === p
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${activeProvider === p ? 'bg-brand-500' : 'bg-gray-300'}`} />
              {p === 'openai' ? 'OpenAI' : 'Anthropic (Claude)'}
            </button>
          ))}
        </div>
      </div>

      {/* Provider configs */}
      <div className="mt-8 space-y-6">
        {configs.map((config) => (
          <div
            key={config.provider}
            className={`rounded-lg border bg-white p-6 ${
              activeProvider === config.provider ? 'border-brand-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {config.provider === 'openai' ? 'OpenAI' : 'Anthropic (Claude)'}
              </h3>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateConfig(config.provider, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Enabled
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateConfig(config.provider, { apiKey: e.target.value })}
                  placeholder={config.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfig(config.provider, { model: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {AVAILABLE_MODELS[config.provider].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => handleTest(config.provider)}
                disabled={testing === config.provider || !config.apiKey}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {testing === config.provider ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`mt-4 rounded-lg border p-4 text-sm ${
          testResult.includes('success') || testResult.includes('saved')
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {testResult}
        </div>
      )}

      {/* ═══════════ COMMUNICATION PROVIDERS ═══════════ */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Communication Providers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure Bland.ai (voice) and Twilio (SMS &amp; voice) for lead capture and automated responses.
        </p>

        <div className="mt-6 space-y-6">
          {/* ── Bland.ai ── */}
          {(() => {
            const bland = commConfigs.find((c) => c.provider === 'bland')!;
            return (
              <div className={`rounded-lg border bg-white p-6 ${bland.enabled ? 'border-brand-200' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Bland.ai</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={bland.enabled}
                      onChange={(e) => toggleCommProvider('bland', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Enabled
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                    <input
                      type="password"
                      value={bland.fields.apiKey}
                      onChange={(e) => updateCommConfig('bland', 'apiKey', e.target.value)}
                      placeholder="bland-..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook Secret</label>
                    <input
                      type="password"
                      value={bland.fields.webhookSecret}
                      onChange={(e) => updateCommConfig('bland', 'webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="block flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {WEBHOOK_URLS.bland}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(WEBHOOK_URLS.bland)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Add this URL in your Bland.ai dashboard under webhook settings.</p>
                </div>
              </div>
            );
          })()}

          {/* ── Twilio ── */}
          {(() => {
            const twilio = commConfigs.find((c) => c.provider === 'twilio')!;
            return (
              <div className={`rounded-lg border bg-white p-6 ${twilio.enabled ? 'border-brand-200' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Twilio</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={twilio.enabled}
                      onChange={(e) => toggleCommProvider('twilio', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Enabled
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account SID</label>
                    <input
                      type="text"
                      value={twilio.fields.accountSid}
                      onChange={(e) => updateCommConfig('twilio', 'accountSid', e.target.value)}
                      placeholder="AC..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Auth Token</label>
                    <input
                      type="password"
                      value={twilio.fields.authToken}
                      onChange={(e) => updateCommConfig('twilio', 'authToken', e.target.value)}
                      placeholder="Auth token..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook Secret</label>
                    <input
                      type="password"
                      value={twilio.fields.webhookSecret}
                      onChange={(e) => updateCommConfig('twilio', 'webhookSecret', e.target.value)}
                      placeholder="Token for webhook verification..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="text"
                      value={twilio.fields.phoneNumber}
                      onChange={(e) => updateCommConfig('twilio', 'phoneNumber', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Webhook URLs</label>
                  <div className="mt-2 space-y-2">
                    {([
                      ['SMS', WEBHOOK_URLS.twilio.sms],
                      ['SMS (Advanced)', WEBHOOK_URLS.twilio.smsAdvanced],
                      ['Voice', WEBHOOK_URLS.twilio.voice],
                      ['Voice Status', WEBHOOK_URLS.twilio.voiceStatus],
                    ] as const).map(([label, url]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-28 shrink-0 text-xs font-medium text-gray-500">{label}</span>
                        <code className="block flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                          {url}
                        </code>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(url)}
                          className="rounded border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-50"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Add these URLs in your Twilio phone number configuration.</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══════════ THIRD-PARTY API KEYS ═══════════ */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Third-Party API Keys</h2>
        <p className="mt-1 text-sm text-gray-500">
          Keys for external services used across the app.
        </p>
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Google Maps / Places</h3>
          <p className="mt-1 text-xs text-gray-500">Used for address autocomplete on client and project forms.</p>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <input
              type="password"
              placeholder="AIza..."
              className="mt-1 w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Set as <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</code> in your environment variables.
              Enable the <strong>Places API (New)</strong> in Google Cloud Console.
            </p>
          </div>
        </div>
      </div>

      {/* Content generation config */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Content Generation Templates</h3>
        <p className="mt-1 text-sm text-gray-500">
          System prompts used when generating content with the active AI provider.
        </p>
        <div className="mt-4 space-y-4">
          {[
            { label: 'Blog Post System Prompt', placeholder: 'You are an expert content writer for the landscaping industry. Write SEO-optimized blog posts that are genuinely useful for landscaping business owners...' },
            { label: 'GEO Page System Prompt', placeholder: 'You are a local SEO specialist for landscaping companies. Generate city-specific landing page content with accurate USDA zone data, local plant recommendations...' },
            { label: 'Comparison Page System Prompt', placeholder: 'You are a product marketing writer for Shrubb, an AI proposal tool for landscapers. Write fair, honest comparison pages that highlight Shrubb advantages...' },
          ].map((tmpl) => (
            <div key={tmpl.label}>
              <label className="block text-sm font-medium text-gray-700">{tmpl.label}</label>
              <textarea
                rows={3}
                placeholder={tmpl.placeholder}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
