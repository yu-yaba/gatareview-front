const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTs } = require('./support/load-ts.cjs')

// Exercise the real callbacks without contacting Google or requiring a Next request.
process.env.NEXTAUTH_SECRET = 'local-auth-callback-test-secret'
process.env.DOCKER_BACKEND_URL = 'http://127.0.0.1:1'
let rememberCookie
const { authOptions } = loadTs('app/_helpers/authOptions.ts', {
  'next/headers': {
    cookies: async () => ({ get: name => name === 'remember_me' && rememberCookie !== undefined ? { value: rememberCookie } : undefined }),
  },
})

const nowSeconds = () => Math.floor(Date.now() / 1000)
// Shape of the Rails token; the frontend only reads exp (the backend verifies the signature).
const backendJwt = exp => ['e30', Buffer.from(JSON.stringify({ user_id: 102, token_version: 0, exp, iat: nowSeconds() })).toString('base64url'), 'local-signature'].join('.')
const backendSuccess = (token = backendJwt(nowSeconds() + 7 * 24 * 60 * 60)) => async () => new Response(
  JSON.stringify({ token, user: { id: '102', name: 'テスト利用者', email: 'local@example.invalid' } }),
  { status: 200 },
)
const isBackendAuthFailure = error => error?.name === 'BackendAuthenticationError'
const isSessionEnded = error => error?.name === 'SessionEndedError'

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

  await assert.rejects(authOptions.callbacks.jwt(signInArguments()), isBackendAuthFailure)

  assert.equal(logs.length, 1)
  assert.equal(logs[0][1], 401)
  assert.equal(JSON.stringify(logs).includes(privateMarker), false)
})

test('backend authentication exception does not log request or error contents', async t => {
  const privateMarker = 'PRIVATE_BACKEND_AUTH_EXCEPTION'
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  t.mock.method(globalThis, 'fetch', async () => { throw new Error(privateMarker) })

  await assert.rejects(authOptions.callbacks.jwt(signInArguments()), isBackendAuthFailure)

  assert.equal(logs.length, 1)
  assert.equal(logs[0].some(value => value instanceof Error), false)
  assert.equal(JSON.stringify(logs).includes(privateMarker), false)
})

for (const [name, fetchFixture] of [
  ['an unavailable backend', async () => new Response('{}', { status: 503 })],
  ['a rate-limited backend', async () => new Response('{}', { status: 429 })],
  ['a success response without a token', async () => new Response(JSON.stringify({ user: { id: '102' } }), { status: 200 })],
  ['a token without an expiry', backendSuccess('opaque-token-without-exp')],
  ['an already expired token', backendSuccess(backendJwt(nowSeconds() - 1))],
  ['a network failure', async () => { throw new Error('offline') }],
]) {
  test(`sign-in fails instead of creating a session without an API token for ${name}`, async t => {
    t.mock.method(console, 'error', () => {})
    t.mock.method(globalThis, 'fetch', fetchFixture)

    await assert.rejects(authOptions.callbacks.jwt(signInArguments()), isBackendAuthFailure)
  })
}

for (const [cookieValue, remember] of [[undefined, false], ['false', false], ['true', true]]) {
  test(`sign-in records remember=${remember} for remember_me=${cookieValue} and the API token expiry`, async t => {
    rememberCookie = cookieValue
    t.after(() => { rememberCookie = undefined })
    const exp = nowSeconds() + (remember ? 30 : 7) * 24 * 60 * 60
    const calls = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push(JSON.parse(options.body))
      return backendSuccess(backendJwt(exp))()
    })

    const before = nowSeconds()
    const token = await authOptions.callbacks.jwt(signInArguments())

    assert.deepEqual(calls, [{ token: 'local-callback-test-token', remember }])
    assert.equal(token.remember, remember)
    assert.equal(token.backendExp, exp)
    assert.ok(token.authTime >= before && token.authTime <= nowSeconds())
  })
}

const activeToken = (overrides = {}) => ({
  backendToken: 'local-backend-token', user: { id: '102' }, remember: false,
  authTime: nowSeconds() - 60, backendExp: nowSeconds() + 3600, ...overrides,
})

for (const [name, token] of [
  ['the API token has expired', activeToken({ remember: true, backendExp: nowSeconds() - 1 })],
  ['a non-remembered session is older than four hours', activeToken({ authTime: nowSeconds() - 4 * 60 * 60 - 1 })],
  ['a remembered session is older than thirty days', activeToken({ remember: true, authTime: nowSeconds() - 30 * 24 * 60 * 60 - 1, backendExp: nowSeconds() + 3600 })],
  ['a session from before this change has no lifetime fields', { backendToken: 'local-backend-token', user: { id: '102' } }],
  ['the session has no API token', activeToken({ backendToken: null })],
  ['the sign-in time is in the future', activeToken({ authTime: nowSeconds() + 3600 })],
]) {
  test(`an existing session ends when ${name}`, async () => {
    await assert.rejects(authOptions.callbacks.jwt({ token: token }), isSessionEnded)
  })
}

test('an active session is kept and reports when it really ends', async () => {
  const token = activeToken()
  assert.equal(await authOptions.callbacks.jwt({ token }), token)
  const session = await authOptions.callbacks.session({
    token,
    session: { user: { name: 'テスト利用者' }, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  })
  assert.equal(session.backendToken, 'local-backend-token')
  assert.equal(session.expires, new Date(Math.min(token.backendExp, token.authTime + 4 * 60 * 60) * 1000).toISOString())
})

test('expected session ends are not logged as errors, and other errors omit details', async t => {
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  const ended = new Error('Session ended')
  ended.name = 'SessionEndedError'
  authOptions.logger.error('JWT_SESSION_ERROR', ended)
  assert.equal(logs.length, 0)

  const privateMarker = 'PRIVATE_LOGGER_DETAIL'
  const failure = new Error('JWT invalid')
  failure.stack = privateMarker
  authOptions.logger.error('JWT_SESSION_ERROR', failure)
  authOptions.logger.error('OAUTH_CALLBACK_ERROR', { error: failure, providerId: privateMarker })
  assert.equal(logs.length, 2)
  assert.deepEqual(logs[0], ['[next-auth][error][JWT_SESSION_ERROR]', 'Error', 'JWT invalid'])
  assert.equal(JSON.stringify(logs).includes(privateMarker), false)
})

test('NextAuth errors are shown on the sign-in page instead of a missing error page', () => {
  assert.equal(authOptions.pages.error, '/auth/signin')
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
    return backendSuccess()()
  })

  const token = await authOptions.callbacks.jwt(signInArguments())

  assert.deepEqual(deadlines, [10000])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://127.0.0.1:1/api/v1/auth/google')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.signal, controller.signal)
  assert.equal(token.backendToken.split('.').length, 3)
})
