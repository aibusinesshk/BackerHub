import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Review } from '@/lib/supabase/types';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { playerId, listingId, rating, comment, commentZh } = body;

  if (!playerId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
  }

  // Ensure reviewer has invested in this player
  const { data: hasInvestment } = await (supabase
    .from('investments') as any)
    .select('id')
    .eq('investor_id', user.id)
    .eq('status', 'confirmed')
    .limit(1) as { data: any[] | null; error: any };

  if (!hasInvestment?.length) {
    return NextResponse.json(
      { error: 'You can only review players you have invested in' },
      { status: 403 }
    );
  }

  const { data: review, error } = await (supabase
    .from('reviews') as any)
    .insert({
      player_id: playerId,
      reviewer_id: user.id,
      listing_id: listingId || null,
      rating,
      comment,
      comment_zh: commentZh,
    })
    .select()
    .single() as { data: Review | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
