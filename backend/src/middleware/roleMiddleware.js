export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.map(role => role.toUpperCase()).includes(request.user.role)) return response.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}
