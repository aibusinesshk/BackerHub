import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tournament } from '@/lib/supabase/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const type = searchParams.get('type');
  const upcoming = searchParams.get('upcoming');

  const supabase = await createClient();

  let query = (supabase.from('tournaments') as any).select('*');

  if (region && region !== 'all') {
    query = query.eq('region', region);
  }
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }
  if (upcoming === 'true') {
    query = query.gte('date', new Date().toISOString());
  }

  const { data, error } = await query.order('date', { ascending: true }) as { data: Tournament[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tournaments: data || [] });
}
