const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTs } = require('./support/load-ts.cjs')

// The real 401 handler with fake NextAuth sign-out, session endpoint, toast, and navigation.
function fixture(t, { currentToken = 'token-A', sessionFails = false, signOutUrl = '/auth/signin?error=SessionExpired' } = {}) {
  const calls = { signOut: [], navigations: [], toasts: [], sessionChecks: 0 }
  const expiry = loadTs('app/_helpers/sessionExpiry.ts', {
    'next-auth/react': { signOut: async options => { calls.signOut.push(options); return signOutUrl ? { url: signOutUrl } : {} } },
    './notifications': { error: message => calls.toasts.push(message) },
  })
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/auth/session')
    assert.equal(options.cache, 'no-store')
    calls.sessionChecks += 1
    if (sessionFails) throw new Error('offline')
    return new Response(JSON.stringify(currentToken ? { backendToken: currentToken } : {}), { status: 200 })
  })
  globalThis.window = { location: { assign: url => calls.navigations.push(url) } }
  t.after(() => { delete globalThis.window })
  return { expiry, calls }
}

test('a rejected current token signs out once and opens the sign-in page with an explanation', async t => {
  const { expiry, calls } = fixture(t)
  await Promise.all([expiry.handleBackendUnauthorized('token-A'), expiry.handleBackendUnauthorized('token-A')])
  await expiry.handleBackendUnauthorized('token-A')
  assert.deepEqual(calls.signOut, [{ redirect: false, callbackUrl: '/auth/signin?error=SessionExpired' }])
  assert.deepEqual(calls.navigations, ['/auth/signin?error=SessionExpired'])
  assert.equal(calls.sessionChecks, 1)
})

test('a late 401 for a previous account does not end the new account session', async t => {
  const { expiry, calls } = fixture(t, { currentToken: 'token-B' })
  await expiry.handleBackendUnauthorized('token-A')
  assert.deepEqual(calls.signOut, [])
  assert.deepEqual(calls.navigations, [])
  // Later rejections are still handled.
  await expiry.handleBackendUnauthorized('token-B')
  assert.equal(calls.signOut.length, 1)
})

test('a session that already ended server-side just moves to the sign-in page', async t => {
  const { expiry, calls } = fixture(t, { currentToken: null })
  await expiry.handleBackendUnauthorized('token-A')
  assert.deepEqual(calls.signOut, [])
  assert.deepEqual(calls.navigations, ['/auth/signin?error=SessionExpired'])
})

// A failed sign-out refreshes the session, which re-runs page requests and yields more 401s.
// Trying sign-out once per token per page load keeps that from becoming a sign-out storm.
test('when sign-out fails (revocation 503/429), later 401s do not retry it and notices are throttled', async t => {
  const { expiry, calls } = fixture(t, { signOutUrl: null })
  for (let i = 0; i < 5; i += 1) await expiry.handleBackendUnauthorized('token-A')
  assert.equal(calls.signOut.length, 1)
  assert.equal(calls.sessionChecks, 1)
  assert.deepEqual(calls.navigations, [])
  assert.equal(calls.toasts.length, 1)
})

test('when only the session check fails, the next 401 retries and can still sign out', async t => {
  const { expiry, calls } = fixture(t, { sessionFails: true })
  await expiry.handleBackendUnauthorized('token-A')
  await expiry.handleBackendUnauthorized('token-A')
  assert.equal(calls.sessionChecks, 2)
  assert.equal(calls.toasts.length, 1)
  assert.deepEqual(calls.signOut, [])
  // The check works again: the rejected session ends.
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ backendToken: 'token-A' }), { status: 200 }))
  await expiry.handleBackendUnauthorized('token-A')
  assert.equal(calls.signOut.length, 1)
  assert.deepEqual(calls.navigations, ['/auth/signin?error=SessionExpired'])
})

test('401 without a sent token (anonymous request) is left to the caller', async t => {
  const { expiry, calls } = fixture(t)
  for (const token of [null, undefined, '', '   ']) await expiry.handleBackendUnauthorized(token)
  assert.equal(calls.sessionChecks, 0)
  assert.equal(expiry.bearerToken('Bearer token-A'), 'token-A')
  assert.equal(expiry.bearerToken('Basic abc'), null)
  assert.equal(expiry.bearerToken(undefined), null)
})
