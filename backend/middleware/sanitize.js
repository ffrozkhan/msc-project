// Strip dangerous characters from string inputs to prevent XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') sanitized[key] = sanitizeString(val);
    else if (typeof val === 'object') sanitized[key] = sanitizeObject(val);
    else sanitized[key] = val;
  }
  return sanitized;
};

export const sanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  next();
};