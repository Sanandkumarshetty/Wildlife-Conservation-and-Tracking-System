export function requireRegion(request, response, next) {
  const requestedRegion = request.params.region || request.query.region || request.body?.region;
  if (requestedRegion && request.user?.role !== 'admin' && request.user?.region !== requestedRegion) {
    return response.status(403).json({ error: 'Access is restricted to your region' });
  }
  next();
}
