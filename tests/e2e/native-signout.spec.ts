import { expect, test } from '@playwright/test'
import { encode } from 'next-auth/jwt'

const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`

test.beforeEach(async ({ context, request, baseURL }) => {
  await request.post(`${mockApiURL}/_test/reset`)
  const cookie = await encode({
    secret: 'playwright-nextauth-secret',
    token: { backendToken: 'test-only-backend-token', user: { id: '1', name: 'テスト利用者', email: 'test@example.com' } },
  })
  await context.addCookies([{ name: 'next-auth.session-token', value: cookie, url: baseURL! }])
})

for (const status of [200, 401, 503]) {
  test(`標準サインアウトのAPI応答${status}でセッションを正しく処理する`, async ({ page, context }) => {
    await page.request.post(`${mockApiURL}/_test/response`, { data: { path: '/api/v1/auth/logout', status, body: {} } })
    const { csrfToken } = await (await page.request.get('/api/auth/csrf')).json()
    const response = await page.request.post('/api/auth/signout', { form: { csrfToken, callbackUrl: '/', json: 'true' } })
    const requests = await (await page.request.get(`${mockApiURL}/_test/requests`)).json()
    expect(requests.filter((request: {path: string}) => request.path === '/api/v1/auth/logout')).toHaveLength(1)
    const cookies = await context.cookies()
    if (status === 503) {
      expect(response.status()).toBe(503)
      expect(response.headers()['set-cookie']).toBeUndefined()
      expect(cookies.some(cookie => cookie.name === 'next-auth.session-token' && cookie.value)).toBe(true)
    } else {
      expect(response.ok()).toBe(true)
      expect(cookies.some(cookie => cookie.name === 'next-auth.session-token' && cookie.value)).toBe(false)
    }
  })
}

test('標準サインアウトの通信障害でセッションCookieを保持する', async ({ page, context }) => {
  await page.request.post(`${mockApiURL}/_test/response`, { data: { path: '/api/v1/auth/logout', disconnect: true } })
  const { csrfToken } = await (await page.request.get('/api/auth/csrf')).json()
  const response = await page.request.post('/api/auth/signout', { form: { csrfToken, callbackUrl: '/', json: 'true' } })
  expect(response.status()).toBe(503)
  expect(response.headers()['set-cookie']).toBeUndefined()
  expect((await context.cookies()).some(cookie => cookie.name === 'next-auth.session-token' && cookie.value)).toBe(true)
})

test('CSRF不正の標準サインアウトではAPI失効もCookie削除も行わない', async ({ page, context }) => {
  await page.request.get('/api/auth/csrf')
  await page.request.post('/api/auth/signout', { form: { csrfToken: 'invalid-test-csrf', callbackUrl: '/', json: 'true' } })
  const requests = await (await page.request.get(`${mockApiURL}/_test/requests`)).json()
  expect(requests.filter((request: {path: string}) => request.path === '/api/v1/auth/logout')).toHaveLength(0)
  expect((await context.cookies()).some(cookie => cookie.name === 'next-auth.session-token' && cookie.value)).toBe(true)
})

test('標準サインアウトの確認画面GETだけではAPI失効しない', async ({ page, context }) => {
  await page.request.get('/api/auth/signout')
  const requests = await (await page.request.get(`${mockApiURL}/_test/requests`)).json()
  expect(requests.filter((request: {path: string}) => request.path === '/api/v1/auth/logout')).toHaveLength(0)
  expect((await context.cookies()).some(cookie => cookie.name === 'next-auth.session-token' && cookie.value)).toBe(true)
})
