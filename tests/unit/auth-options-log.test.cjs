const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { test } = require('node:test')
const ts = require('typescript')

// Exercise the real callbacks without contacting Google or requiring a Next request.
const filename = path.resolve(__dirname, '../../app/_helpers/authOptions.ts')
process.env.NEXTAUTH_SECRET = 'local-auth-callback-test-secret'
process.env.DOCKER_BACKEND_URL = 'http://127.0.0.1:1'
// The incoming sign-in callback request as Vercel's edge would deliver it.
let incomingHeaders = new Headers()
const nextHeaders = { cookies: async () => ({ get: () => undefined }), headers: async () => incomingHeaders }
function loadTypeScript(file, mocks) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const loaded = new Module(file, module)
  loaded.filename = file
  loaded.paths = Module._nodeModulePaths(path.dirname(file))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = id => Object.hasOwn(mocks, id) ? mocks[id] : originalRequire(id)
  loaded._compile(compiled, file)
  return loaded.exports
}
const backendRequest = loadTypeScript(path.resolve(__dirname, '../../app/_helpers/backendRequest.ts'), {
  'server-only': {},
  'next/headers': nextHeaders,
  './clientIpSignature': require('../../app/_helpers/clientIpSignature.ts'),
})
const { authOptions } = loadTypeScript(filename, { 'next/headers': nextHeaders, './backendRequest': backendRequest })

const signInArguments = () => ({
  // NextAuth creates a new defaultToken for an OAuth callback, including account changes.
  token: { name: 'テスト利用者', email: 'local@example.invalid', sub: '102' },
  account: { id_token: 'local-callback-test-token' },
  user: { id: '102' },
})

test('backend authentication failure does not log response bodies', async t => {
  const privateMarker = 'PRIVATE_BACKEND_AUTH_RESPONSE'
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  t.mock.method(globalThis, 'fetch', async () => new Response(
    JSON.stringify({ token: privateMarker, user: { email: privateMarker } }),
    { status: 401 },
  ))

  await authOptions.callbacks.jwt(signInArguments())

  assert.equal(logs.length, 1)
  assert.equal(logs[0][1], 401)
  assert.equal(JSON.stringify(logs).includes(privateMarker), false)
})

test('backend authentication exception does not log request or error contents', async t => {
  const privateMarker = 'PRIVATE_BACKEND_AUTH_EXCEPTION'
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  t.mock.method(globalThis, 'fetch', async () => { throw new Error(privateMarker) })

  await authOptions.callbacks.jwt(signInArguments())

  assert.equal(logs.length, 1)
  assert.equal(logs[0].some(value => value instanceof Error), false)
  assert.equal(JSON.stringify(logs).includes(privateMarker), false)
})

test('failed backend authentication creates no backend identity from a new OAuth token', async t => {
  t.mock.method(console, 'error', () => {})
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }))

  const token = await authOptions.callbacks.jwt(signInArguments())
  const session = await authOptions.callbacks.session({
    token,
    session: { user: { name: 'テスト利用者', email: 'local@example.invalid' } },
  })

  assert.equal(token.backendToken, undefined)
  assert.equal(token.user, undefined)
  assert.equal(session.backendToken, null)
})

test('backend authentication has a deadline, bypasses caches, and rejects redirects', async t => {
  const controller = new AbortController()
  const deadlines = []
  const calls = []
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    deadlines.push(milliseconds)
    return controller.signal
  })
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ token: 'local-backend-token', user: { id: '102' } }), { status: 200 })
  })

  const token = await authOptions.callbacks.jwt(signInArguments())

  assert.deepEqual(deadlines, [10000])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://127.0.0.1:1/api/v1/auth/google')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.signal, controller.signal)
  assert.equal(token.backendToken, 'local-backend-token')
})

const forwardingEnv = { VERCEL: '1', VERCEL_ENV: 'production', RATE_LIMIT_FORWARDING_SECRET: 'test-only-forwarding-secret-0123456789abcdef' }
function withEnv(t, values) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]))
  Object.assign(process.env, values)
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
}
const crypto = require('node:crypto')

test('Google sign-in forwards the Vercel-observed visitor IP with a valid signature', async t => {
  withEnv(t, forwardingEnv)
  incomingHeaders = new Headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' })
  t.after(() => { incomingHeaders = new Headers() })
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ token: 'local-backend-token', user: { id: '102' } }), { status: 200 })
  })

  await authOptions.callbacks.jwt(signInArguments())

  const headers = calls[0].options.headers
  const timestamp = headers['X-Gatareview-Client-Ip-Timestamp']
  const expected = crypto.createHmac('sha256', forwardingEnv.RATE_LIMIT_FORWARDING_SECRET)
    .update(['v1', timestamp, 'POST', '/api/v1/auth/google', '203.0.113.7'].join('\n')).digest('hex')
  assert.equal(headers['X-Gatareview-Client-Ip'], '203.0.113.7')
  assert.ok(Math.abs(Number(timestamp) - Date.now() / 1000) < 5)
  assert.equal(headers['X-Gatareview-Client-Ip-Signature'], expected)
  assert.equal(headers['Content-Type'], 'application/json')
})

test('Google sign-in sends no forwarding headers without a secret or outside Vercel', async t => {
  incomingHeaders = new Headers({ 'x-real-ip': '203.0.113.7' })
  t.after(() => { incomingHeaders = new Headers() })
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push(options.headers)
    return new Response(JSON.stringify({ token: 'local-backend-token', user: { id: '102' } }), { status: 200 })
  })

  withEnv(t, forwardingEnv)
  for (const env of [
    { ...forwardingEnv, RATE_LIMIT_FORWARDING_SECRET: '' },
    { ...forwardingEnv, RATE_LIMIT_FORWARDING_SECRET: 'too-short' },
    { ...forwardingEnv, VERCEL: '' },
    { ...forwardingEnv, VERCEL_ENV: 'development' },
  ]) {
    Object.assign(process.env, env)
    await authOptions.callbacks.jwt(signInArguments())
  }

  assert.equal(calls.length, 4)
  for (const headers of calls) {
    assert.deepEqual(Object.keys(headers).filter(key => key.toLowerCase().startsWith('x-gatareview')), [])
  }
})
