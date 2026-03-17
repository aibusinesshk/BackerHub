import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await (supabase.from('testimonials') as any)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const testimonials = (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    nameZh: t.name_zh,
    role: t.role,
    avatar: t.avatar,
    quote: t.quote,
    quoteZh: t.quote_zh,
    region: t.region,
  }));

  return NextResponse.json({ testimonials });
}
