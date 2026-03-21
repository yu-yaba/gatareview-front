import { expect, test } from "@playwright/test";

const lectureId = process.env.PLAYWRIGHT_LECTURE_ID || "3886";
const lectureTitle = process.env.PLAYWRIGHT_LECTURE_TITLE || "実働確認用授業";
const lecturerName = process.env.PLAYWRIGHT_LECTURER || "実働確認教員";

async function dismissInstallPromptIfVisible(page: import("@playwright/test").Page) {
  const laterButton = page.getByRole("button", { name: "後で" });
  if (await laterButton.isVisible().catch(() => false)) {
    await laterButton.click();
  }
}

test.describe("review access smoke", () => {
  test("lecture detail renders backend data", async ({ page }) => {
    await page.goto(`/lectures/${lectureId}`);
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByRole("heading", { name: lectureTitle })).toBeVisible();
    await expect(page.getByText(lecturerName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("2件のレビュー")).toBeVisible();
    await expect(page.getByText("これは先頭レビューです。")).toBeVisible();
  });

  test("admin review access redirects unauthenticated user to sign in", async ({ page }) => {
    await page.goto("/admin/review-access");
    await dismissInstallPromptIfVisible(page);

    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });
});
