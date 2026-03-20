import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// GET /api/migrate — Check which tables exist
export async function GET() {
  const admin = await createAdminClient();
  const tableChecks = ['listing_packages', 'package_entries'];
  const status: Record<string, boolean> = {};

  for (const table of tableChecks) {
    const { error } = await (admin.from(table) as any).select('id').limit(1);
    status[table] = !error;
  }

  const allExist = Object.values(status).every(Boolean);

  return NextResponse.json({
    tables: status,
    migrationNeeded: !allExist,
    instructions: allExist
      ? 'All tables exist. No migration needed.'
      : 'Run the SQL from supabase/migrations/008_listing_packages.sql in your Supabase SQL Editor, then POST /api/seed to seed data.',
  });
}

// POST /api/migrate — Apply migration 008 via Supabase SQL API
// Protected: requires SEED_SECRET header
export async function POST(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backerhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  // Read the migration SQL file
  const migrationPath = join(process.cwd(), 'supabase/migrations/008_listing_packages.sql');
  let migrationSQL: string;
  try {
    migrationSQL = existsSync(migrationPath)
      ? readFileSync(migrationPath, 'utf-8')
      : '';
  } catch {
    migrationSQL = '';
  }

  if (!migrationSQL) {
    return NextResponse.json({
      error: 'Migration file not found at supabase/migrations/008_listing_packages.sql',
    }, { status: 500 });
  }

  // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS for idempotency
  migrationSQL = migrationSQL.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1');
  // Replace CREATE INDEX with CREATE INDEX IF NOT EXISTS
  migrationSQL = migrationSQL.replace(/CREATE INDEX (\w+)/g, 'CREATE INDEX IF NOT EXISTS $1');

  // Try executing via Supabase's pg-meta SQL endpoint
  // This endpoint is available at {supabase_url}/pg/query on hosted instances
  const endpoints = [
    `${supabaseUrl}/rest/v1/rpc/exec_sql`,
    `${supabaseUrl}/pg/query`,
  ];

  const errors: string[] = [];
  let success = false;

  for (const endpoint of endpoints) {
    try {
      const body = endpoint.includes('exec_sql')
        ? JSON.stringify({ sql: migrationSQL })
        : JSON.stringify({ query: migrationSQL });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body,
      });

      if (res.ok) {
        success = true;
        break;
      }
      const text = await res.text().catch(() => 'Unknown');
      errors.push(`${endpoint}: ${res.status} ${text}`);
    } catch (e: any) {
      errors.push(`${endpoint}: ${e.message}`);
    }
  }

  if (success) {
    return NextResponse.json({
      success: true,
      message: 'Migration 008 (listing_packages + package_entries) applied. Re-seed via DELETE then POST /api/seed.',
    });
  }

  // If auto-apply failed, return the SQL for manual execution
  return NextResponse.json({
    error: 'Could not auto-apply migration. Please run the SQL below in your Supabase SQL Editor (supabase.com → SQL Editor):',
    sql: migrationSQL,
    debugErrors: errors,
  }, { status: 500 });
}
