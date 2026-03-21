import { expect, test } from "@playwright/test";
import {
  buildLectureReviewsResponse,
  dismissInstallPromptIfVisible,
  fixtures,
  mockAdminReviewAccess,
  mockAuthMe,
  mockHomePageData,
  mockLectureDetail,
  mockLectureReviews,
  mockLectureStatusEndpoints,
  mockLecturesIndex,
  mockMypage,
  mockSession,
} from "./review-access.helpers";

const makeUserSession = (overrides: Partial<{
  reviews_count: number;
  admin: boolean;
}> = {}) => ({
  authenticated: true as const,
  user: {
    id: "1",
    email: "student@example.com",
    name: "学生ユーザー",
    avatar_url: null,
    reviews_count: overrides.reviews_count ?? 0,
    admin: overrides.admin ?? false,
  },
  backendToken: "backend-token",
});

const adminStateOff = {
  lecture_review_restriction_enabled: false,
  updated_at: "2026-03-21T00:00:00.000Z",
  last_updated_by: {
    id: 2,
    name: "管理者A",
    email: "admin@example.com",
  },
};

const adminStateOn = {
  lecture_review_restriction_enabled: true,
  updated_at: "2026-03-21T00:00:00.000Z",
  last_updated_by: {
    id: 2,
    name: "管理者A",
    email: "admin@example.com",
  },
};

const setupLectureDetail = async (
  page: import("@playwright/test").Page,
  options: {
    lecture: typeof fixtures.lectureResponse;
    reviewsResponse: ReturnType<typeof buildLectureReviewsResponse> | "fail";
    session: ReturnType<typeof makeUserSession> | { authenticated: false };
    authUser?: {
      id: string;
      email: string;
      name: string;
      avatar_url?: string | null;
      reviews_count?: number;
      admin?: boolean;
    };
  }
) => {
  await mockSession(page, options.session);
  await mockLectureDetail(page, options.lecture, options.lecture.id);
  await mockLectureReviews(page, options.reviewsResponse, options.lecture.id);

  if (options.session.authenticated) {
    await mockAuthMe(page, options.authUser ?? options.session.user);
    await mockLectureStatusEndpoints(
      page,
      {
        bookmarked: false,
        thanked: false,
        thanksCount: 0,
      },
      options.lecture.id,
      [fixtures.firstReview.id, fixtures.secondReview.id]
    );
  }

  await page.goto(`/lectures/${options.lecture.id}`);
  await dismissInstallPromptIfVisible(page);
};

const setupAdminPage = async (
  page: import("@playwright/test").Page,
  session: ReturnType<typeof makeUserSession> | { authenticated: false },
  adminReviewAccess: Parameters<typeof mockAdminReviewAccess>[1]
) => {
  await mockSession(page, session);
  if (session.authenticated) {
    await mockAdminReviewAccess(page, adminReviewAccess);
  }

  await page.goto("/admin/review-access");
  await dismissInstallPromptIfVisible(page);
};

test.describe("lecture detail review access", () => {
  test("制限OFFではレビュー全文をそのまま閲覧できる", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureResponse,
      session: { authenticated: false },
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: false,
        accessGranted: true,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
    });

    await expect(page.getByRole("heading", { name: fixtures.lectureResponse.title })).toBeVisible();
    await expect(page.getByText("2件のレビュー")).toBeVisible();
    await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.secondReview.content, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /ログイン&1レビューして閲覧する/ })).toHaveCount(0);
  });

  test("制限ONでは未ログインユーザーの2件目以降が制限される", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureResponse,
      session: { authenticated: false },
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: true,
        accessGranted: false,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
    });

    await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.secondReview.content, { exact: true })).toHaveCount(0);
    await expect(page.getByText("ログイン&1レビューして閲覧する")).toBeVisible();
    await expect(page.getByRole("button", { name: /ありがとう/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "報告" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "ブックマーク" })).toBeVisible();
  });

  test("制限ONでレビュー0件ユーザーは1レビュー投稿を促される", async ({ page }) => {
    const session = makeUserSession({ reviews_count: 0 });

    await setupLectureDetail(page, {
      lecture: fixtures.lectureResponse,
      session,
      authUser: session.user,
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: true,
        accessGranted: false,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
    });

    await expect(page.getByText("1レビューを投稿して閲覧する")).toBeVisible();
    await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.secondReview.content, { exact: true })).toHaveCount(0);
  });

  test("レビュー0件の授業ではロックUIを出さない", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureAResponse,
      session: { authenticated: false },
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: false,
        accessGranted: true,
        reviews: [],
      }),
    });

    await expect(page.getByText("まだレビューがありません")).toBeVisible();
    await expect(page.getByText("レビュー取得エラー")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ログイン&1レビューして閲覧する/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /1レビューを投稿して閲覧する/ })).toHaveCount(0);
  });

  test("レビュー1件の授業ではぼかしやロックUIを出さない", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureBResponse,
      session: { authenticated: false },
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: true,
        accessGranted: false,
        reviews: [fixtures.firstReview],
      }),
    });

    await expect(page.getByText(fixtures.firstReview.content, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.secondReview.content, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ログイン&1レビューして閲覧する/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /1レビューを投稿して閲覧する/ })).toHaveCount(0);
  });

  test("レビュー取得失敗時はエラー表示になる", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureResponse,
      session: { authenticated: false },
      reviewsResponse: "fail",
    });

    await expect(page.getByText("レビューの取得に失敗しました", { exact: true })).toBeVisible();
    await expect(page.getByText("レビューの取得に失敗しました。時間をおいて再度お試しください。")).toBeVisible();
    await expect(page.getByText("レビュー取得エラー")).toBeVisible();
    await expect(page.getByText("--")).toBeVisible();
    await expect(page.getByText("2件のレビュー")).toHaveCount(0);
  });

  test("未ログインでありがとうとブックマークを押すとログイン導線が出る", async ({ page }) => {
    await setupLectureDetail(page, {
      lecture: fixtures.lectureResponse,
      session: { authenticated: false },
      reviewsResponse: buildLectureReviewsResponse({
        restrictionEnabled: true,
        accessGranted: false,
        reviews: [fixtures.firstReview, fixtures.secondReview],
      }),
    });

    await page.getByRole("button", { name: /ありがとう/ }).first().click();
    await expect(page.getByRole("heading", { name: "ありがとう機能" })).toBeVisible();
    await page.getByRole("button", { name: "後で" }).click();

    await page.getByRole("button", { name: "ブックマーク" }).click();
    await expect(page.getByRole("heading", { name: "ブックマーク機能" })).toBeVisible();
  });
});

test.describe("admin review access", () => {
  test("未ログインはサインイン画面へリダイレクトする", async ({ page }) => {
    await setupAdminPage(page, { authenticated: false }, { get: adminStateOff });

    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });

  test("非管理者は403表示になる", async ({ page }) => {
    const session = makeUserSession({ admin: false });
    await setupAdminPage(page, session, { get: "forbidden" });

    await expect(page).toHaveURL(/\/admin\/review-access/);
    await expect(page.getByText("403 FORBIDDEN")).toBeVisible();
    await expect(page.getByText("管理者のみアクセスできます")).toBeVisible();
  });

  test("管理者は閲覧制限の現在値を確認できる", async ({ page }) => {
    const session = makeUserSession({ admin: true });
    await setupAdminPage(page, session, { get: adminStateOff });

    await expect(page.getByText("レビュー閲覧制限")).toBeVisible();
    await expect(page.getByText("制限 OFF")).toBeVisible();
    await expect(page.getByRole("button", { name: "制限を ON にする" })).toBeVisible();
    await expect(page.getByText("管理者A (admin@example.com)")).toBeVisible();
  });

  test("OFFからONへの切替で成功通知が出る", async ({ page }) => {
    const session = makeUserSession({ admin: true });
    await setupAdminPage(page, session, { get: adminStateOff });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "制限を ON にする" }).click();

    await expect(page.getByText("レビュー閲覧制限を有効にしました", { exact: true })).toBeVisible();
    await expect(page.getByText("制限 ON")).toBeVisible();
  });

  test("ONからOFFへの切替で成功通知が出る", async ({ page }) => {
    const session = makeUserSession({ admin: true });
    await setupAdminPage(page, session, { get: adminStateOn });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "制限を OFF にする" }).click();

    await expect(page.getByText("レビュー閲覧制限を無効にしました", { exact: true })).toBeVisible();
    await expect(page.getByText("制限 OFF")).toBeVisible();
  });

  test("サーバ失敗時は更新失敗通知が出る", async ({ page }) => {
    const session = makeUserSession({ admin: true });
    await setupAdminPage(page, session, { get: adminStateOff, patch: "fail" });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "制限を ON にする" }).click();

    await expect(page.getByText("レビュー閲覧制限の更新に失敗しました", { exact: true })).toBeVisible();
  });

  test("通信失敗時は通信エラー通知が出る", async ({ page }) => {
    const session = makeUserSession({ admin: true });
    await setupAdminPage(page, session, { get: adminStateOff, patch: "abort" });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "制限を ON にする" }).click();

    await expect(page.getByText("通信エラーが発生しました。時間をおいて再度お試しください", { exact: true })).toBeVisible();
  });
});

test.describe("review access impact outside lecture detail", () => {
  test("ルートページの最新レビューは制限設定に関係なく全文表示される", async ({ page }) => {
    await mockSession(page, { authenticated: false });
    await mockHomePageData(page);

    await page.goto("/");
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByRole("heading", { name: "最新のレビュー" })).toBeVisible();
    await expect(page.getByText(fixtures.latestReview.content, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.latestReview.lecture.title, { exact: true })).toBeVisible();
  });

  test("授業一覧ページは制限設定の影響を受けずに授業を表示する", async ({ page }) => {
    await mockSession(page, { authenticated: false });
    await mockLecturesIndex(page, [fixtures.lectureResponse]);

    await page.goto("/lectures");
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByText(fixtures.lectureResponse.title, { exact: true })).toBeVisible();
    await expect(page.getByText(fixtures.lectureResponse.lecturer, { exact: true })).toBeVisible();
    await expect(page.getByText("ログイン&1レビューして閲覧する")).toHaveCount(0);
  });

  test("レビュー投稿ページは制限設定の影響を受けずに表示される", async ({ page }) => {
    await mockSession(page, { authenticated: false });
    await mockLectureDetail(page, fixtures.lectureResponse, fixtures.lectureId);

    await page.goto(`/lectures/${fixtures.lectureId}/review`);
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByRole("heading", { name: "レビュー投稿" })).toBeVisible();
    await expect(page.getByText(fixtures.lectureResponse.title, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "レビューを投稿" })).toBeVisible();
  });

  test("マイページの表示は制限設定の影響を受けない", async ({ page }) => {
    const session = makeUserSession({ reviews_count: 1 });
    await mockSession(page, session);
    await mockMypage(page, fixtures.mypageResponse);

    await page.goto("/mypage");
    await dismissInstallPromptIfVisible(page);

    await expect(page.getByRole("heading", { name: "マイページ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "学生ユーザー" })).toBeVisible();
    await expect(page.getByText("ブックマーク済み授業", { exact: true })).toBeVisible();
  });
});
