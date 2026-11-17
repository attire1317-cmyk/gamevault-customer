const isDev = process.env.NODE_ENV !== 'production';

// Browser may talk to Supabase Realtime (live updates) and nothing else outside this site.
let supabaseConnect = '';
try {
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
  supabaseConnect = ` https://${host} wss://${host}`;
} catch {}

// Content Security Policy. Next.js injects small inline scripts, so 'unsafe-inline'
// is required for script-src unless you add per-request nonces.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseConnect}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['@phosphor-icons/react'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
