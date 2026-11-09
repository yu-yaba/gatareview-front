import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createContentSecurityPolicy } = require('../../config/content-security-policy.cjs')

const port = Number(process.env.PLAYWRIGHT_PWA_PORT || 39597)
const origin = `http://127.0.0.1:${port}`
const publicDir = path.join(process.cwd(), 'public')
if (!existsSync(path.join(publicDir, 'sw.js'))) throw new Error('Run npm run build before npm run e2e:security')
let user = 'A'
// 'legacy' imitates a worker already installed on a visitor's device by an older release:
// it caches navigations and API responses and serves them cache-first.
let worker = 'current'
const legacyWorker = `
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  const cacheName = url.pathname.startsWith('/api/') ? 'api-cache' : event.request.mode === 'navigate' ? 'pages' : null
  if (!cacheName) return
  event.respondWith(caches.open(cacheName).then(async cache => {
    const cached = await cache.match(event.request)
    if (cached) return cached
    const response = await fetch(event.request)
    await cache.put(event.request, response.clone())
    return response
  }))
})
`
createServer((request, response) => {
  const url = new URL(request.url, origin)
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Security-Policy', createContentSecurityPolicy({ apiBaseUrl: origin }))
  if (url.pathname === '/_next/app-build-manifest.json') {
    // Match Next.js/Vercel: this build manifest is internal, not a public asset.
    response.writeHead(404).end('Not found')
  } else if (url.pathname === '/_test/csp-probe') {
    response.setHeader('Content-Type', 'text/html')
    response.end(`<!doctype html><title>CSP probe</title><script>
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.effectiveDirective));
      try { window.eval('window.evalExecuted = true'); } catch { window.evalBlocked = true; }
    </script>`)
  } else if (url.pathname === '/api/auth/session') {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Cache-Control', 'private, no-cache, no-store')
    response.end(JSON.stringify({ user: { name: `test-only-user-${user}` }, backendToken: `test-only-token-${user}` }))
  } else if (url.pathname === '/_test/worker') {
    worker = url.searchParams.get('version') === 'legacy' ? 'legacy' : 'current'
    response.end('ok')
  } else if (url.pathname === '/sw.js' && worker === 'legacy') {
    response.setHeader('Content-Type', 'application/javascript')
    response.end(legacyWorker)
  } else if (url.pathname === '/offline') {
    // Stands in for the statically generated public offline page.
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end('<!doctype html><meta charset="utf-8"><title>Offline</title><h1>オフラインです</h1><p>Dummy offline page</p>')
  } else if (url.pathname === '/_test/user') {
    user = url.searchParams.get('user') === 'B' ? 'B' : 'A'
    response.end('ok')
  } else if (url.pathname.startsWith('/mypage') || url.pathname.startsWith('/lectures/')) {
    response.setHeader('Content-Type', 'text/html')
    response.setHeader('Cache-Control', 'private, no-cache, no-store')
    response.end(`<!doctype html><title>Private dummy page</title><p>test-only-user-${user}</p>`)
  } else if (url.pathname === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end('<!doctype html><title>Isolated PWA security test</title><p>Dummy data only</p>')
  } else {
    const file = path.join(publicDir, path.basename(url.pathname))
    response.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'application/javascript' : 'text/plain')
    response.end(existsSync(file) && statSync(file).isFile() ? readFileSync(file) : '')
  }
}).listen(port, '127.0.0.1')
