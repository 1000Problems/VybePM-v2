import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'vybepm_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getPassword(): string {
  const pw = process.env.VYBEPM_PASSWORD;
  if (!pw) throw new Error('VYBEPM_PASSWORD environment variable is required');
  return pw;
}

function getApiKey(): string {
  const key = process.env.VYBEPM_API_KEY;
  if (!key) throw new Error('VYBEPM_API_KEY environment variable is required');
  return key;
}

// Generate a simple session token from the password
// Not cryptographically ideal but sufficient for a 2-user password gate
function generateSessionToken(password: string): string {
  // Use a deterministic hash so we can validate without storing state
  let hash = 0;
  const str = `vybepm:${password}:session`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `vybepm_${Math.abs(hash).toString(36)}`;
}

export async function validatePassword(password: string): Promise<boolean> {
  return password === getPassword();
}

export async function setSessionCookie(): Promise<void> {
  const token = generateSessionToken(getPassword());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  const expected = generateSessionToken(getPassword());
  return session.value === expected;
}

export function hasValidApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) return false;
  return apiKey === getApiKey();
}

// Middleware-compatible auth check
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // Check API key first (stateless)
  if (hasValidApiKey(request)) return true;

  // Check session cookie
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session) return false;
  const expected = generateSessionToken(getPassword());
  return session.value === expected;
}

// For use in API route handlers — returns 401 response if not authenticated
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
