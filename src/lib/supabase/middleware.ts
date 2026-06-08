/**
 * @deprecated This middleware is NOT used by the application.
 * The active middleware lives at /src/middleware.ts which handles auth,
 * rate limiting, and security headers (including CSP and Permissions-Policy).
 *
 * This file's `updateSession` export is not imported anywhere.
 * It is kept temporarily to avoid breaking any future references but
 * should be deleted once confirmed safe.
 *
 * SECURITY NOTE: The security headers here diverge from the root middleware —
 * notably missing Content-Security-Policy and using a weaker Permissions-Policy
 * (camera=(self) vs camera=()). Do NOT re-enable this without aligning headers.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)')
  return response
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    // Keep the app responsive in partially configured environments.
    // Route-level logic can still return explicit configuration errors.
    return applySecurityHeaders(NextResponse.next({ request }))
  }

  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseEnvConfigured()) {
    // Allow UI preview deployments to load even when backend env vars are not set.
    return applySecurityHeaders(supabaseResponse)
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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Refresh session - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except auth pages and root)
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isRootPage = request.nextUrl.pathname === "/";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Never redirect API routes to HTML pages. Let route handlers return JSON
  // errors/status codes so webhooks, callbacks, and probes keep working.
  if (isApiRoute) {
    return applySecurityHeaders(supabaseResponse)
  }

  if (!user && !isAuthPage && !isRootPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return applySecurityHeaders(supabaseResponse);
}
