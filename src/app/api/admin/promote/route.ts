import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/promote
 * Promotes the currently logged-in user to admin.
 * Only works if there are NO existing admins in the system (first-admin setup).
 * After the first admin is created, this endpoint is disabled.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await createAdminClient();

    // Check if any admin already exists
    const { count } = await (admin.from('profiles') as any)
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'An admin already exists. Contact the existing admin to be promoted.' },
        { status: 403 }
      );
    }

    // Promote this user to admin
    const { error: updateError } = await (admin.from('profiles') as any)
      .update({ is_admin: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'You are now an admin.' });
  } catch (err) {
    console.error('Admin promote error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
