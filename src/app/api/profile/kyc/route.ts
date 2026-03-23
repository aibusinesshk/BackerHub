import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file
const BUCKET = 'kyc-documents';
const REQUIRED_DOCS = ['id-front', 'id-back', 'selfie', 'proof-of-address'] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('kyc_status, kyc_rejection_reason, kyc_approved_at')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      kyc_status: profile?.kyc_status || 'none',
      rejection_reason: profile?.kyc_rejection_reason || null,
      approved_at: profile?.kyc_approved_at || null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already pending or approved
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('kyc_status')
      .eq('id', user.id)
      .single();

    if (profile?.kyc_status === 'pending') {
      return NextResponse.json({ error: 'KYC is already pending review' }, { status: 400 });
    }
    if (profile?.kyc_status === 'approved') {
      return NextResponse.json({ error: 'KYC is already approved' }, { status: 400 });
    }

    const formData = await request.formData();

    // Validate all required documents are present
    for (const docName of REQUIRED_DOCS) {
      const file = formData.get(docName) as File | null;
      if (!file) {
        return NextResponse.json({ error: `Missing document: ${docName}` }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `${docName} is too large (max 5MB)` }, { status: 400 });
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        return NextResponse.json({ error: `${docName} must be an image or PDF` }, { status: 400 });
      }
    }

    const admin = await createAdminClient();

    // Upload all documents
    for (const docName of REQUIRED_DOCS) {
      const file = formData.get(docName) as File;
      const ext = file.type === 'application/pdf' ? 'pdf' : 'webp';
      const filePath = `${user.id}/${docName}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        logger.error(`KYC upload error (${docName})`, uploadError, { route: '/api/profile/kyc', action: 'upload' });
        return NextResponse.json({ error: `Failed to upload ${docName}` }, { status: 500 });
      }
    }

    // Update KYC status to pending
    await (admin.from('profiles') as any)
      .update({
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Trigger AI verification in the background (fire-and-forget)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    fetch(`${baseUrl}/api/ai-kyc/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      },
      body: JSON.stringify({ userId: user.id }),
    }).catch((err) => {
      logger.error('Failed to trigger AI KYC verification', err, {
        route: '/api/profile/kyc',
        action: 'trigger-ai',
        userId: user.id,
      });
    });

    return NextResponse.json({ success: true, kyc_status: 'pending' });
  } catch (err) {
    logger.apiError('/api/profile/kyc', 'POST', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
