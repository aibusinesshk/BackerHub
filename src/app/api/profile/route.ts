import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Allowlist of editable fields (region is set at signup and cannot be changed)
  const allowedFields = [
    'display_name', 'display_name_zh', 'avatar_url',
    'bio', 'bio_zh', 'color_tone', 'role',
    'hendon_mob_url', 'phone', 'social_twitter', 'social_instagram', 'social_facebook',
  ];
  const updates: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  // Validation
  if (updates.display_name !== undefined && (!updates.display_name || updates.display_name.trim().length === 0)) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
  }
  if (updates.color_tone !== undefined && updates.color_tone !== null && !['red', 'blue', 'emerald', 'purple', 'amber', 'cyan', 'rose', 'gold'].includes(updates.color_tone)) {
    return NextResponse.json({ error: 'Invalid color tone' }, { status: 400 });
  }
  if (updates.role !== undefined && !['investor', 'player', 'both'].includes(updates.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: profile, error } = await (supabase.from('profiles') as any)
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
