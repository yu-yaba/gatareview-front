const assert = require('node:assert/strict')
const { createServer } = require('node:http')
const Module = require('node:module')
const { test, before, after } = require('node:test')
const { loadTs } = require('./support/load-ts.cjs')

// Drive the real App Router auth route (and NextAuth core) through an OAuth sign-in.
// A loopback server stands in for the OAuth provider and the Rails API; no Google or
// production service is contacted, and all secrets are local dummies.
const origin = 'http://127.0.0.1:8080'
process.env.NEXTAUTH_URL = origin
process.env.NEXTAUTH_SECRET = 'local-auth-route-test-secret'
process.env.GOOGLE_CLIENT_ID = 'local-google-client'
process.env.GOOGLE_CLIENT_SECRET = 'local-google-secret'

const nowSeconds = () => Math.floor(Date.now() / 1000)
const backendJwt = exp => ['e30', Buffer.from(JSON.stringify({ user_id: 102, token_version: 0, exp, iat: nowSeconds() })).toString('base64url'), 'local-signature'].join('.')

let backendResponse = { status: 200, body: {} }
const backendCalls = []
const fake = createServer(async (request, response) => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const body = Buffer.concat(chunks).toString()
  const reply = (status, json) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(json)) }
  if (request.url === '/token') return reply(200, { access_token: 'local-access-token', token_type: 'bearer' })
  if (request.url === '/userinfo') return reply(200, { sub: '102', name: 'テスト利用者', email: 'local@example.invalid' })
  if (request.url === '/api/v1/auth/google') {
    backendCalls.push(JSON.parse(body))
    return reply(backendResponse.status, backendResponse.body)
  }
  return reply(404, {})
})

// NextAuth reads the request through next/headers; serve it from the current test request.
let current = { cookies: new Map(), headers: new Headers() }
const fakeHeaders = {
  cookies: async () => ({
    getAll: () => [...current.cookies].map(([name, value]) => ({ name, value })),
    get: name => (current.cookies.has(name) ? { name, value: current.cookies.get(name) } : undefined),
  }),
  headers: async () => current.headers,
}
const originalLoad = Module._load
Module._load = function (request, ...rest) {
  return request === 'next/headers' ? fakeHeaders : originalLoad.call(this, request, ...rest)
}

let route
let authOptions
let NextRequest
let encode
before(async () => {
  await new Promise(resolve => fake.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${fake.address().port}`
  process.env.DOCKER_BACKEND_URL = base
  const cache = new Map()
  const replacements = { 'server-only': {}, 'next/headers': fakeHeaders }
  authOptions = loadTs('app/_helpers/authOptions.ts', replacements, cache).authOptions
  route = loadTs('app/api/auth/[...nextauth]/route.ts', replacements, cache)
  authOptions.providers = [{
    id: 'local', name: 'Local', type: 'oauth', version: '2.0',
    clientId: 'local-client', clientSecret: 'local-secret',
    authorization: { url: `${base}/authorize`, params: { scope: 'profile' } },
    token: `${base}/token`, userinfo: `${base}/userinfo`,
    checks: ['state'], idToken: false,
    profile: profile => ({ id: profile.sub, name: profile.name, email: profile.email }),
  }]
  ;({ NextRequest } = require('next/server'))
  ;({ encode } = require('next-auth/jwt'))
})
after(() => {
  Module._load = originalLoad
  fake.close()
})

function parseSetCookie(header) {
  const [pair, ...attributes] = header.split(';').map(part => part.trim())
  const index = pair.indexOf('=')
  return {
    name: pair.slice(0, index), value: pair.slice(index + 1), raw: header,
    expires: attributes.find(attribute => /^expires=/i.test(attribute))?.slice(8),
    maxAge: attributes.find(attribute => /^max-age=/i.test(attribute))?.slice(8),
  }
}

async function call(jar, method, path, form) {
  // Like Next's cookies(), expose decoded values.
  current = { cookies: new Map([...jar].map(([name, value]) => [name, decodeURIComponent(value)])), headers: new Headers({ host: '127.0.0.1:8080' }) }
  const url = new URL(path, origin)
  const init = { method, headers: { cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') } }
  if (form) {
    init.body = new URLSearchParams(form).toString()
    init.headers['content-type'] = 'application/x-www-form-urlencoded'
  }
  const nextauth = url.pathname.replace(/^\/api\/auth\//, '').split('/')
  const response = await route[method](new NextRequest(url, init), { params: Promise.resolve({ nextauth }) })
  const cookies = response.headers.getSetCookie().map(parseSetCookie)
  for (const cookie of cookies) {
    if (!cookie.value || cookie.maxAge === '0') jar.delete(cookie.name)
    else jar.set(cookie.name, cookie.value)
  }
  return { response, cookies, location: response.headers.get('location') }
}

const sessionCookies = result => result.cookies.filter(cookie => /^next-auth\.session-token/.test(cookie.name) && cookie.value)

async function startSignIn({ remember }) {
  const jar = new Map()
  if (remember !== undefined) jar.set('remember_me', String(remember))
  const { response } = await call(jar, 'GET', '/api/auth/csrf')
  const { csrfToken } = await response.json()
  const signIn = await call(jar, 'POST', '/api/auth/signin/local', { csrfToken, callbackUrl: `${origin}/mypage`, json: 'true' })
  const { url } = await signIn.response.json()
  return { jar, state: new URL(url).searchParams.get('state') }
}

async function followToSignInPage(jar, location) {
  let next = location
  for (let hops = 0; hops < 3 && next.startsWith(`${origin}/api/auth/`); hops += 1) {
    next = (await call(jar, 'GET', next)).location
  }
  return new URL(next, origin)
}

for (const status of [429, 503]) {
  test(`a backend ${status} during sign-in creates no session and explains on the sign-in page`, async t => {
    t.mock.method(console, 'error', () => {})
    backendResponse = { status, body: { error: 'local failure' } }
    const { jar, state } = await startSignIn({ remember: false })
    const callback = await call(jar, 'GET', `/api/auth/callback/local?code=local-code&state=${state}`)

    assert.equal(callback.location, `${origin}/api/auth/error?error=Callback`)
    assert.deepEqual(sessionCookies(callback), [])
    assert.equal([...jar.keys()].some(name => name.startsWith('next-auth.session-token')), false)
    const page = await followToSignInPage(jar, callback.location)
    assert.equal(page.pathname, '/auth/signin')
    assert.equal(page.searchParams.get('error'), 'Callback')
  })
}

// NextAuth 4.24 reports a cancelled consent (?error=access_denied) as `Callback`, and a failed
// code exchange as `OAuthCallback`; the sign-in page explains both.
for (const [name, query, code] of [
  ['cancelling consent at the provider', state => `error=access_denied&state=${state}`, 'Callback'],
  ['a failed code exchange', () => 'code=local-code&state=wrong-state', 'OAuthCallback'],
]) {
  test(`${name} returns to the sign-in page with ${code} and no session`, async t => {
    t.mock.method(console, 'error', () => {})
    const { jar, state } = await startSignIn({ remember: false })
    const callback = await call(jar, 'GET', `/api/auth/callback/local?${query(state)}`)
    assert.deepEqual(sessionCookies(callback), [])
    const page = await followToSignInPage(jar, callback.location)
    assert.equal(page.pathname, '/auth/signin')
    assert.equal(page.searchParams.get('error'), code)
  })
}

test('a non-remembered sign-in issues a browser-session cookie, kept that way on refresh', async () => {
  const backendToken = backendJwt(nowSeconds() + 7 * 24 * 60 * 60)
  backendResponse = { status: 200, body: { token: backendToken, user: { id: '102', name: 'テスト利用者', email: 'local@example.invalid' } } }
  const { jar, state } = await startSignIn({ remember: false })
  const callback = await call(jar, 'GET', `/api/auth/callback/local?code=local-code&state=${state}`)

  assert.equal(callback.location, `${origin}/mypage`)
  assert.equal(backendCalls.at(-1).remember, false)
  const [issued] = sessionCookies(callback)
  assert.ok(issued, 'a session cookie is issued')
  assert.equal(issued.expires, undefined, issued.raw)
  assert.equal(issued.maxAge, undefined, issued.raw)

  const session = await call(jar, 'GET', '/api/auth/session')
  const body = await session.response.json()
  assert.equal(body.backendToken, backendToken)
  const expires = Date.parse(body.expires) / 1000
  assert.ok(Math.abs(expires - (nowSeconds() + 4 * 60 * 60)) <= 5, body.expires)
  const [refreshed] = sessionCookies(session)
  assert.equal(refreshed.expires, undefined, refreshed.raw)
  assert.equal(refreshed.maxAge, undefined, refreshed.raw)
})

test('a remembered sign-in cookie expires with the API token, not 30 days after each visit', async () => {
  const exp = nowSeconds() + 30 * 24 * 60 * 60 - 120
  backendResponse = { status: 200, body: { token: backendJwt(exp), user: { id: '102', name: 'テスト利用者', email: 'local@example.invalid' } } }
  const { jar, state } = await startSignIn({ remember: true })
  const callback = await call(jar, 'GET', `/api/auth/callback/local?code=local-code&state=${state}`)

  assert.equal(backendCalls.at(-1).remember, true)
  for (const result of [callback, await call(jar, 'GET', '/api/auth/session')]) {
    const [cookie] = sessionCookies(result)
    assert.equal(Date.parse(cookie.expires) / 1000, exp, cookie.raw)
  }
})

for (const [name, fields] of [
  ['an expired API token', { remember: true, authTime: nowSeconds() - 60, backendExp: nowSeconds() - 1 }],
  ['a session from before this change', {}],
]) {
  test(`${name} ends the session quietly and deletes the cookie`, async t => {
    const logs = []
    t.mock.method(console, 'error', (...args) => logs.push(args))
    const value = await encode({ secret: process.env.NEXTAUTH_SECRET, token: { backendToken: 'local-old-token', user: { id: '102' }, ...fields } })
    const jar = new Map([['next-auth.session-token', value]])
    const result = await call(jar, 'GET', '/api/auth/session')

    assert.deepEqual(await result.response.json(), {})
    assert.ok(result.cookies.some(cookie => cookie.name === 'next-auth.session-token' && cookie.maxAge === '0'))
    assert.equal(jar.has('next-auth.session-token'), false)
    assert.deepEqual(logs, [])
  })
}
