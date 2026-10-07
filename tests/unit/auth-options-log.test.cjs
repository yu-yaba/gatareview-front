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
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText
const callbackModule = new Module(filename, module)
callbackModule.filename = filename
callbackModule.paths = Module._nodeModulePaths(path.dirname(filename))
const originalRequire = callbackModule.require.bind(callbackModule)
callbackModule.require = id => id === 'next/headers'
  ? { cookies: async () => ({ get: () => undefined }) }
  : originalRequire(id)
callbackModule._compile(compiled, filename)
const { authOptions } = callbackModule.exports

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
