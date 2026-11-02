import { NextResponse } from 'next/server';

const backend = (process.env.BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function POST(request) {
  let upstream;
  try {
    upstream = await fetch(`${backend}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await request.text(), cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'Cannot reach the WildLife API. Confirm the Express backend is running.' }, { status: 502 });
  }

  const data = await upstream.json().catch(() => null);
  if (!data) return NextResponse.json({ error: 'The Express backend returned an invalid response.' }, { status: 502 });
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  if (!data.user || !data.token) return NextResponse.json({ error: 'The Express backend returned an incomplete registration response.' }, { status: 502 });

  const response = NextResponse.json({ user: data.user }, { status: upstream.status });
  response.cookies.set('wildtrack_token', data.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 3600 });
  return response;
}
