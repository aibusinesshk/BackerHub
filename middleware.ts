import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { updateSession } from './src/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First, handle Supabase session refresh + protected route checks
  const supabaseResponse = await updateSession(request);

  // If Supabase middleware returned a redirect (e.g., to login), use that
  if (supabaseResponse.headers.get('location')) {
    return supabaseResponse;
  }

  // Then apply next-intl locale routing
  const intlResponse = intlMiddleware(request);

  // Copy Supabase cookies (with full options) to the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(en|zh-TW)/:path*'],
};
