import { expect, test } from '@playwright/test'
import { mockSession, dismissInstallPromptIfVisible } from './review-access.helpers'

test.beforeEach(async ({ page }) => {
  await mockSession(page, {
    authenticated: true,
    user: { id: '1', name: 'テスト利用者', email: 'test@example.com' },
    backendToken: 'test-only-backend-token',
  })
})

for (const scenario of [
  { name: '既存の短文を保持したまま半星評価を編集できる', original: '既存の短文レビューです', changed: false },
  { name: '既存の1000文字超の本文を保持したまま半星評価を編集できる', original: '旧'.repeat(1001), changed: false },
  { name: '新しく短い本文へ変更した場合は送信を拒否する', original: '元'.repeat(30), changed: true },
]) {
  test(scenario.name, async ({ page }) => {
    const review = {
      id: 100, rating: 3.5, content: scenario.original, textbook: '', attendance: '', grading_type: '',
      content_difficulty: '', content_quality: '', period_year: '', period_term: '', thanks_count: 0,
      created_at: '2026-10-01T00:00:00Z', lecture: { id: 3886, title: 'テスト授業', lecturer: 'テスト教員', faculty: '工学部' },
    }
    let updated: { content: string; rating: number } | null = null
    await page.route('**/api/v1/mypage/reviews**', route => route.fulfill({ json: {
      reviews: [review], pagination: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 },
      statistics: { total_reviews: 1, average_rating: 3.5 },
    } }))
    await page.route('**/api/v1/reviews/100', async route => {
      expect(route.request().method()).toBe('PATCH')
      expect(route.request().headers().authorization).toBe('Bearer test-only-backend-token')
      updated = route.request().postDataJSON().review
      await route.fulfill({ json: { review: { ...review, ...updated } } })
    })
    await page.goto('/mypage/reviews')
    await dismissInstallPromptIfVisible(page)
    await page.getByRole('button', { name: '編集', exact: true }).click()
    const modal = page.locator('.ReactModal__Content')
    const textarea = modal.locator('textarea')
    if (scenario.changed) await textarea.fill('新しく変更した短文')
    expect(await textarea.evaluate(element => (element as HTMLTextAreaElement).checkValidity())).toBe(true)
    // 半星の既存UIで5番目の星の左側を選ぶと4.5点になる。
    await modal.locator('span[data-index="4"]').click({ position: { x: 5, y: 15 } })
    await expect(modal.getByText('4.5', { exact: true })).toBeVisible()
    await modal.getByRole('button', { name: '更新', exact: true }).click()
    if (scenario.changed) {
      await expect(page.getByText('コメントは30文字以上1000文字以内で入力してください', { exact: true })).toBeVisible()
      expect(updated).toBeNull()
      await expect(modal).toBeVisible()
    } else {
      await expect(modal).toHaveCount(0)
      expect(updated).toEqual(expect.objectContaining({ content: scenario.original, rating: 4.5 }))
    }
  })
}
