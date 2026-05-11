import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/auth');
  const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next');

  // 1. Jika sudah login dan mencoba akses halaman auth (login/register)
  if (isAuthPage && userId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Jika belum login dan mencoba akses halaman utama atau dashboard
  // Kita lindungi root "/" dan rute "/dashboard"
  if ((pathname === '/' || pathname.startsWith('/dashboard')) && !userId) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

// Atur rute mana saja yang dipantau oleh middleware
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*', 
    '/auth/:path*'
  ],
};