import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  buildLectureReviewsResponse, dismissInstallPromptIfVisible, fixtures, mockHomePageData,
  mockLectureDetail, mockLectureReviews, mockMypage, mockSession,
} from './review-access.helpers'
import { countCharacters, reviewContentError, truncateCharacters } from '../../app/_helpers/reviewContent'
import { isValidPageNumber, readPageNumber } from '../../app/_helpers/pagination'

const backend = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
const loggedIn = {
  authenticated: true as const,
  user: { id: '1', name: 'テスト利用者', email: 'test@example.com' },
  backendToken: 'test-only-backend-token',
}

async function mockBackend(page: Page, path: string, body: unknown, status = 200) {
  await page.request.post(`${backend}/_test/response`, { data: { path, status, body } })
}

function lectureList(titles: string[], currentPage = 1, totalPages = 1, totalCount = titles.length) {
  return {
    lectures: titles.map((title, index) => ({
      id: 5000 + currentPage * 100 + index, title, lecturer: 'テスト教員', faculty: 'T:工学部', avg_rating: 4, review_count: 1,
    })),
    pagination: { current_page: currentPage, total_pages: totalPages, total_count: totalCount, per_page: 20 },
  }
}

// Safari は変換確定の Enter を isComposing=false, keyCode=229 で送る。
async function pressSafariImeEnter(target: Locator) {
  await target.evaluate(element => {
    for (const type of ['keydown', 'keyup']) {
      const event = new KeyboardEvent(type, { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })
      Object.defineProperty(event, 'keyCode', { get: () => 229 })
      element.dispatchEvent(event)
    }
  })
}

// Chrome/Firefox は変換確定の Enter を isComposing=true で送る。
async function pressComposingEnter(target: Locator) {
  await target.evaluate(element => {
    for (const type of ['keydown', 'keyup']) {
      element.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true, cancelable: true }))
    }
  })
}

// 実際の IME 入力に近い形で、未確定文字列を作ってから Enter を押し、その後に確定させる。
async function typeWithIme(page: Page, target: Locator, text: string) {
  const cdp = await page.context().newCDPSession(page)
  await target.focus()
  await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length })
  await pressComposingEnter(target)
  await cdp.send('Input.insertText', { text })
  await cdp.detach()
}

async function pageWidth(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth)
}

const longUrl = `https://example.com/syllabus?${Array.from({ length: 40 }, (_, index) => `key${index}=value${index}`).join('&')}`
const longContent = [
  '1行目のコメントです。',
  '2行目のコメントです。',
  longUrl,
  'w'.repeat(300),
  '<img src=x onerror="window.__reviewXss=1">',
].join('\n')

test.describe('入力ヘルパー', () => {
  test('コメントはコードポイントで数え、前後の空白だけの入力を拒否する', () => {
    expect(countCharacters('😀'.repeat(20))).toBe(20)
    expect(reviewContentError(' \n　'.repeat(10))).toBe('コメントを入力してください')
    expect(reviewContentError('\u0085'.repeat(30))).toBe('コメントを入力してください')
    expect(reviewContentError('😀'.repeat(29))).toBe('コメントは30文字以上で入力してください')
    expect(reviewContentError(` ${'あ'.repeat(29)} `)).toBe('コメントは30文字以上で入力してください')
    expect(reviewContentError('😀'.repeat(30))).toBe('')
    expect(reviewContentError('😀'.repeat(1000))).toBe('')
    expect(reviewContentError('😀'.repeat(1001))).toBe('コメントは1000文字以内で入力してください')
    expect(truncateCharacters('😀'.repeat(81), 80)).toBe(`${'😀'.repeat(80)}...`)
    expect(truncateCharacters('😀'.repeat(80), 80)).toBe('😀'.repeat(80))
  })

  test('不正なページ番号は1ページ目として扱う', () => {
    for (const value of ['abc', '0', '-1', '1.5', '99999', '', null]) {
      expect(isValidPageNumber(value)).toBe(false)
      expect(readPageNumber(value)).toBe(1)
    }
    expect(readPageNumber('03')).toBe(3)
  })
})

test.describe('検索の日本語入力', () => {
  test('授業一覧: 変換確定の Enter では検索せず、確定後の Enter で検索する', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockBackend(page, '/api/v1/lectures?page=1', lectureList(['通常の授業']))
    let browserReads = 0
    await page.route('**/api/public/lectures?**', route => {
      browserReads++
      return route.fulfill({ json: lectureList(['検索結果の授業']) })
    })
    await page.goto('/lectures')
    await dismissInstallPromptIfVisible(page)
    const input = page.getByPlaceholder('授業・教授')
    await expect(input).toBeEditable()

    await typeWithIme(page, input, '授業')
    await pressComposingEnter(input)
    await pressSafariImeEnter(input)
    await page.waitForTimeout(500)
    expect(browserReads).toBe(0)
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('授業')
    expect(new URL(page.url()).searchParams.get('search')).toBeNull()

    await input.press('Enter')
    await expect(page.getByRole('heading', { name: '検索結果の授業', exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.get('search')).toBe('授業')
    expect(browserReads).toBe(1)
  })

  test('ホーム: 変換確定の Enter とキーを離した操作では移動しない', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockHomePageData(page)
    await page.goto('/')
    await dismissInstallPromptIfVisible(page)
    const input = page.getByPlaceholder('授業名、教授名、学部名で検索...')
    await expect(input).toBeEditable()
    // 画面遷移の速さに左右されないよう、検索処理が呼ばれたこと自体（保存とリクエスト）を見る
    const lectureRequests: string[] = []
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/lectures')) lectureRequests.push(request.url())
    })

    await typeWithIme(page, input, 'じゅぎょう')
    await pressComposingEnter(input)
    await pressSafariImeEnter(input)
    // 以前は keyup で検索していた。確定後に離した Enter だけでは移動しない。
    await input.evaluate(element => element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })))
    await page.waitForTimeout(800)
    expect(await page.evaluate(() => sessionStorage.getItem('searchWord'))).toBeNull()
    expect(lectureRequests).toEqual([])
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(input).toHaveValue('じゅぎょう')

    await input.press('Enter')
    await expect(page).toHaveURL(/\/lectures\?search=/)
    expect(new URL(page.url()).searchParams.get('search')).toBe('じゅぎょう')
  })
})

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test.describe(`長いレビュー本文 (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('授業詳細: URLや連続文字で横にはみ出さず、改行を保ち、HTMLとして解釈しない', async ({ page }) => {
      await mockSession(page, { authenticated: false })
      await mockLectureDetail(page, fixtures.lectureResponse)
      await mockLectureReviews(page, buildLectureReviewsResponse({
        restrictionEnabled: false, accessGranted: true,
        reviews: [{ ...fixtures.firstReview, content: longContent }, { ...fixtures.secondReview, content: longContent }],
      }))
      await page.goto(`/lectures/${fixtures.lectureId}`)
      await dismissInstallPromptIfVisible(page)
      const comment = page.locator('p', { hasText: '1行目のコメントです。' }).first()
      await expect(comment).toBeVisible()
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
      expect(await comment.evaluate(element => getComputedStyle(element).whiteSpace)).toBe('pre-line')
      expect(await comment.innerText()).toContain('1行目のコメントです。\n2行目のコメントです。')
      await expect(comment).toContainText('<img src=x onerror=')
      expect(await page.evaluate(() => (window as unknown as { __reviewXss?: number }).__reviewXss)).toBeUndefined()
    })

    test('授業詳細: 閲覧制限中のぼかし表示でも横にはみ出さない', async ({ page }) => {
      await mockSession(page, { authenticated: false })
      await mockLectureDetail(page, fixtures.lectureResponse)
      await mockLectureReviews(page, buildLectureReviewsResponse({
        restrictionEnabled: true, accessGranted: false, maskContent: true,
        reviews: [{ ...fixtures.firstReview, content: longContent }, { ...fixtures.secondReview, content: 'w'.repeat(300) }],
      }))
      await page.goto(`/lectures/${fixtures.lectureId}`)
      await dismissInstallPromptIfVisible(page)
      await expect(page.getByText('ログイン&1レビューして閲覧する')).toBeVisible()
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
    })

    test('ホームの最新レビュー: 横にはみ出さず改行を保つ', async ({ page }) => {
      await mockSession(page, { authenticated: false })
      await mockHomePageData(page, { latestReviews: [{
        id: 701, rating: 5, content: longContent, created_at: '2026-03-21T00:00:00.000Z',
        lecture: { id: 5001, title: '最新レビュー表示用授業', lecturer: '表示確認教員', faculty: '工学部', avg_rating: 4.8, review_count: 3 },
      }] })
      await page.goto('/')
      await dismissInstallPromptIfVisible(page)
      const comment = page.locator('p', { hasText: '1行目のコメントです。' }).first()
      await expect(comment).toBeAttached()
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
      expect(await comment.evaluate(element => getComputedStyle(element).whiteSpace)).toBe('pre-line')
    })

    test('マイページと投稿レビュー一覧: 横にはみ出さない', async ({ page }) => {
      await mockSession(page, loggedIn)
      const userReview = { ...fixtures.mypageResponse.user_reviews[0], content: `${'w'.repeat(60)}\n${longUrl}` }
      await mockMypage(page, { ...fixtures.mypageResponse, user_reviews: [userReview] })
      await page.route('**/api/v1/mypage/reviews**', route => route.fulfill({ json: {
        reviews: [{ ...userReview, lecture: { id: 3886, title: 'テスト授業', lecturer: 'テスト教員', faculty: '工学部' } }],
        pagination: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 },
        statistics: { total_reviews: 1, average_rating: 4 },
      } }))
      await page.goto('/mypage')
      await dismissInstallPromptIfVisible(page)
      await expect(page.getByText('w'.repeat(60), { exact: false }).first()).toBeVisible()
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
      await page.goto('/mypage/reviews')
      await expect(page.getByText('w'.repeat(60), { exact: false }).first()).toBeVisible()
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
    })
  })
}

for (const path of ['/mypage', '/mypage/reviews', '/mypage/bookmarks']) {
  test(`未ログインで ${path} を開いてもブラウザの戻るで元の画面へ戻れる`, async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await page.goto('/terms')
    await page.goto(path)
    await expect(page).toHaveURL(/\/auth\/signin/)
    await page.goBack()
    await expect(page).toHaveURL(/\/terms$/)
    await page.waitForTimeout(800)
    await expect(page).toHaveURL(/\/terms$/)
  })
}

test.describe('授業一覧のページ移動', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('ページを切り替えると結果の先頭を表示する', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    const titles = (number: number) => Array.from({ length: 20 }, (_, index) => `${number}ページ目の授業${index + 1}`)
    await mockBackend(page, '/api/v1/lectures?page=1', lectureList(titles(1), 1, 3, 50))
    await mockBackend(page, '/api/v1/lectures?page=2', lectureList(titles(2), 2, 3, 50))
    await page.goto('/lectures')
    await dismissInstallPromptIfVisible(page)
    await expect(page.getByRole('heading', { name: '1ページ目の授業1', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '2', exact: true }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: '2', exact: true }).click()
    const first = page.getByRole('heading', { name: '2ページ目の授業1', exact: true })
    await expect(first).toBeVisible()
    await expect(first).toBeInViewport()
    await expect(page.getByText('件の授業が見つかりました')).toBeInViewport()
    await expect(page).toHaveURL(/page=2/)
  })

  test('不正なページ番号はエラーにせず1ページ目を表示する', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    const query = new URLSearchParams({ page: '1', search: 'ページ確認' })
    await mockBackend(page, `/api/v1/lectures?${query}`, lectureList(['ページ確認の授業']))
    for (const bad of ['abc', '0', '99999', '1.5']) {
      await page.goto(`/lectures?page=${bad}&search=${encodeURIComponent('ページ確認')}`)
      await dismissInstallPromptIfVisible(page)
      await expect(page.getByRole('heading', { name: 'ページ確認の授業', exact: true })).toBeVisible()
      expect(new URL(page.url()).searchParams.get('page')).toBeNull()
      expect(new URL(page.url()).searchParams.get('search')).toBe('ページ確認')
      await expect(page.getByText('授業の取得に失敗しました')).toHaveCount(0)
    }
  })

  test('最終ページより後ろを開いたら戻り先を示す', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockBackend(page, '/api/v1/lectures?page=5', {
      lectures: [], pagination: { current_page: 5, total_pages: 2, total_count: 21, per_page: 20 },
    })
    await mockBackend(page, '/api/v1/lectures?page=2', lectureList(['2ページ目の授業'], 2, 2, 21))
    await page.goto('/lectures?page=5')
    await dismissInstallPromptIfVisible(page)
    await expect(page.getByRole('heading', { name: 'このページには授業がありません' })).toBeVisible()
    await page.getByRole('button', { name: '最後のページ（2ページ目）へ' }).click()
    await expect(page.getByRole('heading', { name: '2ページ目の授業', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/page=2/)
  })

  test('キーワードは255文字までしか入力できない', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockBackend(page, '/api/v1/lectures?page=1', lectureList(['通常の授業']))
    await page.goto('/lectures')
    await dismissInstallPromptIfVisible(page)
    const input = page.getByPlaceholder('授業・教授')
    await input.fill('あ'.repeat(300))
    await expect(input).toHaveValue('あ'.repeat(255))
  })

  test('詳細検索の教科書で「どちらでも」を選べる', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockBackend(page, '/api/v1/lectures?page=1', lectureList(['通常の授業']))
    let requested = ''
    await page.route('**/api/public/lectures?**', route => {
      requested = new URL(route.request().url()).searchParams.get('textbook') || ''
      return route.fulfill({ json: lectureList(['教科書どちらでもの授業']) })
    })
    await page.goto('/lectures')
    await dismissInstallPromptIfVisible(page)
    await page.getByRole('button', { name: '詳細検索' }).click()
    await page.locator('#textbook').selectOption('どちらでも')
    await page.getByRole('button', { name: '現在の検索条件で授業を検索' }).click()
    await expect(page.getByRole('heading', { name: '教科書どちらでもの授業', exact: true })).toBeVisible()
    expect(requested).toBe('どちらでも')
    expect(new URL(page.url()).searchParams.get('textbook')).toBe('どちらでも')
  })
})

test('ホーム: 総レビュー数を取得できないときに架空の件数を表示しない', async ({ page }) => {
  await mockSession(page, { authenticated: false })
  await mockHomePageData(page)
  await mockBackend(page, '/api/v1/reviews/total', { error: 'unavailable' }, 503)
  await page.goto('/')
  await dismissInstallPromptIfVisible(page)
  await expect(page.getByText('現在の総レビュー数')).toBeVisible()
  await page.waitForTimeout(3500)
  await expect(page.getByText('取得できませんでした')).toBeAttached()
  await expect(page.getByText(/^1000\+?$/)).toHaveCount(0)
})

test.describe('レビュー投稿フォーム', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockLectureDetail(page, fixtures.lectureResponse)
  })

  test('空白だけ・絵文字の文字数をバックエンドと同じ基準で検証する', async ({ page }) => {
    let posted = 0
    await page.route('**/api/v1/lectures/*/reviews', route => {
      if (route.request().method() === 'POST') posted++
      return route.fallback()
    })
    await page.goto(`/lectures/${fixtures.lectureId}/review`)
    await dismissInstallPromptIfVisible(page)
    const textarea = page.locator('#content')
    const submit = page.getByRole('button', { name: 'レビューを投稿' })
    await expect(textarea).not.toHaveAttribute('maxlength', /.*/)

    await textarea.fill(`${' '.repeat(15)}${'\n'.repeat(15)}`)
    await submit.click()
    await expect(page.getByText('コメントを入力してください', { exact: true })).toBeVisible()

    await textarea.fill('😀'.repeat(20))
    await submit.click()
    await expect(page.getByText('コメントは30文字以上で入力してください', { exact: true })).toBeVisible()

    await textarea.fill('😀'.repeat(1000))
    await expect(textarea).toHaveValue('😀'.repeat(1000))
    await expect(page.getByText('1000 / 1000文字', { exact: true })).toBeVisible()
    await submit.click()
    await expect(page.getByText(/^コメントは/)).toHaveCount(0)

    await textarea.fill('😀'.repeat(1001))
    await submit.click()
    await expect(page.getByText('コメントは1000文字以内で入力してください', { exact: true })).toBeVisible()
    expect(posted).toBe(0)
  })

  test('選択欄をキーボードで操作してもフォーカスが外れない', async ({ page }) => {
    await page.goto(`/lectures/${fixtures.lectureId}/review`)
    await dismissInstallPromptIfVisible(page)
    const combo = page.getByRole('combobox', { name: '教科書' })
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
    await combo.focus()
    await page.keyboard.press('ArrowDown')
    await expect(combo).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('listbox', { name: '教科書' })).toBeVisible()
    await expect(combo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(combo).toHaveAttribute('aria-activedescendant', 'textbook-option-1')
    await expect(combo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(combo).toHaveText('不要')
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
    await expect(combo).toBeFocused()

    // 本文の入力で親が再描画されても、選択欄の要素は作り直されない
    await combo.evaluate(element => { (element as HTMLElement).dataset.marker = 'kept' })
    await page.locator('#content').pressSequentially('あいう')
    await expect(combo).toHaveAttribute('data-marker', 'kept')

    await combo.focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('listbox', { name: '教科書' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
    await expect(combo).toBeFocused()

    await combo.click()
    await page.getByRole('option', { name: 'どちらでも' }).click()
    await expect(combo).toHaveText('どちらでも')
    await expect(combo).toBeFocused()
    await expect(page.getByRole('listbox', { name: '教科書' })).toBeHidden()
  })
})

test.describe('レビュー編集モーダル', () => {
  for (const scenario of [
    { name: '空白だけの本文は送信しない', content: ' '.repeat(40), error: 'コメントを入力してください' },
    { name: '20文字の絵文字は送信しない', content: '😀'.repeat(20), error: 'コメントは30文字以上で入力してください' },
    { name: '600文字の絵文字は1000文字以内として送信できる', content: '😀'.repeat(600), error: null },
  ]) {
    test(scenario.name, async ({ page }) => {
      await mockSession(page, loggedIn)
      const review = {
        id: 100, rating: 3, content: '元'.repeat(30), textbook: '', attendance: '', grading_type: '',
        content_difficulty: '', content_quality: '', period_year: '', period_term: '', thanks_count: 0,
        created_at: '2026-10-01T00:00:00Z', lecture: { id: 3886, title: 'テスト授業', lecturer: 'テスト教員', faculty: '工学部' },
      }
      let updated: { content: string } | null = null
      await page.route('**/api/v1/mypage/reviews**', route => route.fulfill({ json: {
        reviews: [review], pagination: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 },
        statistics: { total_reviews: 1, average_rating: 3 },
      } }))
      await page.route('**/api/v1/reviews/100', async route => {
        updated = route.request().postDataJSON().review
        await route.fulfill({ json: { review: { ...review, ...updated } } })
      })
      await page.goto('/mypage/reviews')
      await dismissInstallPromptIfVisible(page)
      await page.getByRole('button', { name: '編集', exact: true }).click()
      const modal = page.locator('.ReactModal__Content')
      const textarea = modal.locator('textarea')
      await expect(textarea).not.toHaveAttribute('maxlength', /.*/)
      await textarea.fill(scenario.content)
      await expect(textarea).toHaveValue(scenario.content)
      await modal.getByRole('button', { name: '更新', exact: true }).click()
      if (scenario.error) {
        await expect(page.getByText(scenario.error, { exact: true })).toBeVisible()
        expect(updated).toBeNull()
      } else {
        await expect(modal).toHaveCount(0)
        expect(updated).toEqual(expect.objectContaining({ content: scenario.content }))
      }
    })
  }
})

test.describe('モーダル', () => {
  test('レビュー閲覧の案内は背景クリックとEscで閉じ、開いたボタンへフォーカスを戻す', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockLectureDetail(page, fixtures.lectureResponse)
    await mockLectureReviews(page, buildLectureReviewsResponse({
      restrictionEnabled: true, accessGranted: false, maskContent: true,
      reviews: [fixtures.firstReview, fixtures.secondReview],
    }))
    await page.goto(`/lectures/${fixtures.lectureId}`)
    await dismissInstallPromptIfVisible(page)
    const trigger = page.getByRole('button', { name: 'ログイン&1レビューして閲覧する' })
    const dialog = page.getByRole('dialog')

    await trigger.click()
    await expect(dialog).toBeVisible()
    // カード内のクリックでは閉じない
    await dialog.getByText('新大生の皆さんがあなたのレビューを待っています！').click()
    await expect(dialog).toBeVisible()
    // Tab でモーダルの外へ出ない
    for (let index = 0; index < 6; index++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.ReactModal__Content')))).toBe(true)
    }
    await page.mouse.click(5, 5)
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('ログイン案内は背景クリックで閉じ、ログインリンクの中にボタンを入れない', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockLectureDetail(page, fixtures.lectureResponse)
    await mockLectureReviews(page, buildLectureReviewsResponse({
      restrictionEnabled: false, accessGranted: true, reviews: [fixtures.firstReview],
    }))
    await page.goto(`/lectures/${fixtures.lectureId}`)
    await dismissInstallPromptIfVisible(page)
    await page.getByRole('button', { name: /ありがとう/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'ありがとう機能' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'ログインする' })).toBeVisible()
    await expect(dialog.locator('a button')).toHaveCount(0)
    await page.mouse.click(5, 5)
    await expect(dialog).toHaveCount(0)
  })
})

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test.describe(`ヘッダー (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('未ログイン: リンクに名前があり、リンクの中にボタンを入れない', async ({ page }) => {
      await mockSession(page, { authenticated: false })
      await mockHomePageData(page)
      await page.goto('/')
      await dismissInstallPromptIfVisible(page)
      const header = page.getByRole('banner')
      await expect(header.getByRole('link', { name: 'レビューする' })).toBeVisible()
      await expect(header.getByRole('link', { name: 'ログイン' })).toBeVisible()
      await expect(header.locator('a button, button a')).toHaveCount(0)
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width)
    })

    test('ログイン中: マイページへのリンクに名前がある', async ({ page }) => {
      await mockSession(page, loggedIn)
      await mockHomePageData(page)
      await page.goto('/')
      await dismissInstallPromptIfVisible(page)
      const header = page.getByRole('banner')
      await expect(header.getByRole('link', { name: /マイページ/ })).toBeVisible()
      await expect(header.locator('a button, button a')).toHaveCount(0)
    })
  })
}
