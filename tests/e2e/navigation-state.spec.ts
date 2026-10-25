import { expect, test, type Page } from '@playwright/test'
import { mockSession, dismissInstallPromptIfVisible } from './review-access.helpers'
import { publicLectureQuery } from '../../app/_helpers/lectureSearch'

const backend = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const pagination = (page: number) => ({ current_page: page, total_pages: 2, total_count: 21, per_page: 10 })
const lecture = { id: 3886, title: 'テスト用授業', lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4.5, review_count: 2 }
const list = (title: string, page = 1) => ({ lectures: [{ ...lecture, title }], pagination: pagination(page) })

test.beforeEach(async ({ page }) => { await mockSession(page, { authenticated: false }) })

test('公開一覧から詳細・投稿へ進み2回戻っても全検索条件と結果が一致する', async ({ page }) => {
  const params = new URLSearchParams({ search: '往復', sort: 'highestRating', page: '2', textbook: '必要' })
  await page.request.post(`${backend}/_test/response`, { data: {
    path: '/api/v1/lectures?' + publicLectureQuery(params), body: list('往復検索の2ページ目', 2),
  } })
  await page.goto('/lectures?' + params)
  await page.locator('main a[href="/lectures/3886"]').first().click()
  await page.locator('a[href="/lectures/3886/review"]').first().click()
  await expect(page.locator('#content')).toBeVisible()
  await page.goBack(); await expect(page).toHaveURL(/\/lectures\/3886$/)
  await page.goBack(); await expect(page).toHaveURL('/lectures?' + params)
  await expect(page.getByRole('heading', { name: '往復検索の2ページ目', exact: true })).toBeVisible()
})

test('投稿する授業の検索2ページ目からフォームへ進んで戻っても検索結果を復元する', async ({ page }) => {
  await page.route('**/api/v1/lectures?**', route => {
    const p = Number(new URL(route.request().url()).searchParams.get('page') || 1)
    return route.fulfill({ json: list(`投稿候補${p}ページ目`, p) })
  })
  await page.goto('/reviews/new')
  await page.getByPlaceholder('授業名、講師名で検索...').fill('候補')
  await expect(page.getByRole('heading', { name: '投稿候補1ページ目', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '次へ', exact: true }).click()
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: '投稿候補2ページ目', exact: true }) }).click()
  await expect(page.locator('#content')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '投稿候補2ページ目', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('授業名、講師名で検索...')).toHaveValue('候補')
  expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  await page.goBack()
  await expect(page.getByRole('heading', { name: '投稿候補1ページ目', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: '投稿候補2ページ目', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '投稿候補2ページ目', exact: true })).toBeVisible()
})

for (const kind of ['reviews', 'bookmarks'] as const) {
  test(`マイページの${kind}2ページ目から詳細へ進んで戻っても同じページを復元する`, async ({ page }) => {
    await mockSession(page, { authenticated: true, backendToken: 'navigation-test-token',
      user: { id: '1', name: 'テスト利用者', email: 'navigation@example.test' } })
    let delayPage2 = false, release!: () => void, seen!: () => void
    const pending = new Promise<void>(r => { release = r }), received = new Promise<void>(r => { seen = r })
    await page.route(`**/api/v1/mypage/${kind}**`, async route => {
      const p = Number(new URL(route.request().url()).searchParams.get('page') || 1)
      if (delayPage2 && p === 2) { seen(); await pending }
      const title = `${kind}の${p}ページ目`
      const data = kind === 'reviews' ? {
        reviews: [{ id: 101, rating: 4, content: title, thanks_count: 0, created_at: '2026-10-01T00:00:00Z', lecture: { ...lecture, title } }],
        pagination: pagination(p), statistics: { total_reviews: 21, average_rating: 4 },
      } : {
        bookmarks: [{ ...lecture, title, bookmarked_at: '2026-10-01T00:00:00Z' }],
        pagination: pagination(p), statistics: { total_bookmarks: 21 },
      }
      return route.fulfill({ json: data })
    })
    await page.goto('/mypage/' + kind)
    await page.getByRole('button', { name: '2', exact: true }).click()
    await page.getByRole('link', { name: `${kind}の2ページ目`, exact: true }).click()
    await expect(page).toHaveURL(/\/lectures\/3886$/)
    await page.goBack()
    await expect(page.getByRole('link', { name: `${kind}の2ページ目`, exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.get('page')).toBe('2')
    await page.goBack()
    await expect(page.getByRole('link', { name: `${kind}の1ページ目`, exact: true })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('link', { name: `${kind}の2ページ目`, exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('link', { name: `${kind}の1ページ目`, exact: true })).toBeVisible()
    delayPage2 = true
    await page.getByRole('button', { name: '2', exact: true }).click(); await received
    await page.goBack()
    await expect(page.getByRole('link', { name: `${kind}の1ページ目`, exact: true })).toBeVisible()
    release(); await page.waitForTimeout(200)
    await expect(page.getByRole('link', { name: `${kind}の2ページ目`, exact: true })).toHaveCount(0)
  })
}

test('投稿授業検索を消した後に遅い応答が届いても結果が復活しない', async ({ page }) => {
  let release!: () => void, seen!: () => void
  const pending = new Promise<void>(r => { release = r }), received = new Promise<void>(r => { seen = r })
  await page.route('**/api/v1/lectures?**', async route => {
    seen(); await pending; await route.fulfill({ json: list('消した古い検索結果') })
  })
  await page.goto('/reviews/new')
  await page.getByPlaceholder('授業名、講師名で検索...').fill('古い検索'); await received
  await page.getByPlaceholder('授業名、講師名で検索...').fill('')
  release(); await page.waitForTimeout(500)
  await expect(page.getByRole('heading', { name: '消した古い検索結果', exact: true })).toHaveCount(0)
})

test('投稿授業検索のキャッシュへ戻った後に遅い別条件の応答が上書きしない', async ({ page }) => {
  let release!: () => void, seen!: () => void
  const pending = new Promise<void>(r => { release = r }), received = new Promise<void>(r => { seen = r })
  await page.route('**/api/v1/lectures?**', async route => {
    const word = new URL(route.request().url()).searchParams.get('search')
    if (word === '遅い') { seen(); await pending }
    await route.fulfill({ json: list(word === '遅い' ? '遅い別条件の授業' : '保存済み条件の授業') })
  })
  await page.goto('/reviews/new')
  const input = page.getByPlaceholder('授業名、講師名で検索...')
  await input.fill('保存済み'); await expect(page.getByRole('heading', { name: '保存済み条件の授業', exact: true })).toBeVisible()
  await input.fill('遅い'); await received
  await input.fill('保存済み')
  await page.waitForTimeout(450)
  release(); await page.waitForTimeout(400)
  await expect(page.getByRole('heading', { name: '保存済み条件の授業', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '遅い別条件の授業', exact: true })).toHaveCount(0)
})

test('投稿フォームを離れた後の授業取得失敗で別画面へ飛ばされない', async ({ page }) => {
  let release!: () => void, seen!: () => void
  const pending = new Promise<void>(r => { release = r }), received = new Promise<void>(r => { seen = r })
  await page.route('**/api/v1/lectures/3886', async route => {
    seen(); await pending; await route.fulfill({ status: 503, json: { error: 'delayed failure' } })
  })
  await page.goto('/lectures/3886/review'); await received
  await dismissInstallPromptIfVisible(page)
  await page.locator('a[href="/"]').first().click(); await expect(page).toHaveURL('/')
  release(); await page.waitForTimeout(600)
  await expect(page).toHaveURL('/')
})

test('授業ID指定の投稿リンクからブラウザで戻っても自動転送を繰り返さない', async ({ page }) => {
  await page.goto('/')
  await page.goto('/reviews/new?lectureId=3886')
  await expect(page.locator('#content')).toBeVisible()
  await expect(page).toHaveURL(/\/lectures\/3886\/review$/)
  await page.goBack()
  await expect(page).toHaveURL('/')
})

test('投稿授業検索の連続入力を保持し、画面を離れた後の入力待ち処理でURLを変えない', async ({ page }) => {
  await page.route('**/api/v1/lectures?**', route => {
    const word = new URL(route.request().url()).searchParams.get('search') || ''
    return route.fulfill({ json: list(word + 'の結果') })
  })
  await page.goto('/reviews/new')
  const input = page.getByPlaceholder('授業名、講師名で検索...')
  await input.pressSequentially('continuous', { delay: 40 })
  await expect(page.getByRole('heading', { name: 'continuousの結果', exact: true })).toBeVisible()
  await expect(input).toHaveValue('continuous')
  await input.fill('離れた後に反映しない')
  await page.locator('a[href="/"]').first().click()
  await expect(page).toHaveURL('/')
  await page.waitForTimeout(500)
  await expect(page).toHaveURL('/')
})
