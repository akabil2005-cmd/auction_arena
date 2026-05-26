/**
 * CORS origin matching — supports exact URLs and simple * wildcards in FRONTEND_URL.
 */
function parseAllowedOrigins() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function originMatchesPattern(origin, pattern) {
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(origin);
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = parseAllowedOrigins();
  return allowed.some((pattern) => originMatchesPattern(origin, pattern));
}

module.exports = {
  parseAllowedOrigins,
  isOriginAllowed,
};
