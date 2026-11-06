// Single source of truth for what counts as a valid *production* API URL.
// Plain CommonJS so it can be required by app.config.js (Node, at build time)
// and imported by src/constants/api.ts (in the app, at runtime).

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i, // IPv6 unique-local
];

/**
 * Returns an error message if `url` is not acceptable for a production build,
 * or null if it is fine.
 * @param {string | undefined | null} url
 * @returns {string | null}
 */
function getProductionApiUrlError(url) {
  if (!url || !String(url).trim()) {
    return 'EXPO_PUBLIC_API_URL is not set. Production builds must point at the deployed API (e.g. https://api.livadra.com).';
  }
  const match = /^([a-z][a-z0-9+.-]*):\/\/(\[[^\]]+\]|[^/:?#]+)/i.exec(String(url).trim());
  if (!match) {
    return `EXPO_PUBLIC_API_URL "${url}" is not a valid absolute URL.`;
  }
  const [, scheme, host] = match;
  if (scheme.toLowerCase() !== 'https') {
    return `EXPO_PUBLIC_API_URL must use https:// in production (got "${scheme}://").`;
  }
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(host))) {
    return `EXPO_PUBLIC_API_URL host "${host}" is a localhost / private-network address and is unreachable for real users.`;
  }
  return null;
}

module.exports = { getProductionApiUrlError };
