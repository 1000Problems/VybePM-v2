import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.endsWith('.ico') || pathname.endsWith('.svg');
}

function getPassword(): string {
  return process.env.VYBEPM_PASSWORD || '';
}

function getApiKey(): string {
  return process.env.VYBEPM_API_KEY || '';
}

function generateSessionToken(password: string): string {
  let hash = 0;
  const str = `vybepm:${password}:session`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `vybepm_${Math.abs(hash).toString(36)}`;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check API key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey && apiKey === getApiKey()) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('vybepm_session');
  const expected = generateSessionToken(getPassword());
  if (session && session.value === expected) {
    return NextResponse.next();
  }

  // API routes get 401, pages get redirected to login
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
