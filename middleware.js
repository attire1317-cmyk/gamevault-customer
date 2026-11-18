import { NextResponse } from 'next/server';

// Cheap gate: bounce visitors with no session cookie. The real verification
// (signature, expiry, role) happens server-side in each page and API route.
export function middleware(req) {
  if (!req.cookies.get('gv_session')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/account/:path*', '/profile/:path*'] };
