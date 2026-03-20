import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DEMO_SESSION_KEY = 'backerhub-demo-session';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url.startsWith('http') && !url.includes('placeholder');
};

const isDevelopment = () => process.env.NODE_ENV === 'development';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard', '/create-listing', '/checkout'];
  const isProtected = protectedPaths.some((path) => pathname.includes(path));

  // When Supabase is not configured, use demo auth cookie (dev only)
  if (!isSupabaseConfigured() && isDevelopment()) {
    if (isProtected) {
      const demoSession = request.cookies.get(DEMO_SESSION_KEY);
      if (!demoSession?.value) {
        const localeMatch = pathname.match(/^\/(en|zh-TW)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
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
    const localeMatch = pathname.match(/^\/(en|zh-TW)/);
    const locale = localeMatch ? localeMatch[1] : 'en';
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
