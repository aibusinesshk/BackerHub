import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  const { data: reviews, count, error } = await (supabase
    .from('reviews') as any)
    .select('*', { count: 'exact' })
    .eq('player_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ reviews: [], total: 0 });
  }

  // Fetch reviewer profiles
  const reviewerIds = [...new Set(reviews.map((r: any) => r.reviewer_id))] as string[];
  const { data: reviewers } = await (supabase.from('profiles') as any)
    .select('id, display_name, avatar_url').in('id', reviewerIds);
  const reviewerMap = new Map<string, any>((reviewers || []).map((r: any) => [r.id, r]));

  const joined = reviews.map((r: any) => {
    const reviewer = reviewerMap.get(r.reviewer_id);
    return {
      id: r.id,
      playerId: r.player_id,
      reviewerId: r.reviewer_id,
      reviewerName: reviewer?.display_name || 'Anonymous',
      reviewerAvatar: reviewer?.avatar_url || '',
      rating: r.rating,
      comment: r.comment || '',
      commentZh: r.comment_zh,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json({ reviews: joined, total: count });
}
