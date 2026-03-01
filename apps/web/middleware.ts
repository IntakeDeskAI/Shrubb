import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected app routes
  if (!user && path.startsWith('/app')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (unless they have a redirect param)
  if (user && (path === '/login' || path === '/signup')) {
    const redirect = request.nextUrl.searchParams.get('redirect');
    const url = request.nextUrl.clone();
    url.pathname = redirect || '/app';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // For authenticated users hitting /app routes (except onboarding), check company membership
  if (user && path.startsWith('/app') && !path.startsWith('/app/onboarding')) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .limit(1)
      .maybeSingle();

    if (!membership) {
      const url = request.nextUrl.clone();
      url.pathname = '/app/onboarding';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/app/:path*', '/login', '/signup', '/admin/:path*', '/start/:path*'],
};
