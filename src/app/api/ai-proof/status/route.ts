import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// GET /api/ai-proof/status?listingId=xxx&proofType=buyin|prize
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get('listingId');
    const proofType = request.nextUrl.searchParams.get('proofType');

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin.from('ai_proof_verifications') as any)
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (proofType) {
      query = query.eq('proof_type', proofType);
    }

    const { data: verifications } = await query.limit(1).single();

    return NextResponse.json({ verification: verifications || null });
  } catch (err) {
    logger.apiError('/api/ai-proof/status', 'GET', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
