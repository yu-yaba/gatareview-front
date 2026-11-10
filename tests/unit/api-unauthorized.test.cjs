const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTs } = require('./support/load-ts.cjs')

// The real Axios client and interceptors; a dummy adapter answers 401 locally.
function fixture(t, sessionToken) {
  const handled = []
  const api = loadTs('app/_helpers/api.ts', {
    'next-auth/react': { getSession: async () => (sessionToken ? { backendToken: sessionToken } : null) },
    './sessionExpiry': {
      bearerToken: header => header.replace(/^Bearer /, ''),
      handleBackendUnauthorized: async token => { handled.push(token) },
    },
  })
  api.default.defaults.adapter = async config => {
    const error = new Error('Request failed with status code 401')
    error.config = config
    error.response = { status: 401, data: {}, headers: {}, config }
    error.isAxiosError = true
    throw error
  }
  t.mock.method(console, 'error', () => {})
  const settle = () => new Promise(resolve => setImmediate(resolve))
  return { api, handled, settle }
}

test('a 401 for a request that carried the session token ends the session', async t => {
  const { api, handled, settle } = fixture(t, 'token-A')
  await assert.rejects(api.mypageApi.getMypage(), error => error.response.status === 401)
  await settle()
  assert.deepEqual(handled, ['token-A'])
})

test('an anonymous 401 is left to the page (no session to end)', async t => {
  const { api, handled, settle } = fixture(t, null)
  await assert.rejects(api.mypageApi.getMypage(), error => error.response.status === 401)
  await settle()
  assert.deepEqual(handled, [])
})

test('the logout call itself does not re-enter the handler', async t => {
  const { api, handled, settle } = fixture(t, 'token-A')
  await assert.rejects(api.authApi.logout(), error => error.response.status === 401)
  await settle()
  assert.deepEqual(handled, [])
})
