import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const KYC_BUCKET = 'kyc-documents';
const DOC_NAMES = ['id-front', 'id-back', 'selfie', 'proof-of-address'] as const;

const AUTO_APPROVE_THRESHOLD = 85;
const AUTO_REJECT_THRESHOLD = 30;

// Use a known-valid model ID. Override with AI_KYC_MODEL env var if needed.
const DEFAULT_MODEL = 'claude-opus-4-6';

const ANALYSIS_PROMPT = `You are an expert KYC (Know Your Customer) document verification analyst. Analyze the provided identity documents and return a structured JSON assessment.

You will receive up to 4 documents:
1. **ID Front** - Front of government-issued ID (passport, national ID, driver's license)
2. **ID Back** - Back of the ID document
3. **Selfie** - Photo of the person holding their ID
4. **Proof of Address** - Utility bill, bank statement, or government letter

For each document, assess:
- **quality** (0-100): Image clarity, readability, completeness
- **authenticity** (0-100): Does it appear genuine (no obvious edits, consistent formatting)?
- **issues**: Array of specific problems found

Additionally:
- Extract personal information visible on the documents
- Assess face match between the ID photo and the selfie
- Check if the proof of address appears recent (within 3 months)

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "id_front_analysis": {
    "quality": <number 0-100>,
    "authenticity": <number 0-100>,
    "doc_type": "<passport|national_id|drivers_license|other>",
    "issues": ["<issue1>", "<issue2>"]
  },
  "id_back_analysis": {
    "quality": <number 0-100>,
    "authenticity": <number 0-100>,
    "issues": ["<issue1>"]
  },
  "selfie_analysis": {
    "quality": <number 0-100>,
    "face_visible": <boolean>,
    "id_visible_in_selfie": <boolean>,
    "issues": ["<issue1>"]
  },
  "address_proof_analysis": {
    "quality": <number 0-100>,
    "authenticity": <number 0-100>,
    "appears_recent": <boolean>,
    "doc_type": "<utility_bill|bank_statement|government_letter|other>",
    "issues": ["<issue1>"]
  },
  "extracted_data": {
    "name": "<full name or null>",
    "id_number": "<partially masked, e.g. ****1234 or null>",
    "date_of_birth": "<YYYY-MM-DD or null>",
    "address": "<address or null>",
    "doc_type": "<passport|national_id|drivers_license>",
    "doc_expiry": "<YYYY-MM-DD or null>"
  },
  "face_match_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "flags": [
    {"code": "<flag_code>", "severity": "<low|medium|high|critical>", "message": "<description>"}
  ],
  "summary": "<2-3 sentence assessment>",
  "recommendation": "<auto_approve|manual_review|auto_reject>"
}

Flag codes to use when applicable:
- BLURRY_DOCUMENT: Document image is blurry or hard to read
- EXPIRED_ID: ID document appears to be expired
- FACE_MISMATCH: Selfie does not match ID photo
- NO_FACE_IN_SELFIE: Cannot detect a face in the selfie
- NO_ID_IN_SELFIE: ID is not visible in the selfie photo
- POSSIBLE_TAMPERING: Signs of digital editing or tampering
- INCOMPLETE_INFO: Key information is missing or unreadable
- OLD_ADDRESS_PROOF: Proof of address appears to be older than 3 months
- MISSING_DOCUMENT: One or more required documents are missing
- LOW_QUALITY: Overall document quality is too low for reliable assessment

Scoring guidelines:
- 85-100: High confidence, documents appear genuine and complete → auto_approve
- 50-84: Moderate confidence, some issues need human review → manual_review
- 0-49: Low confidence, significant issues found → auto_reject

Be thorough but fair. When in doubt, recommend manual_review rather than auto_reject.`;

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

async function fetchDocumentAsBase64(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  docName: string,
): Promise<{ base64: string; mediaType: MediaType } | null> {
  // Try image first (webp extension), skip PDFs (Claude can't process them as images)
  const imagePath = `${userId}/${docName}.webp`;
  const { data } = await admin.storage.from(KYC_BUCKET).download(imagePath);
  if (data) {
    const buffer = Buffer.from(await data.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType: MediaType = detectImageType(buffer);
    return { base64, mediaType };
  }
  // Check if a PDF version exists (for better error messages)
  const pdfPath = `${userId}/${docName}.pdf`;
  const { data: pdfData } = await admin.storage.from(KYC_BUCKET).download(pdfPath);
  if (pdfData) {
    return null;
  }
  return null;
}

function detectImageType(buffer: Buffer): MediaType {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[8] === 0x57 && buffer[9] === 0x45) return 'image/webp';
  return 'image/webp';
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Verify the caller is authorized (admin user OR internal service call)
    const internalToken = request.headers.get('x-service-key');
    const isInternalCall = internalToken === process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isInternalCall) {
      const supabase = await createClient();
      const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
      if (authError || !caller) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: callerProfile } = await (supabase.from('profiles') as any)
        .select('is_admin')
        .eq('id', caller.id)
        .single();
      if (!callerProfile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.error('ANTHROPIC_API_KEY not configured', undefined, { route: '/api/ai-kyc/verify' });
      return NextResponse.json({ error: 'AI verification service not configured' }, { status: 503 });
    }

    const aiModel = process.env.AI_KYC_MODEL || DEFAULT_MODEL;
    logger.info('AI KYC verification starting', {
      route: '/api/ai-kyc/verify',
      model: aiModel,
      keyPrefix: apiKey.substring(0, 12) + '...',
    });

    const admin = await createAdminClient();

    // Verify user exists and has pending KYC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin.from('profiles') as any)
      .select('id, kyc_status, display_name')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (profile.kyc_status !== 'pending') {
      return NextResponse.json({ error: 'KYC is not in pending state' }, { status: 400 });
    }

    // Create a pending verification record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: verification, error: insertError } = await (admin.from('ai_kyc_verifications') as any)
      .insert({
        user_id: userId,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !verification) {
      logger.error('Failed to create AI verification record', insertError, { route: '/api/ai-kyc/verify' });
      return NextResponse.json({ error: 'Failed to initiate verification' }, { status: 500 });
    }

    // Fetch all documents as base64
    const documents: Array<{ name: string; base64: string; mediaType: MediaType }> = [];
    const missingDocs: string[] = [];

    for (const docName of DOC_NAMES) {
      const doc = await fetchDocumentAsBase64(admin, userId, docName);
      if (doc) {
        documents.push({ name: docName, ...doc });
      } else {
        missingDocs.push(docName);
      }
    }

    if (documents.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('ai_kyc_verifications') as any)
        .update({
          status: 'failed',
          error_message: 'No analyzable documents found (all may be PDFs or missing)',
          completed_at: new Date().toISOString(),
        })
        .eq('id', verification.id);

      return NextResponse.json({ error: 'No analyzable image documents found' }, { status: 400 });
    }

    // Build the Claude API message with document images
    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    contentBlocks.push({
      type: 'text',
      text: `Analyze these KYC documents for user "${profile.display_name}". ${missingDocs.length > 0 ? `Note: The following documents are missing or in unsupported format (PDF): ${missingDocs.join(', ')}.` : 'All 4 documents are provided.'}`,
    });

    for (const doc of documents) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- Document: ${doc.name} ---`,
      });
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: doc.mediaType,
          data: doc.base64,
        },
      });
    }

    // Call Claude Vision API
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: aiModel,
      max_tokens: 4096,
      system: ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    });

    // Extract JSON from response
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
      logger.error('Failed to parse AI response', parseErr, {
        route: '/api/ai-kyc/verify',
        action: 'parse',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('ai_kyc_verifications') as any)
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

    // Determine recommendation based on score
    const overallScore = Math.min(100, Math.max(0, analysis.overall_score || 0));
    let recommendation = analysis.recommendation || 'manual_review';
    if (overallScore >= AUTO_APPROVE_THRESHOLD && recommendation === 'auto_approve') {
      recommendation = 'auto_approve';
    } else if (overallScore < AUTO_REJECT_THRESHOLD) {
      recommendation = 'auto_reject';
    } else {
      recommendation = 'manual_review';
    }

    // Add missing document flags
    const flags = analysis.flags || [];
    for (const missing of missingDocs) {
      flags.push({
        code: 'MISSING_DOCUMENT',
        severity: 'high',
        message: `Document "${missing}" was not available for AI analysis (PDF format or missing)`,
      });
    }

    const processingTime = Date.now() - startTime;

    // Update verification record with results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('ai_kyc_verifications') as any)
      .update({
        overall_score: overallScore,
        recommendation,
        summary: analysis.summary || null,
        id_front_analysis: analysis.id_front_analysis || {},
        id_back_analysis: analysis.id_back_analysis || {},
        selfie_analysis: analysis.selfie_analysis || {},
        address_proof_analysis: analysis.address_proof_analysis || {},
        extracted_name: analysis.extracted_data?.name || null,
        extracted_id_number: analysis.extracted_data?.id_number || null,
        extracted_dob: analysis.extracted_data?.date_of_birth || null,
        extracted_address: analysis.extracted_data?.address || null,
        extracted_doc_type: analysis.extracted_data?.doc_type || null,
        extracted_doc_expiry: analysis.extracted_data?.doc_expiry || null,
        face_match_score: analysis.face_match_score ?? null,
        flags,
        status: 'completed',
        model_used: response.model,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', verification.id);

    // Link verification to profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('profiles') as any)
      .update({ ai_kyc_verification_id: verification.id })
      .eq('id', userId);

    logger.info('AI KYC verification completed', {
      route: '/api/ai-kyc/verify',
      userId,
      action: 'complete',
    });

    return NextResponse.json({
      success: true,
      verification_id: verification.id,
      overall_score: overallScore,
      recommendation,
      summary: analysis.summary,
      face_match_score: analysis.face_match_score,
      flags,
      processing_time_ms: processingTime,
    });
  } catch (err: unknown) {
    logger.apiError('/api/ai-kyc/verify', 'POST', err);

    // Anthropic SDK errors — provide actionable info
    const apiErr = err as { status?: number; error?: { error?: { message?: string }; message?: string }; message?: string };
    if (apiErr?.status) {
      const errMsg = apiErr?.error?.error?.message || apiErr?.error?.message || apiErr?.message || 'Unknown API error';
      const model = process.env.AI_KYC_MODEL || DEFAULT_MODEL;
      return NextResponse.json({
        error: `AI service error (${apiErr.status}): ${errMsg}. Model: ${model}`,
      }, { status: 502 });
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
