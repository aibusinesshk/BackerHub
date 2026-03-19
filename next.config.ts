import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHostname = '';
try { if (supabaseUrl) supabaseHostname = new URL(supabaseUrl).hostname; } catch { /* env not set */ }

/* BackerHub v2 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow Supabase Storage images (user-uploaded avatars, KYC docs, etc.)
      ...(supabaseHostname
        ? [{ protocol: 'https' as const, hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
        : []),
      // Fallback: allow any *.supabase.co subdomain for portability
      { protocol: 'https' as const, hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default withNextIntl(nextConfig);
