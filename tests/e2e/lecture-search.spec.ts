import { expect, test, type Page } from '@playwright/test'
import { publicLectureQuery } from '../../app/_helpers/lectureSearch'

const backend = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const body = (title: string, page = 1) => ({
  lectures: [{ id: 4001, title, lecturer: 'テスト教員', faculty: 'T:工学部', avg_rating: 4.5, review_count: 1 }],
  pagination: { current_page: page, total_pages: 2, total_count: 21, per_page: 20 },
})
async function list(page: Page, query: string, title: string, number = 1, status = 200, delayMs = 0) {
  await page.request.post(`${backend}/_test/response`, { data: {
    path: `/api/v1/lectures?${query}`, status, body: body(title, number), delayMs,
  } })
}
test.beforeEach(async ({ page }) => {
  await page.request.post(`${backend}/_test/reset`)
  await list(page, 'page=1', '通常の授業')
})

test('初回HTMLに結果を含め、ブラウザから重ねて一覧を取得しない', async ({ page }) => {
  const html = await (await page.request.get('/lectures')).text()
  expect(html).toContain('通常の授業')
  let browserReads = 0
  await page.route('**/api/public/lectures?**', route => { browserReads++; return route.abort() })
  await page.goto('/lectures')
  await expect(page.getByRole('heading', { name: '通常の授業', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('授業・教授')).toBeEditable()
  expect(browserReads).toBe(0)
})

test('ホームの検索条件をURLで渡し、結果をブラウザから重ねて取得しない', async ({ page }) => {
  const params = new URLSearchParams({ page: '1', search: 'ホーム検索' })
  await list(page, params.toString(), 'ホーム検索の授業')
  let browserReads = 0
  await page.route('**/api/public/lectures?**', route => { browserReads++; return route.abort() })
  await page.goto('/')
  await page.getByPlaceholder('授業名、教授名、学部名で検索...').fill('ホーム検索')
  await page.getByPlaceholder('授業名、教授名、学部名で検索...').press('Enter')
  await expect(page.getByRole('heading', { name: 'ホーム検索の授業', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('search')).toBe('ホーム検索')
  expect(browserReads).toBe(0)
})

test('検索・学部・ページ移動と戻る進む操作でURLと結果が一致する', async ({ page }) => {
  const query = new URLSearchParams({ page: '1', search: '検索A', faculty: 'T:工学部' })
  await list(page, query.toString(), '検索Aの1ページ目')
  query.set('page', '2'); await list(page, query.toString(), '検索Aの2ページ目', 2)
  await page.goto('/lectures')
  await page.getByPlaceholder('授業・教授').fill('検索A')
  await page.locator('select').first().selectOption('T:工学部')
  await page.getByPlaceholder('授業・教授').press('Enter')
  await expect(page.getByRole('heading', { name: '検索Aの1ページ目', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByRole('heading', { name: '検索Aの2ページ目', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/page=2/)
  await page.goBack()
  await expect(page.getByRole('heading', { name: '検索Aの1ページ目', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('授業・教授')).toHaveValue('検索A')
  await page.goForward()
  await expect(page.getByRole('heading', { name: '検索Aの2ページ目', exact: true })).toBeVisible()
})

test('保存済みの検索条件を復元し、再読込時はそのURLの結果を先に表示する', async ({ page }) => {
  const query = new URLSearchParams({ page: '1', search: '保存検索' })
  await list(page, query.toString(), '保存検索の授業')
  await page.addInitScript(() => { if (!location.search) sessionStorage.setItem('searchWord', '保存検索') })
  await page.goto('/lectures')
  await expect(page.getByRole('heading', { name: '保存検索の授業', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('授業・教授')).toHaveValue('保存検索')
  await expect(page).toHaveURL(/search=/)
  await page.reload()
  await expect(page.getByRole('heading', { name: '保存検索の授業', exact: true })).toBeVisible()
})

test('URLの並び順と全詳細条件を初期表示と次の検索へ引き継ぐ', async ({ page }) => {
  const params = new URLSearchParams({ sort: 'highestRating', faculty: 'T:工学部', period_year: String(new Date().getFullYear()),
    period_term: '1ターム', textbook: '必要', attendance: '毎回確認', grading_type: 'テストのみ',
    content_difficulty: '楽', content_quality: '良い', detailed: 'true' })
  await list(page, publicLectureQuery(params), '詳細条件の授業')
  await page.goto('/lectures?' + params.toString())
  await expect(page.getByRole('heading', { name: '詳細条件の授業', exact: true })).toBeVisible()
  await expect(page.locator('#sort-select')).toHaveValue('highestRating')
  await expect(page.locator('#period-term')).toHaveValue('1ターム')
  await expect(page.locator('#textbook')).toHaveValue('必要')
  await expect(page.locator('#attendance')).toHaveValue('毎回確認')
  await expect(page.locator('#grading-type')).toHaveValue('テストのみ')
  await expect(page.locator('#content-difficulty')).toHaveValue('楽')
  await expect(page.locator('#content-quality')).toHaveValue('良い')
  params.set('search', '条件を維持'); await list(page, publicLectureQuery(params), '条件を維持した授業')
  await page.getByPlaceholder('授業・教授').fill('条件を維持')
  await page.getByPlaceholder('授業・教授').press('Enter')
  await expect(page.getByRole('heading', { name: '条件を維持した授業', exact: true })).toBeVisible()
  const actual = new URL(page.url()).searchParams
  for (const [key, value] of Array.from(params.entries())) if (key !== 'detailed') expect(actual.get(key)).toBe(value)
})

test('失敗した検索を同じ条件で再試行できる', async ({ page }) => {
  const query = new URLSearchParams({ page: '1', search: '再試行' })
  await list(page, query.toString(), '未使用', 1, 503)
  await page.goto('/lectures')
  await page.getByPlaceholder('授業・教授').fill('再試行')
  await page.getByPlaceholder('授業・教授').press('Enter')
  await expect(page.getByPlaceholder('授業・教授')).toBeVisible()
  await list(page, query.toString(), '復旧した授業')
  await page.getByPlaceholder('授業・教授').press('Enter')
  await expect(page.getByRole('heading', { name: '復旧した授業', exact: true })).toBeVisible()
})

test('遅い検索の途中で戻っても、後から届いた結果で上書きしない', async ({ page }) => {
  const query = new URLSearchParams({ page: '1', search: '遅い検索' })
  await list(page, query.toString(), '遅れて届く授業', 1, 200, 1200)
  await page.goto('/lectures')
  await page.getByPlaceholder('授業・教授').fill('遅い検索')
  const pending = page.waitForRequest(r => r.url().includes('/api/public/lectures?'))
  await page.getByPlaceholder('授業・教授').press('Enter'); await pending
  await page.goBack()
  await expect(page.getByRole('heading', { name: '通常の授業', exact: true })).toBeVisible()
  await page.waitForTimeout(1400)
  await expect(page.getByRole('heading', { name: '遅れて届く授業', exact: true })).toHaveCount(0)
})
