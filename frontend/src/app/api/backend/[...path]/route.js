import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const backend = (process.env.BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const forward = async (request, context) => {
  const { path = [] } = await context.params;
  const url = new URL(`${backend}/${path.map(encodeURIComponent).join('/')}`);
  url.search = new URL(request.url).search;
  const token = (await cookies()).get('wildtrack_token')?.value;
  const headers = new Headers();
  for (const name of ['content-type', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token) headers.set('authorization', `Bearer ${token}`);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  try {
    const upstream = await fetch(url, { method: request.method, headers, body: hasBody ? await request.arrayBuffer() : undefined, cache: 'no-store' });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'content-disposition', 'x-content-type-options']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error(`[backend proxy] ${request.method} ${url.pathname} failed:`, error);
    return NextResponse.json({ error: 'Cannot reach the WildLife API. Confirm the Express backend is running.' }, { status: 502 });
  }
};

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
