import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, role, region } = body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    if (role && !['investor', 'player', 'both'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (region && !['TW', 'HK', 'OTHER'].includes(region)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Create user with admin client — auto-confirms email (no verification needed)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: role || 'investor',
        region: region || 'TW',
      },
    });

    if (authError) {
      // Handle duplicate email — confirm existing unconfirmed user and update password
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        // Find the existing user by email
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find((u: { email?: string }) => u.email === email);
        if (existing) {
          // Update password and confirm email
          await admin.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
            user_metadata: {
              display_name: displayName,
              role: role || 'investor',
              region: region || 'TW',
            },
          });
          // Ensure profile exists
          await admin.from('profiles').upsert({
            id: existing.id,
            email,
            display_name: displayName,
            role: role || 'investor',
            region: region || 'TW',
            member_since: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          return NextResponse.json({ success: true, userId: existing.id });
        }
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Ensure profile exists (the DB trigger should create it, but we'll upsert as safety net)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        display_name: displayName,
        role: role || 'investor',
        region: region || 'TW',
        member_since: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error (non-fatal):', profileError.message);
      // Don't fail — the user was created, profile trigger may handle it
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
    });
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
