import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/seed-accounts
 * Creates predefined admin and test accounts for development.
 */
export async function POST() {
  try {
    const admin = await createAdminClient();
    const now = new Date().toISOString();
    const results: Array<{ account: string; status: string; userId?: string; error?: string }> = [];

    const accounts = [
      {
        email: 'admin@backerhub.com',
        password: '123456',
        displayName: 'Admin',
        isAdmin: true,
      },
      {
        email: 'test@backerhub.com',
        password: '123456',
        displayName: 'Test User',
        isAdmin: false,
      },
    ];

    for (const acc of accounts) {
      try {
        // Try to create user
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: {
            display_name: acc.displayName,
            role: 'both',
            region: 'HK',
          },
        });

        let userId: string;

        if (authError) {
          // User may already exist — find and update
          if (authError.message?.includes('already') || authError.message?.includes('exists')) {
            const { data: listData } = await admin.auth.admin.listUsers();
            const existing = listData?.users?.find((u: { email?: string }) => u.email === acc.email);
            if (existing) {
              await admin.auth.admin.updateUserById(existing.id, {
                password: acc.password,
                email_confirm: true,
              });
              userId = existing.id;
            } else {
              results.push({ account: acc.displayName, status: 'error', error: authError.message });
              continue;
            }
          } else {
            results.push({ account: acc.displayName, status: 'error', error: authError.message });
            continue;
          }
        } else {
          userId = authData.user.id;
        }

        // Upsert profile
        await admin.from('profiles').upsert({
          id: userId,
          email: acc.email,
          display_name: acc.displayName,
          role: 'both',
          region: 'HK',
          is_admin: acc.isAdmin,
          is_verified: acc.isAdmin,
          kyc_status: acc.isAdmin ? 'approved' : 'none',
          member_since: now,
          created_at: now,
          updated_at: now,
        }, { onConflict: 'id' });

        // If admin, also update is_admin (in case upsert didn't apply it)
        if (acc.isAdmin) {
          await (admin.from('profiles') as any)
            .update({ is_admin: true, is_verified: true, kyc_status: 'approved' })
            .eq('id', userId);
        }

        results.push({
          account: acc.displayName,
          status: 'created',
          userId,
        });
      } catch (err) {
        results.push({
          account: acc.displayName,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      accounts: results,
      loginInfo: [
        { email: 'admin@backerhub.com', password: '123456', role: 'Admin' },
        { email: 'test@backerhub.com', password: '123456', role: 'Test User' },
      ],
    });
  } catch (err) {
    logger.apiError('/api/seed-accounts', 'POST', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
