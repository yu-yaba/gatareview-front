import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import { activeSessionFields } from './session-token'

// ログイン状態の寿命: 「記憶しない」はブラウザ終了で消えること、APIトークンの期限切れ・
// 別端末でのログアウト（401）でログイン済みに見える状態が残らないことを確認する。
const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const backendToken = 'local-lifetime-session-token'
const user = { id: '101', name: '寿命テスト利用者', email: 'local-lifetime@example.invalid', admin: false }
const lecture = { id: 3886, title: 'セッション寿命テスト授業', lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4, review_count: 0 }
const sessionExpiredMessage = 'ログインの有効期限が切れたか、別の端末でログアウトされました'
const now = () => Math.floor(Date.now() / 1000)
// 単体実行時はNext devの初回コンパイルを待つ。
const firstLoadTimeout = 20_000

async function installSession(context: BrowserContext, baseURL: string, fields: Record<string, unknown>) {
  const value = await encode({ secret: 'playwright-nextauth-secret', token: { backendToken, user, ...fields } })
  // 30日後に期限切れになる従来のCookieとして置き、サーバーが期限を付け直すことを確かめる。
  await context.addCookies([{ name: 'next-auth.session-token', value, url: baseURL, expires: now() + 30 * 24 * 60 * 60 }])
}

const sessionCookie = async (context: BrowserContext) =>
  (await context.cookies()).find(cookie => cookie.name === 'next-auth.session-token' && cookie.value)

async function backend(page: Page, path: string, status: number, body: unknown = {}) {
  await page.request.post(`${mockApiURL}/_test/response`, { data: { path, status, body } })
}

async function backendRequests(page: Page, path: string) {
  const requests: { method: string; path: string; authenticated: boolean }[] =
    await (await page.request.get(`${mockApiURL}/_test/requests`)).json()
  return requests.filter(request => request.path === path)
}

async function expectSignedOutWithReason(page: Page, context: BrowserContext) {
  await expect(page).toHaveURL(/\/auth\/signin\?error=SessionExpired$/)
  await expect(page.getByRole('alert').filter({ hasText: sessionExpiredMessage })).toBeVisible()
  await expect.poll(() => sessionCookie(context)).toBeUndefined()
  expect(await (await page.request.get('/api/auth/session')).json()).toEqual({})
  // サインアウト時にサーバー側でもAPIトークンの失効を試みる（401は成功扱い）。
  await expect.poll(async () => (await backendRequests(page, '/api/v1/auth/logout')).length).toBeGreaterThan(0)
  // ログイン画面からの再遷移（ループ）がない。
  await page.waitForTimeout(500)
  await expect(page).toHaveURL(/\/auth\/signin\?error=SessionExpired$/)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const hostname = new URL(route.request().url()).hostname
    return ['127.0.0.1', 'localhost'].includes(hostname) ? route.continue() : route.abort()
  })
  await page.request.post(`${mockApiURL}/_test/reset`)
  await backend(page, '/api/v1/lectures/3886', 200, lecture)
  await backend(page, '/api/v1/auth/me', 200, { user })
  await backend(page, '/api/v1/auth/logout', 401, { error: '認証が必要です' })
})

test('「ログイン状態を記憶する」なしのセッションCookieにはExpiresが付かない', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: false }))

  const response = await page.request.get('/api/auth/session')
  expect((await response.json()).user.name).toBe(user.name)
  const issued = response.headersArray()
    .filter(header => header.name.toLowerCase() === 'set-cookie' && header.value.startsWith('next-auth.session-token='))
  expect(issued).toHaveLength(1)
  expect(issued[0].value).not.toMatch(/expires|max-age/i)

  await page.goto('/')
  await expect(page.getByText(user.name, { exact: true })).toBeVisible({ timeout: firstLoadTimeout })
  // expires -1 はブラウザを閉じると消えるセッションCookie。
  expect((await sessionCookie(context))?.expires).toBe(-1)
})

test('「ログイン状態を記憶する」ありのセッションCookieはAPIトークンの期限で切れる', async ({ page, context, baseURL }) => {
  const fields = activeSessionFields({ remember: true, ttlSeconds: 10 * 24 * 60 * 60 })
  await installSession(context, baseURL!, fields)

  await page.goto('/')
  await expect(page.getByText(user.name, { exact: true })).toBeVisible({ timeout: firstLoadTimeout })
  // Chromeはサーバー時計との差を補正するため、秒未満の差は許容する。
  expect(Math.abs((await sessionCookie(context))!.expires - fields.backendExp)).toBeLessThanOrEqual(2)
})

for (const [name, fields] of [
  ['APIトークンの期限切れ後', { ...activeSessionFields({ remember: true }), backendExp: now() - 1 }],
  ['「記憶しない」でログインから4時間を過ぎた後', activeSessionFields({ remember: false, ageSeconds: 4 * 60 * 60 + 1, ttlSeconds: 6 * 24 * 60 * 60 })],
  ['寿命の情報がない従来のセッション', {}],
] as const) {
  test(`${name}は次のページ表示でログアウト状態になる`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, fields)

    await page.goto('/lectures/3886')
    await expect(page.getByRole('heading', { name: lecture.title })).toBeVisible()
    await expect.poll(() => sessionCookie(context)).toBeUndefined()
    await expect(page.getByText(user.name, { exact: true })).toHaveCount(0)
    expect(await (await page.request.get('/api/auth/session')).json()).toEqual({})
    // 期限切れのトークンでAPIを呼び続けない。
    expect((await backendRequests(page, '/api/v1/auth/me')).filter(request => request.authenticated)).toHaveLength(0)
  })
}

test('別端末でのログアウト後（/auth/me が401）はサインアウトしてログイン画面で理由を表示する', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: true }))
  await backend(page, '/api/v1/auth/me', 401, { error: 'ユーザーが見つかりません' })

  await page.goto('/lectures/3886')
  await expectSignedOutWithReason(page, context)
})

test('マイページのAPIが401ならサインアウトしてログイン画面で理由を表示する', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: false }))
  await backend(page, '/api/v1/mypage', 401, { error: '認証が必要です' })

  await page.goto('/mypage')
  await expectSignedOutWithReason(page, context)
})

test('ブックマーク操作が401ならエラー表示ではなくサインアウトして案内する', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: true }))
  const dialogs: string[] = []
  page.on('dialog', dialog => { dialogs.push(dialog.message()); return dialog.dismiss() })
  await page.route('**/api/v1/lectures/3886/bookmarks', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { bookmarked: false } })
    : route.fulfill({ status: 401, json: { error: '認証が必要です' } }))

  await page.goto('/lectures/3886')
  await expect(page.getByText(user.name, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ブックマーク', exact: true }).click()
  await expectSignedOutWithReason(page, context)
  expect(dialogs).toEqual([])
})

for (const [path, code] of [
  ['/auth/signin?error=Callback', 'Callback'],
  ['/api/auth/error?error=OAuthCallback', 'OAuthCallback'],
  ['/api/auth/error?error=Configuration', 'Configuration'],
] as const) {
  test(`ログイン失敗（${code}）はログイン画面で理由を表示し、404にならない`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(new RegExp(`/auth/signin\\?.*error=${code}`))
    await expect(page.getByRole('alert').filter({
      hasText: code === 'Configuration' ? 'ログインに失敗しました' : 'ログインを完了できませんでした',
    })).toBeVisible()
    await expect(page.getByRole('button', { name: /Googleでログイン/ })).toBeVisible()
  })
}

test('401の後のサインアウトが失効失敗（503）でも、サインアウトを繰り返さない', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: true }))
  await backend(page, '/api/v1/auth/me', 401, { error: 'ユーザーが見つかりません' })
  await backend(page, '/api/v1/auth/logout', 503, { error: 'unavailable' })
  let signOutPosts = 0
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/signout') signOutPosts += 1
  })

  await page.goto('/lectures/3886')
  await expect(page.getByText('ログイン状態を更新できませんでした')).toBeVisible({ timeout: firstLoadTimeout })
  await page.waitForTimeout(3000)

  expect(signOutPosts).toBe(1)
  expect(await backendRequests(page, '/api/v1/auth/logout')).toHaveLength(1)
  // 失敗後のセッション再取得で各画面が一度再取得しても、その後は増え続けない。
  const meCalls = (await backendRequests(page, '/api/v1/auth/me')).length
  await page.waitForTimeout(2000)
  expect(await backendRequests(page, '/api/v1/auth/me')).toHaveLength(meCalls)
  expect(signOutPosts).toBe(1)
  await expect(page.getByText('ログイン状態を更新できませんでした')).toHaveCount(1)
  await expect(page).toHaveURL(/\/lectures\/3886$/)
  // 失効できなかったセッションは保持する（再読み込みで再試行できる）。
  expect(await sessionCookie(context)).toBeDefined()
})

test('ログイン中に定期的なセッション再取得をしない（編集中の画面を再読み込みしない）', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, activeSessionFields({ remember: true, ttlSeconds: 10 * 24 * 60 * 60 }))
  let sessionRequests = 0
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/auth/session') sessionRequests += 1 })
  await page.clock.install()

  await page.goto('/lectures/3886')
  await expect(page.getByText(user.name, { exact: true })).toBeVisible({ timeout: firstLoadTimeout })
  const before = sessionRequests
  const meBefore = (await backendRequests(page, '/api/v1/auth/me')).length
  await page.clock.fastForward('10:00')
  await page.waitForTimeout(1000)

  expect(sessionRequests).toBe(before)
  expect(await backendRequests(page, '/api/v1/auth/me')).toHaveLength(meBefore)
})

test('開いたままのタブも、「記憶しない」セッションの終了時刻を過ぎると操作なしでログアウト表示になる', async ({ page, context, baseURL }) => {
  test.setTimeout(60_000)
  await installSession(context, baseURL!, activeSessionFields({ remember: false, ageSeconds: 4 * 60 * 60 - 8, ttlSeconds: 6 * 24 * 60 * 60 }))

  await page.goto('/lectures/3886')
  await expect(page.getByText(user.name, { exact: true })).toBeVisible({ timeout: firstLoadTimeout })
  await expect(page.getByText(user.name, { exact: true })).toHaveCount(0, { timeout: 30_000 })
  expect(await sessionCookie(context)).toBeUndefined()
})
