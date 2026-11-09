import { expect, test, type Page } from '@playwright/test'
import {
  dismissInstallPromptIfVisible,
  fixtures,
  mockAuthMe,
  mockHomePageData,
  mockLectureDetail,
  mockLectureReviews,
  mockLectureStatusEndpoints,
  mockSession,
} from './review-access.helpers'

// 画面に投稿者を表示していないため、投稿者の Google 表示名・アイコン URL・ユーザー ID を
// HTML や RSC payload に埋め込まないことを確認する。バックエンドが旧形式で返しても漏らさない。
const reviewerName = 'PRIVATE_REVIEWER_NAME_MARKER'
const reviewerAvatar = 'https://lh3.googleusercontent.com/a/PRIVATE_REVIEWER_AVATAR_MARKER'
const otherReviewerName = 'PRIVATE_OTHER_REVIEWER_MARKER'
const otherReviewerAvatar = 'https://lh3.googleusercontent.com/a/PRIVATE_OTHER_AVATAR_MARKER'
const reviewerMarkers = [reviewerName, reviewerAvatar, otherReviewerName, otherReviewerAvatar, 'PRIVATE_UNKNOWN_FIELD']
const lectureId = fixtures.lectureResponse.id

// 現行（修正前）バックエンドの形: user と user_id を含み、is_own はない。
const legacyBackendReviews = {
  reviews: [
    { ...fixtures.firstReview, user_id: 901, user: { id: 901, name: reviewerName, avatar_url: reviewerAvatar },
      internal_note: 'PRIVATE_UNKNOWN_FIELD', created_at: 'PRIVATE_CREATED_AT_MARKER', updated_at: 'PRIVATE_EDITED_AT_MARKER' },
    { ...fixtures.secondReview, user_id: 902, user: { id: 902, name: otherReviewerName, avatar_url: otherReviewerAvatar } },
  ],
  access: { restriction_enabled: false, access_granted: true },
}

// 修正後バックエンドの形: 投稿者情報はなく is_own だけを返す。
const currentBackendReviews = (ownId: number | null) => ({
  reviews: [fixtures.firstReview, fixtures.secondReview].map(({ user_id: _userId, ...review }) => ({
    ...review, is_own: review.id === ownId,
  })),
  access: { restriction_enabled: false, access_granted: true },
})

const viewer = (id: string) => ({ id, name: '閲覧中の利用者', email: `viewer-${id}@example.test`, reviews_count: 1 })

async function expectNoReviewerIdentity(text: string) {
  for (const marker of reviewerMarkers) expect(text).not.toContain(marker)
  expect(text).not.toContain('user_id')
  expect(text).not.toContain('匿名ユーザー')
  // 匿名レビューは編集できないため、レビューの投稿・編集時刻からログイン投稿かどうかや同じ人の投稿を推測させない
  // （授業自体の created_at / updated_at は対象外なので、レビューに入れた目印の値で確認する）
  expect(text).not.toContain('PRIVATE_CREATED_AT_MARKER')
  expect(text).not.toContain('PRIVATE_EDITED_AT_MARKER')
}

async function openLecture(page: Page, reviews: unknown, viewerId: string | null) {
  if (viewerId) {
    await mockSession(page, { authenticated: true, user: viewer(viewerId), backendToken: `test-only-token-${viewerId}` })
    await mockAuthMe(page, viewer(viewerId))
    await mockLectureStatusEndpoints(page, {}, lectureId, [fixtures.firstReview.id, fixtures.secondReview.id])
  } else {
    await mockSession(page, { authenticated: false })
  }
  await mockLectureDetail(page, fixtures.lectureResponse, lectureId)
  await mockLectureReviews(page, reviews as Parameters<typeof mockLectureReviews>[1], lectureId)

  const response = await page.goto(`/lectures/${lectureId}`)
  expect(response?.ok()).toBe(true)
  const html = await response!.text()
  await dismissInstallPromptIfVisible(page)
  await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible()
  return html
}

async function fetchRscPayload(page: Page) {
  const response = await page.request.get(`/lectures/${lectureId}`, { headers: { RSC: '1', 'Cache-Control': 'no-cache' } })
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('text/x-component')
  return response.text()
}

const editButtons = (page: Page) => page.getByRole('button', { name: '編集', exact: true })

test.describe('レビュー投稿者情報を公開ページに埋め込まない', () => {
  test('未ログイン: 旧形式のバックエンド応答でも HTML と RSC payload に投稿者情報が出ない', async ({ page }) => {
    const html = await openLecture(page, legacyBackendReviews, null)
    await expectNoReviewerIdentity(html)
    await expectNoReviewerIdentity(await fetchRscPayload(page))
    await expect(editButtons(page)).toHaveCount(0)
  })

  test('ログイン中: 旧形式のバックエンド応答でも本人のレビューだけ編集でき、投稿者情報は出ない', async ({ page }) => {
    const html = await openLecture(page, legacyBackendReviews, '901')
    await expectNoReviewerIdentity(html)
    await expectNoReviewerIdentity(await fetchRscPayload(page))
    await expect(editButtons(page)).toHaveCount(1)
    const ownCard = page.locator('div.space-y-6 > div').filter({ hasText: fixtures.firstReview.content })
    await expect(ownCard.getByRole('button', { name: '編集', exact: true })).toBeVisible()
  })

  test('ログイン中: is_own を返すバックエンドでは is_own のレビューだけ編集できる', async ({ page }) => {
    const html = await openLecture(page, currentBackendReviews(fixtures.secondReview.id), '1')
    await expectNoReviewerIdentity(html)
    await expect(editButtons(page)).toHaveCount(1)
    const ownCard = page.locator('div.space-y-6 > div').filter({ hasText: fixtures.secondReview.content })
    await expect(ownCard.getByRole('button', { name: '編集', exact: true })).toBeVisible()
  })

  test('ログイン中: 他人のレビューだけなら編集ボタンを出さない', async ({ page }) => {
    await openLecture(page, currentBackendReviews(null), '1')
    await expect(editButtons(page)).toHaveCount(0)
  })

  for (const backend of ['legacy', 'current'] as const) {
    // 更新応答から渡る項目は画面に出ないため、ここでは編集ボタンが残ることだけを確認する。
    // 許可リスト自体（toPublicReview）は tests/unit/public-review.test.cjs で確認する。
    test(`編集して保存したあとも本人の編集ボタンが残る（${backend}）`, async ({ page }) => {
      const reviews = backend === 'legacy' ? legacyBackendReviews : currentBackendReviews(fixtures.firstReview.id)
      await openLecture(page, reviews, '901')
      const updatedContent = '編集後の本文です。更新後も本人の編集ボタンが残ることを確認するための三十文字以上の文章です。'
      await page.route(`**/api/v1/reviews/${fixtures.firstReview.id}`, async route => {
        expect(route.request().method()).toBe('PATCH')
        const body = route.request().postDataJSON().review
        const review = { ...fixtures.firstReview, ...body, thanks_count: 0 }
        await route.fulfill({ json: { success: true, review: backend === 'legacy'
          ? { ...review, user_id: 901, user: { id: 901, name: reviewerName, avatar_url: reviewerAvatar } }
          : { ...review, user_id: undefined, is_own: true } } })
      })

      await editButtons(page).click()
      const modal = page.locator('.ReactModal__Content')
      await modal.locator('textarea').fill(updatedContent)
      await modal.getByRole('button', { name: '更新', exact: true }).click()
      await expect(modal).toHaveCount(0)
      await expect(page.getByText(updatedContent, { exact: true })).toBeVisible()
      // 保存後に PWA のインストール案内が開くと本文側が aria-hidden になるため hidden も数える。
      await expect(page.getByRole('button', { name: '編集', exact: true, includeHidden: true })).toHaveCount(1)
    })
  }

  test('ホーム: 最新レビューの HTML に投稿者情報が出ない', async ({ page }) => {
    await mockSession(page, { authenticated: false })
    await mockHomePageData(page, {
      latestReviews: [{
        ...fixtures.latestReview,
        user: { id: 901, name: reviewerName, avatar_url: reviewerAvatar },
        user_id: 901,
      } as typeof fixtures.latestReview],
    })
    const response = await page.goto('/')
    expect(response?.ok()).toBe(true)
    const html = await response!.text()
    await dismissInstallPromptIfVisible(page)
    await expect(page.getByText(fixtures.latestReview.content, { exact: true })).toBeVisible()
    await expectNoReviewerIdentity(html)
  })
})
