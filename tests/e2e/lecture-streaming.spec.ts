import { expect, test } from '@playwright/test';
import { buildLectureReviewsResponse, fixtures, mockLectureDetail, mockSession } from './review-access.helpers';

test('レビューの応答を待つ間も授業情報を表示する', async ({ page }) => {
  await mockSession(page, { authenticated: false });
  await mockLectureDetail(page, fixtures.lectureResponse, fixtures.lectureId);
  const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`;
  await page.request.post(`${mockApiURL}/_test/response`, {
    data: {
      path: `/api/v1/lectures/${fixtures.lectureId}/reviews`,
      delayMs: 3000,
      body: buildLectureReviewsResponse({
        restrictionEnabled: false,
        accessGranted: true,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
    },
  });

  await page.goto(`/lectures/${fixtures.lectureId}`, { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: fixtures.lectureResponse.title })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'レビューを読み込んでいます' })).toBeVisible();
  await expect(page.getByText(fixtures.firstReview.content, { exact: true })).not.toBeVisible();
  await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'レビューを読み込んでいます' })).not.toBeVisible();
});
