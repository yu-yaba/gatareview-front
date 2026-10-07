import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { encode } from 'next-auth/jwt'

const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const tokenFor = (identity: string) => `local-boundary-session-${identity}`
const userFor = (identity: string, id = identity === 'A' ? '101' : '102') => ({
  id, name: `利用者 ${identity}`, email: `local-${identity.toLowerCase()}@example.invalid`, admin: false,
})
const privateMarker = 'PRIVATE_PREVIOUS_ACCOUNT_REVIEW'
const privateContent = '公開プレビューとして表示される最初の三十文字以上の部分です。 ' + privateMarker
const lecture = { id: 3886, title: 'セッション境界テスト授業', lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4.5, review_count: 2 }
const review = (content: string, id = 101) => ({
  id, rating: 4.5, lecture_id: 3886, content, user_id: 101, thanks_count: 0,
  textbook: '', attendance: '', grading_type: '', content_difficulty: '', content_quality: '',
  period_year: '', period_term: '', created_at: '2026-10-06T00:00:00Z', lecture,
})
const reviewBody = (granted: boolean) => ({
  reviews: [review('公開の先頭レビューです。', 100), review(granted ? privateContent : privateContent.slice(0, 30))],
  access: { restriction_enabled: true, access_granted: granted },
})

async function installSession(context: BrowserContext, baseURL: string, identity: string | null, id?: string) {
  await context.clearCookies({ name: /^(__Secure-)?next-auth\.session-token(\.\d+)?$/ })
  if (!identity) return
  const value = await encode({ secret: 'playwright-nextauth-secret', token: { backendToken: tokenFor(identity), user: userFor(identity, id) } })
  await context.addCookies([{ name: 'next-auth.session-token', value, url: baseURL }])
}

async function notifySessionChanged(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {
    key: 'nextauth.message',
    newValue: JSON.stringify({ event: 'session', data: { trigger: 'getSession' }, timestamp: Date.now() }),
  })))
}

async function serverReviews(page: Page, granted: boolean) {
  await page.request.post(`${mockApiURL}/_test/response`, { data: { path: '/api/v1/lectures/3886/reviews', body: reviewBody(granted) } })
}

async function mainContains(page: Page, marker: string) {
  return (await page.locator('main').innerText()).includes(marker)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const hostname = new URL(route.request().url()).hostname
    return ['127.0.0.1', 'localhost'].includes(hostname) ? route.continue() : route.abort()
  })
  await page.request.post(`${mockApiURL}/_test/reset`)
  await page.request.post(`${mockApiURL}/_test/response`, { data: { path: '/api/v1/lectures/3886', body: lecture } })
  await page.route('**/api/v1/auth/me', route => {
    const identity = route.request().headers().authorization === `Bearer ${tokenFor('A')}` ? 'A' : 'B'
    return route.fulfill({ json: { user: userFor(identity) } })
  })
})

for (const scenario of [
  { name: '投稿0件の別アカウント', identity: 'B', id: '102', refreshFails: false },
  { name: 'ログアウト・匿名', identity: null, id: undefined, refreshFails: false },
  { name: '同じ本人の異なるAPIトークン', identity: 'B', id: '101', refreshFails: false },
  { name: '再取得が通信障害の別アカウント', identity: 'B', id: '102', refreshFails: true },
]) {
  test(`授業詳細は${scenario.name}への通知後に旧全文を表示しない`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, 'A')
    await serverReviews(page, true)
    await page.goto('/lectures/3886')
    await expect.poll(() => mainContains(page, privateMarker)).toBe(true)
    await serverReviews(page, false)
    let refreshFailures = 0
    if (scenario.refreshFails) {
      await page.route('**/lectures/3886?**', route => { refreshFailures += 1; return route.abort() })
    }

    await installSession(context, baseURL!, scenario.identity, scenario.id)
    await notifySessionChanged(page)

    await expect.poll(() => mainContains(page, privateMarker)).toBe(false)
    if (scenario.refreshFails) {
      await expect.poll(() => refreshFailures).toBeGreaterThan(0)
      await page.waitForTimeout(150)
      expect(await mainContains(page, privateMarker)).toBe(false)
      await expect(page.getByRole('status', { name: '', exact: true }).filter({ hasText: '閲覧情報を更新しています' })).toBeVisible()
    } else {
      await expect.poll(() => mainContains(page, privateContent.slice(0, 30))).toBe(true)
      expect(await mainContains(page, privateMarker)).toBe(false)
    }
  })
}

const pagination = { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 }
const privatePages = [
  {
    path: '/mypage', api: '/api/v1/mypage', marker: 'PRIVATE_PROFILE_',
    body: (identity: string) => ({ user: { ...userFor(identity), name: 'PRIVATE_PROFILE_' + identity }, statistics: { reviews_count: 1, total_thanks_received: 0 }, bookmarked_lectures: [], user_reviews: [], ranking_position: { position: 1, total_users: 2, user_reviews_count: 1 } }),
  },
  {
    path: '/mypage/reviews', api: '/api/v1/mypage/reviews', marker: 'PRIVATE_MYREVIEW_',
    body: (identity: string) => ({ reviews: [review('PRIVATE_MYREVIEW_' + identity)], pagination, statistics: { total_reviews: 1, average_rating: 4.5 } }),
  },
  {
    path: '/mypage/bookmarks', api: '/api/v1/mypage/bookmarks', marker: 'PRIVATE_BOOKMARK_',
    body: (identity: string) => ({ bookmarks: [{ ...lecture, title: 'PRIVATE_BOOKMARK_' + identity, bookmarked_at: '2026-10-06T00:00:00Z' }], pagination, statistics: { total_bookmarks: 1 } }),
  },
]

for (const item of privatePages) for (const fails of [false, true]) {
  test(`${item.path}の旧A遅延応答はB${fails ? '取得失敗' : '表示'}後に混入しない`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, 'A')
    let releaseA!: () => void
    let seenA!: () => void
    const pendingA = new Promise<void>(resolve => { releaseA = resolve })
    const receivedA = new Promise<void>(resolve => { seenA = resolve })
    let returnedA = 0
    let returnedB = 0
    await page.route(`**${item.api}**`, async route => {
      const identity = route.request().headers().authorization === `Bearer ${tokenFor('A')}` ? 'A' : 'B'
      if (identity === 'A') { seenA(); await pendingA }
      await route.fulfill({ status: identity === 'B' && fails ? 503 : 200, json: item.body(identity) })
      if (identity === 'A') returnedA += 1
      else returnedB += 1
    })
    await page.goto(item.path)
    await receivedA
    await installSession(context, baseURL!, 'B')
    await notifySessionChanged(page)
    await expect.poll(() => returnedB).toBeGreaterThan(0)
    if (!fails) await expect.poll(() => mainContains(page, item.marker + 'B')).toBe(true)

    releaseA()
    await expect.poll(() => returnedA).toBeGreaterThan(0)
    await page.waitForTimeout(150)

    expect(await mainContains(page, item.marker + 'A')).toBe(false)
    if (!fails) expect(await mainContains(page, item.marker + 'B')).toBe(true)
  })
}

test('旧アカウントの遅いuser metadata応答でBの編集権限表示を上書きしない', async ({ page, context, baseURL }) => {
  await installSession(context, baseURL!, 'A')
  await serverReviews(page, true)
  let releaseA!: () => void
  let seenA!: () => void
  const pendingA = new Promise<void>(resolve => { releaseA = resolve })
  const receivedA = new Promise<void>(resolve => { seenA = resolve })
  let returnedA = 0
  await page.route('**/api/v1/auth/me', async route => {
    const identity = route.request().headers().authorization === `Bearer ${tokenFor('A')}` ? 'A' : 'B'
    if (identity === 'A') { seenA(); await pendingA }
    await route.fulfill({ json: { user: userFor(identity) } })
    if (identity === 'A') returnedA += 1
  })
  await page.goto('/lectures/3886')
  await receivedA
  await expect.poll(() => mainContains(page, privateMarker)).toBe(true)
  await serverReviews(page, false)
  await installSession(context, baseURL!, 'B')
  await notifySessionChanged(page)
  await expect.poll(() => mainContains(page, privateContent.slice(0, 30))).toBe(true)
  releaseA()
  await expect.poll(() => returnedA).toBeGreaterThan(0)
  await page.waitForTimeout(150)
  await expect(page.getByRole('button', { name: '編集', exact: true })).toHaveCount(0)
  expect(await mainContains(page, privateMarker)).toBe(false)
})

for (const initialLoading of [false, true]) {
  test(`${initialLoading ? '初回session取得待機' : '同じAPIトークンのsession更新'}で検索入力を保持する`, async ({ page, context, baseURL }) => {
    await installSession(context, baseURL!, 'A')
    await page.route('**/api/v1/lectures?**', route => route.fulfill({ json: { lectures: [], pagination } }))
    let releaseSession!: () => void
    const pending = new Promise<void>(resolve => { releaseSession = resolve })
    if (initialLoading) await page.route('**/api/auth/session', async route => { await pending; return route.continue() })
    await page.goto('/lectures')
    if (!initialLoading) await expect(page.getByText('利用者 A', { exact: true })).toBeVisible()
    const search = page.getByPlaceholder('授業・教授')
    await search.fill('編集中の検索語')
    if (initialLoading) releaseSession()
    else await notifySessionChanged(page)
    await expect(page.getByText('利用者 A', { exact: true })).toBeVisible()
    await page.waitForTimeout(150)
    await expect(search).toHaveValue('編集中の検索語')
  })
}
