import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Simple health check to verify the Anthropic API key and model work.
// GET /api/ai-kyc/health
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'ANTHROPIC_API_KEY not set',
    }, { status: 503 });
  }

  const model = process.env.AI_KYC_MODEL || 'claude-sonnet-4-20250514';

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with just the word "ok".' }],
    });

    const text = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({
      status: 'ok',
      model: response.model,
      keyPrefix: apiKey.substring(0, 15) + '...',
      reply: text,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      httpStatus: err?.status,
      message: err?.error?.error?.message || err?.error?.message || err?.message || 'Unknown error',
      model,
      keyPrefix: apiKey.substring(0, 15) + '...',
    }, { status: 502 });
  }
}
