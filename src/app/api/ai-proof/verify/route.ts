import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const PROOF_BUCKET = 'proof-documents';
const DEFAULT_MODEL = 'claude-opus-4-6';
const AUTO_APPROVE_THRESHOLD = 85;
const AUTO_REJECT_THRESHOLD = 30;

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function detectImageType(buffer: Buffer): MediaType {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[8] === 0x57 && buffer[9] === 0x45) return 'image/webp';
  return 'image/webp';
}

const BUYIN_PROMPT = `You are an expert at analyzing tournament registration/buy-in proof screenshots. Analyze the provided screenshot(s) and return a structured JSON assessment.

The screenshot should show evidence that a player has registered for a poker tournament. Look for:
- Tournament name/title
- Buy-in amount
- Registration confirmation
- Player name or username
- Date/time of registration
- Tournament platform/site name

Return ONLY valid JSON (no markdown, no code fences):
{
  "image_quality": <number 0-100>,
  "authenticity": <number 0-100>,
  "extracted_tournament_name": "<tournament name or null>",
  "extracted_buy_in": <number or null>,
  "extracted_player_name": "<player name/username or null>",
  "extracted_date": "<date string or null>",
  "registration_confirmed": <boolean>,
  "overall_score": <number 0-100>,
  "flags": [
    {"code": "<flag_code>", "severity": "<low|medium|high|critical>", "message": "<description>"}
  ],
  "summary": "<2-3 sentence assessment>",
  "recommendation": "<auto_approve|manual_review|auto_reject>"
}

Flag codes: BLURRY_IMAGE, POSSIBLE_TAMPERING, MISSING_INFO, UNREADABLE_TEXT, NO_REGISTRATION_PROOF, MISMATCH_TOURNAMENT, LOW_QUALITY

Scoring: 85-100 → auto_approve, 50-84 → manual_review, 0-49 → auto_reject. When in doubt, recommend manual_review.`;

const PRIZE_PROMPT = `You are an expert at analyzing tournament result/prize proof screenshots. Analyze the provided screenshot(s) and return a structured JSON assessment.

The screenshot should show a poker tournament result. Look for:
- Tournament name
- Final position/placement
- Prize amount won
- Total number of entries
- Player name or username
- Date of tournament

Return ONLY valid JSON (no markdown, no code fences):
{
  "image_quality": <number 0-100>,
  "authenticity": <number 0-100>,
  "extracted_tournament_name": "<tournament name or null>",
  "extracted_prize_amount": <number or null>,
  "extracted_finish_position": <number or null>,
  "extracted_total_entries": <number or null>,
  "extracted_player_name": "<player name/username or null>",
  "extracted_date": "<date string or null>",
  "overall_score": <number 0-100>,
  "flags": [
    {"code": "<flag_code>", "severity": "<low|medium|high|critical>", "message": "<description>"}
  ],
  "summary": "<2-3 sentence assessment>",
  "recommendation": "<auto_approve|manual_review|auto_reject>"
}

Flag codes: BLURRY_IMAGE, POSSIBLE_TAMPERING, MISSING_INFO, UNREADABLE_TEXT, PRIZE_MISMATCH, POSITION_UNCLEAR, LOW_QUALITY

Scoring: 85-100 → auto_approve, 50-84 → manual_review, 0-49 → auto_reject. When in doubt, recommend manual_review.`;

// POST — Trigger AI analysis on uploaded proof images
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Auth: must be the listing owner or admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, proofType } = body;

    if (!listingId || !proofType || !['buyin', 'prize'].includes(proofType)) {
      return NextResponse.json({ error: 'listingId and proofType (buyin|prize) required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const aiModel = process.env.AI_KYC_MODEL || DEFAULT_MODEL;
    const admin = await createAdminClient();

    // Verify listing
    const { data: listing } = await admin
      .from('listings')
      .select('id, player_id, status, registration_proof_image_paths, tournament:tournaments(name, buy_in, date)')
      .eq('id', listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Must be listing owner or admin
    if (listing.player_id !== user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin.from('profiles') as any)
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get image paths
    let imagePaths: string[] = [];
    if (proofType === 'buyin') {
      imagePaths = listing.registration_proof_image_paths || [];
    } else {
      const { data: result } = await admin
        .from('tournament_results')
        .select('proof_image_paths')
        .eq('listing_id', listingId)
        .maybeSingle();
      imagePaths = result?.proof_image_paths || [];
    }

    if (imagePaths.length === 0) {
      return NextResponse.json({ error: 'No proof images uploaded yet' }, { status: 400 });
    }

    // Create pending verification record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: verification, error: insertError } = await (admin.from('ai_proof_verifications') as any)
      .insert({
        listing_id: listingId,
        user_id: listing.player_id,
        proof_type: proofType,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !verification) {
      logger.error('Failed to create AI proof verification record', insertError, { route: '/api/ai-proof/verify' });
      return NextResponse.json({ error: 'Failed to initiate verification' }, { status: 500 });
    }

    // Fetch images from storage
    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];
    const tournament = Array.isArray(listing.tournament) ? listing.tournament[0] : listing.tournament;
    const tournamentInfo = tournament
      ? `Tournament: "${tournament.name}", Buy-in: $${tournament.buy_in}, Date: ${tournament.date}`
      : 'Tournament info not available';

    contentBlocks.push({
      type: 'text',
      text: `Analyze these ${proofType === 'buyin' ? 'registration/buy-in' : 'tournament result'} proof screenshots. ${tournamentInfo}. ${imagePaths.length} image(s) provided.`,
    });

    for (const path of imagePaths) {
      const { data: fileData } = await admin.storage.from(PROOF_BUCKET).download(path);
      if (!fileData) continue;

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mediaType = detectImageType(buffer);

      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
    }

    // Call Claude Vision API
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: aiModel,
      max_tokens: 4096,
      system: proofType === 'buyin' ? BUYIN_PROMPT : PRIZE_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const responseText = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let analysis: any;
    try {
      try {
        analysis = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    } catch (parseErr) {
      logger.error('Failed to parse AI proof response', parseErr, { route: '/api/ai-proof/verify' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('ai_proof_verifications') as any)
        .update({
          status: 'failed',
          error_message: 'Failed to parse AI analysis response',
          model_used: response.model,
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', verification.id);

      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 });
    }

    // Score and recommendation
    const overallScore = Math.min(100, Math.max(0, analysis.overall_score || 0));
    let recommendation = analysis.recommendation || 'manual_review';
    if (overallScore >= AUTO_APPROVE_THRESHOLD && recommendation === 'auto_approve') {
      recommendation = 'auto_approve';
    } else if (overallScore < AUTO_REJECT_THRESHOLD) {
      recommendation = 'auto_reject';
    } else {
      recommendation = 'manual_review';
    }

    // Data consistency check against listing info
    let dataConsistencyScore: number | null = null;
    if (tournament) {
      let matches = 0;
      let checks = 0;

      if (proofType === 'buyin') {
        if (analysis.extracted_buy_in != null) {
          checks++;
          if (Math.abs(analysis.extracted_buy_in - tournament.buy_in) < tournament.buy_in * 0.1) matches++;
        }
        if (analysis.extracted_tournament_name) {
          checks++;
          const extractedLower = analysis.extracted_tournament_name.toLowerCase();
          const tournamentLower = tournament.name.toLowerCase();
          if (extractedLower.includes(tournamentLower) || tournamentLower.includes(extractedLower)) matches++;
        }
      }

      if (checks > 0) {
        dataConsistencyScore = Math.round((matches / checks) * 100);
      }
    }

    const processingTime = Date.now() - startTime;

    // Update verification record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('ai_proof_verifications') as any)
      .update({
        overall_score: overallScore,
        recommendation,
        summary: analysis.summary || null,
        extracted_tournament_name: analysis.extracted_tournament_name || null,
        extracted_buy_in: analysis.extracted_buy_in || null,
        extracted_prize_amount: analysis.extracted_prize_amount || null,
        extracted_finish_position: analysis.extracted_finish_position || null,
        extracted_total_entries: analysis.extracted_total_entries || null,
        extracted_date: analysis.extracted_date || null,
        extracted_player_name: analysis.extracted_player_name || null,
        data_consistency_score: dataConsistencyScore,
        image_analysis: {
          quality: analysis.image_quality || 0,
          authenticity: analysis.authenticity || 0,
        },
        flags: analysis.flags || [],
        status: 'completed',
        model_used: response.model,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', verification.id);

    // Link verification to the record
    if (proofType === 'buyin') {
      await admin
        .from('listings')
        .update({ ai_registration_proof_id: verification.id })
        .eq('id', listingId);
    } else {
      await admin
        .from('tournament_results')
        .update({ ai_proof_verification_id: verification.id })
        .eq('listing_id', listingId);
    }

    return NextResponse.json({
      success: true,
      verification_id: verification.id,
      overall_score: overallScore,
      recommendation,
      summary: analysis.summary,
      data_consistency_score: dataConsistencyScore,
      flags: analysis.flags || [],
      extracted_data: {
        tournament_name: analysis.extracted_tournament_name,
        buy_in: analysis.extracted_buy_in,
        prize_amount: analysis.extracted_prize_amount,
        finish_position: analysis.extracted_finish_position,
        total_entries: analysis.extracted_total_entries,
        player_name: analysis.extracted_player_name,
        date: analysis.extracted_date,
      },
      processing_time_ms: processingTime,
    });
  } catch (err: unknown) {
    logger.apiError('/api/ai-proof/verify', 'POST', err);

    const apiErr = err as { status?: number; error?: { error?: { message?: string }; message?: string }; message?: string };
    if (apiErr?.status) {
      const errMsg = apiErr?.error?.error?.message || apiErr?.error?.message || apiErr?.message || 'Unknown API error';
      return NextResponse.json({
        error: `AI service error (${apiErr.status}): ${errMsg}`,
      }, { status: 502 });
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
