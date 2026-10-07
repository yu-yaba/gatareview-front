import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const publicDir = path.join(process.cwd(), 'public')
if (!existsSync(path.join(publicDir, 'sw.js'))) throw new Error('Run npm run build before npm run e2e:security')
let user = 'A'
createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:39597')
  response.setHeader('Cache-Control', 'no-store')
  if (url.pathname === '/api/auth/session') {
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
