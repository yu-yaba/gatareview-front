import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import { dismissInstallPromptIfVisible } from './review-access.helpers'

const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const tokenFor = (identity: string) => `local-mutation-session-${identity}`
const userFor = (identity: string) => ({
  id: identity === 'A' ? '101' : '102', name: `利用者 ${identity}`,
  email: `local-mutation-${identity.toLowerCase()}@example.invalid`, admin: false,
})
const comment = '投稿時のアカウントを維持できることを確認する、三十文字以上のローカル回帰試験本文です。'
const lecture = { id: 3886, title: '更新処理のセッション境界テスト授業', lecturer: 'テスト教員', faculty: '工学部', avg_rating: 3, review_count: 0 }
type CaptchaWindow = Window & { mutationRegressionCaptcha: { calls: number; release: () => void } }
type PostedReview = { authorization: string | undefined; body: { review: { content: string; rating: number }; token: string } }

async function installSession(context: BrowserContext, baseURL: string, identity: string | null) {
  await context.clearCookies({ name: /^(__Secure-)?next-auth\.session-token(\.\d+)?$/ })
  if (!identity) return
  const value = await encode({ secret: 'playwright-nextauth-secret', token: { backendToken: tokenFor(identity), user: userFor(identity) } })
  await context.addCookies([{ name: 'next-auth.session-token', value, url: baseURL }])
}

async function notifySessionChanged(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {
    key: 'nextauth.message',
    newValue: JSON.stringify({ event: 'session', data: { trigger: 'getSession' }, timestamp: Date.now() }),
  })))
}

async function prepareSubmission(page: Page, identity: string | null): Promise<PostedReview[]> {
  const posts: PostedReview[] = []
  await page.route('**/api/v1/lectures/3886/reviews', route => {
    if (route.request().method() !== 'POST') return route.continue()
    posts.push({ authorization: route.request().headers().authorization, body: route.request().postDataJSON() })
    return route.fulfill({ json: { success: true } })
  })
  await page.goto('/lectures/3886/review')
  await expect(page.getByRole('heading', { name: lecture.title, exact: true })).toBeVisible()
  if (identity) await expect(page.getByText(`利用者 ${identity}`, { exact: true })).toBeVisible()
  await dismissInstallPromptIfVisible(page)
  await expect(page.getByRole('button', { name: 'レビューを投稿', exact: true })).toBeEnabled()
  await page.locator('#content').fill(comment)
  await page.evaluate(() => {
    const gate = { calls: 0, release: () => {} }
    ;(window as unknown as CaptchaWindow).mutationRegressionCaptcha = gate
    window.grecaptcha = {
      execute: () => new Promise<string>(resolve => {
        gate.calls += 1
        gate.release = () => resolve('local-deferred-captcha-token')
      }),
    }
  })
  await page.getByRole('button', { name: 'レビューを投稿', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as CaptchaWindow).mutationRegressionCaptcha.calls)).toBe(1)
  await expect(page.getByRole('button', { name: '投稿中...', exact: true })).toBeDisabled()
  return posts
}

async function releaseCaptcha(page: Page) {
  await page.evaluate(async () => {
    ;(window as unknown as CaptchaWindow).mutationRegressionCaptcha.release()
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}

async function expectNoSubmission(page: Page, posts: PostedReview[]) {
  // Let the resolved local promise and cancelled component callbacks settle.
  await page.waitForTimeout(150)
  expect(posts).toHaveLength(0)
  await expect(page.getByText('レビューを登録しました', { exact: true })).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const hostname = new URL(route.request().url()).hostname
    return ['127.0.0.1', 'localhost'].includes(hostname) ? route.continue() : route.abort()
  })
  await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' })
  await page.request.post(`${mockApiURL}/_test/reset`)
  await page.request.post(`${mockApiURL}/_test/response`, { data: { path: '/api/v1/lectures/3886', body: lecture } })
  await page.request.post(`${mockApiURL}/_test/response`, { data: {
    path: '/api/v1/lectures/3886/reviews',
    body: { reviews: [], access: { restriction_enabled: false, access_granted: true } },
  } })
  await page.route('**/api/v1/auth/me', route => {
    const identity = route.request().headers().authorization === `Bearer ${tokenFor('A')}` ? 'A' : 'B'
    return route.fulfill({ json: { user: userFor(identity) } })
  })
})

for (const scenario of [
  { initial: 'A', next: 'B', name: 'AからBへの変更' },
  { initial: 'A', next: null, name: 'Aのログアウト' },
  { initial: null, next: 'B', name: '匿名からBへのログイン' },
]) {
  test(`reCAPTCHA待機中の${scenario.name}は旧フォームの投稿を取り消す`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, scenario.initial)
    const posts = await prepareSubmission(page, scenario.initial)

    await installSession(context, baseURL!, scenario.next)
    await notifySessionChanged(page)
    if (scenario.next) await expect(page.getByText(`利用者 ${scenario.next}`, { exact: true })).toBeVisible()
    await expect(page.locator('#content')).toHaveValue('')
    await releaseCaptcha(page)

    await expectNoSubmission(page, posts)
    await expect(page).toHaveURL(/\/lectures\/3886\/review$/)
  })
}

for (const identity of ['A', null]) {
  test(`${identity ? '同じA' : '同じ匿名状態'}の投稿は開始時の権限で一度だけ完了する`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, identity)
    const posts = await prepareSubmission(page, identity)

    await releaseCaptcha(page)

    await expect(page).toHaveURL(/\/lectures\/3886$/)
    expect(posts).toHaveLength(1)
    expect(posts[0].authorization).toBe(identity ? `Bearer ${tokenFor(identity)}` : undefined)
    expect(posts[0].body.review.content).toBe(comment)
    expect(posts[0].body.review.rating).toBe(3)
    expect(posts[0].body.token).toBe('local-deferred-captcha-token')
  })
}

test('reCAPTCHA待機中に投稿画面を離れると投稿と遅れた成功通知を取り消す', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, 'A')
  const posts = await prepareSubmission(page, 'A')

  await page.getByRole('button', { name: '授業詳細に戻る', exact: true }).click()
  await expect(page).toHaveURL(/\/lectures\/3886$/)
  await releaseCaptcha(page)

  await expectNoSubmission(page, posts)
  await expect(page).toHaveURL(/\/lectures\/3886$/)
})

test('変更通知前にCookieがBへ切り替わってもAのフォームをBで投稿しない', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, 'A')
  const posts = await prepareSubmission(page, 'A')

  await installSession(context, baseURL!, 'B')
  // Deliberately omit the storage event: the session check must read the cookie.
  await expect(page.locator('#content')).toHaveValue(comment)
  await releaseCaptcha(page)

  await expect(page.getByText('アカウントが変更されました。内容を確認して再度お試しください。', { exact: true })).toBeVisible()
  await expectNoSubmission(page, posts)
  await expect(page.locator('#content')).toHaveValue(comment)
})

test('投稿直前のsession取得が503なら匿名投稿へ切り替えずに止める', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, 'A')
  const posts = await prepareSubmission(page, 'A')
  let failedSessionChecks = 0
  await page.route('**/api/auth/session', route => {
    failedSessionChecks += 1
    return route.fulfill({ status: 503, json: { error: 'local unavailable' } })
  })

  await releaseCaptcha(page)

  await expect.poll(() => failedSessionChecks).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'レビューを投稿', exact: true })).toBeEnabled()
  await expectNoSubmission(page, posts)
  await expect(page.locator('#content')).toHaveValue(comment)
  await expect(page).toHaveURL(/\/lectures\/3886\/review$/)
})

test('管理設定のsession確認待機中にアカウントを変更するとPATCHを取り消す', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, 'A')
  let patches = 0
  await page.route('**/api/v1/admin/review-access', route => {
    if (route.request().method() === 'PATCH') patches += 1
    return route.fulfill({ json: {
      lecture_review_restriction_enabled: false, updated_at: null, last_updated_by: null,
    } })
  })
  await page.goto('/admin/review-access')
  await expect(page.getByRole('button', { name: '制限を ON にする', exact: true })).toBeEnabled()
  await dismissInstallPromptIfVisible(page)

  let blockedRequest: Request | undefined
  let cancelled = false
  let release!: () => void
  let seen!: () => void
  let finished!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  const received = new Promise<void>(resolve => { seen = resolve })
  const settled = new Promise<void>(resolve => { finished = resolve })
  page.on('requestfailed', request => { if (request === blockedRequest) cancelled = true })
  await page.route('**/api/auth/session', async route => {
    if (blockedRequest) return route.continue()
    blockedRequest = route.request()
    seen()
    await pending
    try {
      await route.continue()
    } catch (error) {
      if (!cancelled && !route.request().failure()) throw error
    } finally {
      finished()
    }
  })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '制限を ON にする', exact: true }).click()
  await received

  await installSession(context, baseURL!, 'B')
  await notifySessionChanged(page)
  await expect(page.getByText('利用者 B', { exact: true })).toBeVisible()
  release()
  await settled
  await expect.poll(() => cancelled).toBe(true)

  expect(patches).toBe(0)
  await expect(page.getByText('レビュー閲覧制限を有効にしました', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '制限を ON にする', exact: true })).toBeEnabled()
})
