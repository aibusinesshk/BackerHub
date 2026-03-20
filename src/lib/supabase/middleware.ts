import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DEMO_SESSION_KEY = 'backerhub-demo-session';
const LOCALE_REGEX = /^\/(en|zh-TW)/;

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url.startsWith('http') && !url.includes('placeholder');
};

const isDevelopment = () => process.env.NODE_ENV === 'development';

function extractLocale(pathname: string): string {
  const match = pathname.match(LOCALE_REGEX);
  return match ? match[1] : 'en';
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const locale = extractLocale(pathname);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/login`;
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard', '/create-listing', '/checkout', '/submit-result', '/profile'];
  const isProtected = protectedPaths.some((path) => pathname.includes(path));

  // When Supabase is not configured, use demo auth cookie (dev only)
  if (!isSupabaseConfigured() && isDevelopment()) {
    if (isProtected) {
      const demoSession = request.cookies.get(DEMO_SESSION_KEY);
      if (!demoSession?.value) {
        return redirectToLogin(request, pathname);
      }
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for keeping auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    return redirectToLogin(request, pathname);
  }

  return supabaseResponse;
}
