import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['general', 'backing', 'selling', 'payment', 'account', 'partnership']).optional().default('general'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long (max 5000 characters)'),
});

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
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: msg || 'Invalid input' }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const admin = await createAdminClient();

    const { error } = await (admin.from('contact_submissions') as any).insert({
      name,
      email,
      subject,
      message,
      ip_address: ip,
      status: 'new',
    });

    if (error) {
      logger.warn('Contact submission table insert failed, using fallback', {
        route: '/api/contact',
        action: 'insert',
        errorMessage: error.message,
      });

      // Fallback: create a notification for admin users
      await (admin.from('notifications') as any).insert({
        user_id: null,
        type: 'contact_form',
        title: `Contact: ${subject} from ${name}`,
        title_zh: `聯繫: ${subject} 來自 ${name}`,
        message: `${email}: ${message.slice(0, 200)}`,
        message_zh: `${email}: ${message.slice(0, 200)}`,
      }).then(() => {}).catch(() => {});
    }

    logger.info('Contact form submitted', { route: '/api/contact', action: 'submit', subject });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.apiError('/api/contact', 'POST', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
