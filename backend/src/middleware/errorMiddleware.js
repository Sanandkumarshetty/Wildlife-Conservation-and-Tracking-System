import { logger } from '../utils/logger.js';

export function notFoundMiddleware(request, response) {
  response.status(404).json({ error: `Route not found: ${request.method} ${request.originalUrl}` });
}

export function errorMiddleware(error, request, response, next) {
  logger.error(error.stack || error.message);
  const status = error.statusCode || 500;
  response.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
}
