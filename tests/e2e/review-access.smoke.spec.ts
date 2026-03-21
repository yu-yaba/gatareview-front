import { expect, test } from "@playwright/test";
import {
  buildLectureReviewsResponse,
  dismissInstallPromptIfVisible,
  fixtures,
  mockLectureDetail,
  mockLectureReviews,
  mockSession,
} from "./review-access.helpers";

test.describe("review access smoke", () => {
  test("lecture detail renders backend data", async ({ page }) => {
    await mockSession(page, { authenticated: false });
    await mockLectureDetail(page, fixtures.lectureResponse, fixtures.lectureId);
    await mockLectureReviews(
      page,
      buildLectureReviewsResponse({
        restrictionEnabled: false,
        accessGranted: true,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
      fixtures.lectureId
    );

    await page.goto(`/lectures/${fixtures.lectureId}`);
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByRole("heading", { name: fixtures.lectureResponse.title })).toBeVisible();
    await expect(page.getByText(fixtures.lectureResponse.lecturer, { exact: true })).toBeVisible();
    await expect(page.getByText("2件のレビュー")).toBeVisible();
    await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
  });

  test("admin review access redirects unauthenticated user to sign in", async ({ page }) => {
    await mockSession(page, { authenticated: false });

    await page.goto("/admin/review-access");
    await dismissInstallPromptIfVisible(page);

    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });
});
