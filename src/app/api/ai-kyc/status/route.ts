import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow admins to query any user, regular users can only see their own
    const targetUserId = request.nextUrl.searchParams.get('userId') || user.id;

    if (targetUserId !== user.id) {
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const admin = await createAdminClient();

    // Get the latest AI verification for this user
    const { data: verification } = await (admin.from('ai_kyc_verifications') as any)
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return NextResponse.json({ verification: null });
    }

    return NextResponse.json({ verification });
  } catch (err) {
    logger.apiError('/api/ai-kyc/status', 'GET', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
