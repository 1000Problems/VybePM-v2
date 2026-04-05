import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { password } = body;
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  const valid = await validatePassword(password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ success: true });
}
