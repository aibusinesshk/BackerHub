import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success: rlOk } = rateLimit(`contact:${ip}`, { limit: 3, windowSeconds: 300 });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
  }

  try {
    const admin = await createAdminClient();

    // Store in a contact_submissions table (we'll create it via migration)
    // For now, store as a notification to the admin
    const { error } = await (admin.from('contact_submissions') as any).insert({
      name,
      email,
      subject: subject || 'general',
      message,
      ip_address: ip,
      status: 'new',
    });

    if (error) {
      // If the table doesn't exist yet, log and still return success
      // so the user gets confirmation — admin can check logs
      console.error('Contact submission error:', error.message);

      // Fallback: create a notification for admin users
      await (admin.from('notifications') as any).insert({
        user_id: null, // Will need admin notification system
        type: 'contact_form',
        title: `Contact: ${subject || 'General'} from ${name}`,
        title_zh: `聯繫: ${subject || '一般'} 來自 ${name}`,
        message: `${email}: ${message.slice(0, 200)}`,
        message_zh: `${email}: ${message.slice(0, 200)}`,
      }).then(() => {}).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
