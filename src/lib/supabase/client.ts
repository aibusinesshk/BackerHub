import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_URL = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function isSupabaseConfigured() {
  return SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('placeholder');
}
