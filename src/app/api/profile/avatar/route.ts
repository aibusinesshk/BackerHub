import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const BUCKET = 'avatars';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const admin = await createAdminClient();
    const filePath = `${user.id}/avatar.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Use API proxy URL instead of direct Supabase Storage URL
    // This ensures avatars load regardless of bucket public/private settings
    const avatarUrl = `/api/avatar/${user.id}?t=${Date.now()}`;

    await (admin.from('profiles') as any)
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
