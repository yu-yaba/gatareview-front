const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTs } = require('./support/load-ts.cjs')

const lifetime = loadTs('app/_helpers/sessionLifetime.ts')
const now = Math.floor(Date.now() / 1000)
const hour = 60 * 60
const day = 24 * hour
const jwtWith = payload => ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.')

test('the API token expiry is read from the backend JWT payload only when well formed', () => {
  assert.equal(lifetime.backendTokenExpiry(jwtWith({ exp: now + 60 })), now + 60)
  for (const token of [null, '', 'opaque', 'a.b', 'a.!!!.c', jwtWith({}), jwtWith({ exp: '123' }), jwtWith({ exp: -1 }), jwtWith({ exp: 1.5 })]) {
    assert.equal(lifetime.backendTokenExpiry(token), null, String(token))
  }
})

test('a session never outlives its API token, and non-remembered sessions are capped at four hours', () => {
  assert.equal(lifetime.BROWSER_SESSION_MAX_AGE, 4 * hour)
  assert.equal(lifetime.sessionExpiresAt({ remember: false, authTime: now, backendExp: now + 7 * day }), now + 4 * hour)
  assert.equal(lifetime.sessionExpiresAt({ remember: false, authTime: now, backendExp: now + hour }), now + hour)
  assert.equal(lifetime.sessionExpiresAt({ remember: true, authTime: now, backendExp: now + 30 * day }), now + 30 * day)
  assert.equal(lifetime.sessionExpiresAt({ remember: true, authTime: now, backendExp: now + 90 * day }), now + 30 * day)
  for (const token of [{}, { authTime: now, backendExp: now + hour }, { remember: 'true', authTime: now, backendExp: now + hour }, { remember: true, backendExp: now + hour }]) {
    assert.equal(lifetime.sessionExpiresAt(token), null)
  }
})

const response = cookies => {
  const headers = new Headers({ Location: '/after' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}
const thirtyDays = new Date((now + 30 * day) * 1000).toUTCString()
const liveCookie = (name = 'next-auth.session-token') => `${name}=encrypted-value; Path=/; Expires=${thirtyDays}; HttpOnly; SameSite=Lax`

test('a non-remembered session cookie loses Expires and Max-Age so it ends with the browser', async () => {
  const token = { remember: false, authTime: now, backendExp: now + 7 * day }
  const result = lifetime.applySessionCookieLifetime(response([
    liveCookie(), 'next-auth.csrf-token=csrf; Path=/; HttpOnly; SameSite=Lax',
    `next-auth.state=state; Path=/; Max-Age=900; HttpOnly`,
  ]), token)
  const cookies = result.headers.getSetCookie()
  assert.equal(cookies[0], 'next-auth.session-token=encrypted-value; Path=/; HttpOnly; SameSite=Lax')
  assert.equal(cookies[1], 'next-auth.csrf-token=csrf; Path=/; HttpOnly; SameSite=Lax')
  assert.equal(cookies[2], 'next-auth.state=state; Path=/; Max-Age=900; HttpOnly')
  assert.equal(result.status, 302)
  assert.equal(result.headers.get('Location'), '/after')
})

test('a remembered session cookie expires with the session, chunks included', () => {
  const token = { remember: true, authTime: now, backendExp: now + 10 * day }
  const cookies = lifetime.applySessionCookieLifetime(response([
    `${liveCookie('__Secure-next-auth.session-token.0')}; Max-Age=2592000`, liveCookie('__Secure-next-auth.session-token.1'),
  ]), token).headers.getSetCookie()
  const expected = new Date((now + 10 * day) * 1000).toUTCString()
  for (const [index, cookie] of cookies.entries()) {
    assert.equal(cookie, `__Secure-next-auth.session-token.${index}=encrypted-value; Path=/; HttpOnly; SameSite=Lax; Expires=${expected}`)
  }
})

test('without a known remembered token, a session cookie becomes a browser-session cookie', () => {
  for (const token of [null, { remember: true }]) {
    const [cookie] = lifetime.applySessionCookieLifetime(response([liveCookie()]), token).headers.getSetCookie()
    assert.doesNotMatch(cookie, /expires|max-age/i)
  }
})

test('deletion cookies and responses without a session cookie are left untouched', () => {
  const deletion = 'next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
  const original = response([deletion])
  assert.equal(lifetime.applySessionCookieLifetime(original, { remember: false, authTime: now, backendExp: now + hour }), original)
  const other = response(['next-auth.callback-url=%2F; Path=/'])
  assert.equal(lifetime.applySessionCookieLifetime(other, null), other)
})
