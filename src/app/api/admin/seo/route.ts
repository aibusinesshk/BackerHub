import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { url, currentTitle, currentDescription } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.error('ANTHROPIC_API_KEY not configured', undefined, {
        route: '/api/admin/seo',
      });
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 },
      );
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are an SEO expert. Analyze the following page and provide optimization suggestions.

Page URL: ${url}
Current Title: ${currentTitle || '(none)'}
Current Description: ${currentDescription || '(none)'}

The website is BackerHub — Asia's premier poker tournament staking platform where backers invest in poker players and share in their tournament winnings. It supports English and Traditional Chinese.

Provide your response as valid JSON with this exact structure:
{
  "suggestedTitle": "an optimized page title (50-60 chars, include primary keyword)",
  "suggestedDescription": "an optimized meta description (150-160 chars, compelling with call-to-action)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2", "specific improvement suggestion 3"]
}

Rules:
- Title should be concise, include the brand name "BackerHub", and primary keyword
- Description should be compelling with a clear value proposition
- Keywords should be relevant long-tail and short-tail terms
- Improvements should be specific and actionable
- Focus on the poker staking / backing niche
- Return ONLY the JSON object, no markdown fences or extra text`;

    const message = await client.messages.create({
      model: process.env.AI_SEO_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response, stripping any markdown fences
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const suggestions = JSON.parse(cleaned);

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error('SEO suggestion generation failed', error instanceof Error ? error : undefined, {
      route: '/api/admin/seo',
    });
    return NextResponse.json(
      { error: 'Failed to generate SEO suggestions' },
      { status: 500 },
    );
  }
}
