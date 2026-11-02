export function requireFields(body, fields) {
  const missing = fields.filter((field) => body?.[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

export function parseId(value) {
  if (typeof value !== 'number' && !/^\d+$/.test(String(value))) {
    const error = new Error('ID must be a positive integer');
    error.statusCode = 400;
    throw error;
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    const error = new Error('ID must be a positive integer');
    error.statusCode = 400;
    throw error;
  }
  return id;
}
