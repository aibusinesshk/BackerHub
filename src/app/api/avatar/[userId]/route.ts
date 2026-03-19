import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'avatars';
const CACHE_SECONDS = 3600; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // Basic UUID format check
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const admin = await createAdminClient();
    const filePath = `${userId}/avatar.webp`;

    const { data, error } = await admin.storage
      .from(BUCKET)
      .download(filePath);

    if (error || !data) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
