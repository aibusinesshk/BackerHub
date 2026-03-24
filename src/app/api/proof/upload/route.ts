import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILES = 3;
const BUCKET = 'proof-documents';

// POST — Upload proof screenshot(s) for a listing
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const listingId = formData.get('listingId') as string;
  const proofType = formData.get('proofType') as string; // 'buyin' | 'prize'

  if (!listingId || !proofType || !['buyin', 'prize'].includes(proofType)) {
    return NextResponse.json({ error: 'listingId and proofType (buyin|prize) are required' }, { status: 400 });
  }

  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === 'files' && value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
  }

  // Validate files
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${file.name}" exceeds 5MB limit` }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File "${file.name}" has unsupported type. Use JPEG, PNG, WebP, or GIF.` }, { status: 400 });
    }
  }

  const admin = await createAdminClient();

  // Verify listing exists and belongs to this user
  const { data: listing } = await admin
    .from('listings')
    .select('id, player_id, status')
    .eq('id', listingId)
    .single();

  if (!listing || listing.player_id !== user.id) {
    return NextResponse.json({ error: 'Listing not found or not yours' }, { status: 404 });
  }

  // Upload files to storage
  const uploadedPaths: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
    const path = `${user.id}/${listingId}/${proofType}-${timestamp}-${i}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload "${file.name}": ${uploadError.message}` }, { status: 500 });
    }

    uploadedPaths.push(path);
  }

  // Store paths on the appropriate record
  if (proofType === 'buyin') {
    await admin
      .from('listings')
      .update({ registration_proof_image_paths: uploadedPaths })
      .eq('id', listingId);
  } else {
    // For prize proof, update tournament_results if it exists
    await admin
      .from('tournament_results')
      .update({ proof_image_paths: uploadedPaths })
      .eq('listing_id', listingId)
      .eq('player_id', user.id);
  }

  return NextResponse.json({ paths: uploadedPaths });
}
