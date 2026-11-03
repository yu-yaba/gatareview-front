function createContentSecurityPolicy({ production = true, apiBaseUrl = '', sentryDsn = '' } = {}) {
  const apiSources = [];
  if (apiBaseUrl) {
    if (/[\s;]/.test(apiBaseUrl)) throw new Error('Invalid public API URL for CSP');
    const url = new URL(apiBaseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid public API URL for CSP');
    }
    apiSources.push(url.origin);
  }

  const sentrySources = [];
  if (sentryDsn) {
    if (/[\s;]/.test(sentryDsn)) throw new Error('Invalid Sentry DSN for CSP');
    const url = new URL(sentryDsn);
    if (url.protocol !== 'https:' || !/^o\d+\.ingest(?:\.[a-z]+)?\.sentry\.io$/.test(url.hostname) || url.port || url.password) {
      throw new Error('Invalid Sentry DSN for CSP');
    }
    sentrySources.push(`https://${url.hostname}`);
  }

  const directives = {
    'default-src': ["'self'"],
    // Next.js 15 streams inline hydration scripts. Nonces would require dynamic
    // rendering for cached pages; keep this limitation explicit in the docs.
    'script-src': ["'self'", "'unsafe-inline'", ...(!production ? ["'unsafe-eval'"] : []),
      'https://www.googletagmanager.com', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/',
      // Cloudflare injects this existing Web Analytics script at the edge.
      // Its beacon goes to the same-origin /cdn-cgi/rum endpoint.
      'https://static.cloudflareinsights.com'],
    'script-src-attr': ["'none'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com',
      'https://*.google-analytics.com', 'https://*.googletagmanager.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", ...apiSources, ...sentrySources, ...(!production ? ['ws:', 'http://localhost:3001'] : []),
      'https://*.google-analytics.com', 'https://*.analytics.google.com',
      'https://*.googletagmanager.com', 'https://www.google.com/recaptcha/'],
    'frame-src': ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://accounts.google.com'],
    'frame-ancestors': ["'none'"],
  };
  return Object.entries(directives).map(([name, sources]) => `${name} ${[...new Set(sources)].join(' ')}`).join('; ');
}

module.exports = { createContentSecurityPolicy };
