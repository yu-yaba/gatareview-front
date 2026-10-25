import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createContentSecurityPolicy } = require('../../config/content-security-policy.cjs')

const publicDir = path.join(process.cwd(), 'public')
if (!existsSync(path.join(publicDir, 'sw.js'))) throw new Error('Run npm run build before npm run e2e:security')
let user = 'A'
createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:39597')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Security-Policy', createContentSecurityPolicy({ apiBaseUrl: 'http://127.0.0.1:39597' }))
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
}).listen(39597, '127.0.0.1')
