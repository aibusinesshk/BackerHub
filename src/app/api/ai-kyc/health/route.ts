import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Models to try, in order of preference (newest to oldest).
// This helps find which models the API key has access to.
const MODELS_TO_TRY = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
];

// GET /api/ai-kyc/health — test API key against multiple models
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'ANTHROPIC_API_KEY not set',
    }, { status: 503 });
  }

  const override = process.env.AI_KYC_MODEL;
  const modelsToTest = override ? [override, ...MODELS_TO_TRY] : MODELS_TO_TRY;

  const anthropic = new Anthropic({ apiKey });
  const results: Array<{ model: string; status: string; reply?: string; error?: string }> = [];

  for (const model of modelsToTest) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 32,
        messages: [{ role: 'user', content: 'Reply with just the word "ok".' }],
      });

      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      results.push({ model, status: 'ok', reply: text });
      // Found a working model — no need to test more
      break;
    } catch (err: unknown) {
      const e = err as { status?: number; error?: { error?: { message?: string }; message?: string }; message?: string };
      results.push({
        model,
        status: 'error',
        error: `${e?.status}: ${e?.error?.error?.message || e?.error?.message || e?.message || 'Unknown'}`,
      });
    }
  }

  const working = results.find((r) => r.status === 'ok');

  return NextResponse.json({
    keyPrefix: apiKey.substring(0, 15) + '...',
    workingModel: working?.model || null,
    results,
    hint: working
      ? `Set AI_KYC_MODEL=${working.model} in your env vars`
      : 'No models worked — check your API key at console.anthropic.com',
  }, { status: working ? 200 : 502 });
}
