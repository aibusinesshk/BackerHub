import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Transaction } from '@/lib/supabase/types';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = (supabase
    .from('transactions') as any)
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1) as { data: Transaction[] | null; count: number | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data || [], total: count });
}
