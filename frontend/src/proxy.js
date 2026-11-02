import { NextResponse } from 'next/server';

const backend = (process.env.BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const roles = ['CITIZEN', 'RANGER', 'RESEARCHER', 'ADMIN'];
const publicPaths = new Set(['/', '/about', '/wildlife', '/species', '/login', '/signup', '/register']);
const routeRoles = [
  [/^\/dashboard$/, roles],
  [/^\/profile$/, roles],
  [/^\/map$/, roles],
  [/^\/sightings$/, roles],
  [/^\/projects$/, roles],
  [/^\/(contact|events|publications|knowledge)$/, roles],
  [/^\/citizen\/(dashboard|reports)$/, ['CITIZEN']],
  [/^\/sightings\/new$/, ['CITIZEN']],
  [/^\/reports\/new$/, ['CITIZEN']],
  [/^\/report$/, ['CITIZEN']],
  [/^\/sighting$/, ['CITIZEN']],
  [/^\/my-reports$/, ['CITIZEN']],
  [/^\/reports\/[^/]+$/, ['CITIZEN', 'RANGER', 'ADMIN']],
  [/^\/ranger\/dashboard$/, ['RANGER']],
  [/^\/ranger\/(reports|investigations)$/, ['RANGER', 'ADMIN']],
  [/^\/ranger\/patrols$/, ['RANGER']],
  [/^\/researcher\/dashboard$/, ['RESEARCHER']],
  [/^\/researcher\/(animals|studies|movements|publications)$/, ['RESEARCHER']],
  [/^\/researcher\/environment$/, ['RESEARCHER', 'RANGER', 'ADMIN']],
  [/^\/admin\/(dashboard|analytics|audit|users|species|regions|reports)$/, ['ADMIN']],
];
const dashboard = { CITIZEN: '/citizen/dashboard', RANGER: '/ranger/dashboard', RESEARCHER: '/researcher/dashboard', ADMIN: '/admin/dashboard' };

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/') || publicPaths.has(pathname)) return NextResponse.next();

  const allowedRoles = routeRoles.find(([pattern]) => pattern.test(pathname))?.[1] || roles;
  const token = request.cookies.get('wildtrack_token')?.value;
  if (!token) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));

  try {
    const response = await fetch(`${backend}/profile`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) {
      const redirect = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
      redirect.cookies.delete('wildtrack_token');
      return redirect;
    }
    const user = await response.json();
    if (!allowedRoles.includes(user.role)) return NextResponse.redirect(new URL(dashboard[user.role] || '/', request.url));
    return NextResponse.next();
  } catch (error) {
    console.error('[route access] Unable to verify session:', error);
    return NextResponse.json({ error: 'Unable to verify your session. Confirm the Express backend is running.' }, { status: 502 });
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'] };
