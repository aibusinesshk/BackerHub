import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications — Fetch user's notifications
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: notifications } = await (supabase
    .from('notifications') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const unreadCount = (notifications || []).filter((n: any) => !n.is_read).length;

  return NextResponse.json({
    notifications: (notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      titleZh: n.title_zh,
      message: n.message,
      messageZh: n.message_zh,
      listingId: n.listing_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    })),
    unreadCount,
  });
}

// PUT /api/notifications — Mark notifications as read
export async function PUT(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notificationIds, markAllRead } = body;

  if (markAllRead) {
    await (supabase.from('notifications') as any)
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  } else if (notificationIds && Array.isArray(notificationIds)) {
    await (supabase.from('notifications') as any)
      .update({ is_read: true })
      .eq('user_id', user.id)
      .in('id', notificationIds);
  }

  return NextResponse.json({ success: true });
}
