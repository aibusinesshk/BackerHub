import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const KYC_BUCKET = 'kyc-documents';
const DOC_NAMES = ['id-front', 'id-back', 'selfie', 'proof-of-address'] as const;

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return null;
  return user;
}

export async function GET() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = await createAdminClient();

    // Get all pending KYC submissions
    const { data: pending } = await (admin.from('profiles') as any)
      .select('id, email, display_name, display_name_zh, avatar_url, role, region, kyc_status, updated_at')
      .eq('kyc_status', 'pending')
      .order('updated_at', { ascending: true });

    // Get recently reviewed (approved/rejected) for history
    const { data: history } = await (admin.from('profiles') as any)
      .select('id, email, display_name, display_name_zh, avatar_url, role, region, kyc_status, updated_at')
      .in('kyc_status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(50);

    // Generate signed URLs for pending submissions
    const pendingWithDocs = await Promise.all(
      (pending || []).map(async (user: any) => {
        const docs: Record<string, string | null> = {};
        for (const docName of DOC_NAMES) {
          // Try webp first, then pdf
          for (const ext of ['webp', 'pdf']) {
            const filePath = `${user.id}/${docName}.${ext}`;
            const { data } = await admin.storage
              .from(KYC_BUCKET)
              .createSignedUrl(filePath, 600); // 10 min expiry
            if (data?.signedUrl) {
              docs[docName] = data.signedUrl;
              break;
            }
          }
          if (!docs[docName]) docs[docName] = null;
        }
        return { ...user, docs };
      })
    );

    return NextResponse.json({ pending: pendingWithDocs, history: history || [] });
  } catch (err) {
    console.error('Admin KYC GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const admin = await createAdminClient();

    if (action === 'approve') {
      await (admin.from('profiles') as any)
        .update({
          kyc_status: 'approved',
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      await (admin.from('profiles') as any)
        .update({
          kyc_status: 'rejected',
          is_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error('Admin KYC POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
