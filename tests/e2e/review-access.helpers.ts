import type { Page } from "@playwright/test";

type SessionState =
  | { authenticated: false }
  | {
      authenticated: true;
      user: {
        id: string;
        email: string;
        name: string;
        avatar_url?: string | null;
        reviews_count?: number;
        admin?: boolean;
      };
      backendToken: string;
    };

type LectureReview = {
  id: number;
  rating: number;
  content: string;
  lecture_id: number;
  thanks_count?: number;
  user_id?: number | null;
  period_year?: string;
  period_term?: string;
  textbook?: string;
  attendance?: string;
  grading_type?: string;
  content_difficulty?: string;
  content_quality?: string;
};

type ReviewAccessResponse = {
  reviews: LectureReview[];
  access: {
    restriction_enabled: boolean;
    access_granted: boolean;
  };
};

type AdminReviewAccessResponse = {
  lecture_review_restriction_enabled: boolean;
  updated_at: string | null;
  last_updated_by: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type HomeLatestReview = {
  id: number;
  rating: number;
  content: string;
  created_at: string;
  lecture: {
    id: number;
    title: string;
    lecturer: string;
    faculty: string;
    avg_rating: number;
    review_count: number;
  };
};

const lectureId = process.env.PLAYWRIGHT_LECTURE_ID || "3886";
const currentYear = String(new Date().getFullYear());

const lectureResponse = {
  id: Number(lectureId),
  title: "テスト用授業",
  lecturer: "テスト教員",
  faculty: "工学部",
  avg_rating: 4.5,
  review_count: 2,
};

const lectureAResponse = {
  ...lectureResponse,
  id: 4001,
  title: "レビュー0件の授業",
  review_count: 0,
};

const lectureBResponse = {
  ...lectureResponse,
  id: 4002,
  title: "レビュー1件の授業",
  review_count: 1,
};

const lectureCResponse = {
  ...lectureResponse,
  id: Number(lectureId),
  title: "レビュー2件の授業",
  review_count: 2,
};

const firstReview: LectureReview = {
  id: 101,
  rating: 5,
  lecture_id: Number(lectureId),
  content: "これは先頭レビューです。全文表示されることを確認するための本文です。",
  thanks_count: 0,
  user_id: 901,
  period_year: currentYear,
  period_term: "1ターム",
};

const secondReview: LectureReview = {
  id: 102,
  rating: 4,
  lecture_id: Number(lectureId),
  content: "これは2件目レビューです。制限時は先頭30文字だけ見えることを確認するための長い本文です。",
  thanks_count: 1,
  user_id: 902,
  period_year: currentYear,
  period_term: "1ターム",
};

const secondReviewPreview = secondReview.content.slice(0, 30);

const latestReview: HomeLatestReview = {
  id: 701,
  rating: 5,
  content: "ルートページの最新レビュー本文です。授業詳細の閲覧制限ON/OFFに関係なく全文が見えることを確認します。",
  created_at: "2026-03-21T00:00:00.000Z",
  lecture: {
    id: 5001,
    title: "最新レビュー表示用授業",
    lecturer: "表示確認教員",
    faculty: "工学部",
    avg_rating: 4.8,
    review_count: 3,
  },
};

const mypageResponse = {
  user: {
    id: 1,
    name: "学生ユーザー",
    email: "student@example.com",
    avatar_url: null,
    provider: "google_oauth2",
  },
  statistics: {
    reviews_count: 1,
    total_thanks_received: 4,
    latest_review: null,
  },
  bookmarked_lectures: [
    {
      id: 9001,
      title: "ブックマーク済み授業",
      lecturer: "ブックマーク教員",
      faculty: "工学部",
      bookmarked_at: "2026-03-21T00:00:00.000Z",
      review_count: 2,
      avg_rating: 4.2,
    },
  ],
  user_reviews: [
    {
      id: 8001,
      rating: 4,
      content: "マイページ表示確認用レビューです。",
      created_at: "2026-03-21T00:00:00.000Z",
      thanks_count: 4,
      textbook: "必要",
      attendance: "毎回確認",
      grading_type: "レポートのみ",
      content_difficulty: "普通",
      content_quality: "良い",
      period_year: currentYear,
      period_term: "1ターム",
      lecture: {
        id: 9002,
        title: "自分のレビュー授業",
        lecturer: "レビュー教員",
        faculty: "工学部",
      },
    },
  ],
  ranking_position: {
    position: 10,
    total_users: 100,
    user_reviews_count: 1,
  },
};

export function buildLectureReviewsResponse(params: {
  restrictionEnabled: boolean;
  accessGranted: boolean;
  reviews: LectureReview[];
  maskContent?: boolean;
}): ReviewAccessResponse {
  const { restrictionEnabled, accessGranted, reviews, maskContent = false } = params;
  return {
    reviews: reviews.map((review, index) => {
      if (!maskContent || accessGranted || index === 0) {
        return review;
      }

      return {
        ...review,
        content: review.content.slice(0, 30),
      };
    }),
    access: {
      restriction_enabled: restrictionEnabled,
      access_granted: accessGranted,
    },
  };
}

export async function dismissInstallPromptIfVisible(page: Page) {
  const laterButton = page.getByRole("button", { name: "後で" });
  if (await laterButton.isVisible().catch(() => false)) {
    await laterButton.click();
  }
}

export async function mockSession(page: Page, sessionState: SessionState) {
  await page.route("**/api/auth/session**", async (route) => {
    if (!sessionState.authenticated) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: sessionState.user,
        backendToken: sessionState.backendToken,
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
}

export async function mockLectureDetail(page: Page, lecture: typeof lectureResponse, lectureId: number = lecture.id) {
  await page.route(`**/api/v1/lectures/${lectureId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(lecture),
    });
  });
}

export async function mockLectureReviews(page: Page, response: ReviewAccessResponse | "fail", lectureIdOverride: number = Number(lectureId)) {
  await page.route(`**/api/v1/lectures/${lectureIdOverride}/reviews**`, async (route) => {
    if (response === "fail") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "failed" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export async function mockAuthMe(page: Page, user: {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  reviews_count?: number;
  admin?: boolean;
}) {
  await page.route("**/api/v1/auth/me**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });
}

export async function mockLectureStatusEndpoints(page: Page, options: {
  bookmarked?: boolean;
  thanked?: boolean;
  thanksCount?: number;
}, lectureIdOverride: number = Number(lectureId), reviewIds: number[] = [firstReview.id]) {
  const bookmarked = options.bookmarked ?? false;
  const thanked = options.thanked ?? false;
  const thanksCount = options.thanksCount ?? 0;

  await page.route(`**/api/v1/lectures/${lectureIdOverride}/bookmarks**`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ bookmarked }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bookmarked: !bookmarked }),
    });
  });

  for (const reviewId of reviewIds) {
    await page.route(`**/api/v1/reviews/${reviewId}/thanks**`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            thanked,
            thanks_count: thanksCount,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          thanked: !thanked,
          thanks_count: thanked ? Math.max(0, thanksCount - 1) : thanksCount + 1,
        }),
      });
    });
  }
}

export async function mockHomePageData(page: Page, options?: {
  latestReviews?: HomeLatestReview[];
  totalReviewsCount?: number;
  popularLectures?: Array<Record<string, unknown>>;
  noReviewsLectures?: Array<Record<string, unknown>>;
}) {
  await page.route("**/api/v1/reviews/total**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: options?.totalReviewsCount ?? 1234 }),
    });
  });

  await page.route("**/api/v1/reviews/latest**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options?.latestReviews ?? [latestReview]),
    });
  });

  await page.route("**/api/v1/lectures/popular**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lectures: options?.popularLectures ?? [lectureResponse],
      }),
    });
  });

  await page.route("**/api/v1/lectures/no_reviews**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lectures: options?.noReviewsLectures ?? [lectureAResponse],
      }),
    });
  });
}

export async function mockLecturesIndex(page: Page, lectures: Array<Record<string, unknown>> = [lectureResponse]) {
  await page.route("**/api/v1/lectures?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lectures,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_count: lectures.length,
          per_page: 20,
        },
      }),
    });
  });
}

export async function mockMypage(page: Page, response: Record<string, unknown> = mypageResponse) {
  await page.route("**/api/v1/mypage**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

type AdminReviewAccessMock = AdminReviewAccessResponse | "fail" | "abort" | "forbidden";

type AdminReviewAccessMockOptions = {
  get: AdminReviewAccessMock;
  patch?: AdminReviewAccessMock;
};

export async function mockAdminReviewAccess(
  page: Page,
  response: AdminReviewAccessMock | AdminReviewAccessMockOptions
) {
  const isDirectResponse = (
    value: AdminReviewAccessMock | AdminReviewAccessMockOptions
  ): value is AdminReviewAccessMock => {
    return (
      typeof value === "string" ||
      (typeof value === "object" &&
        value !== null &&
        "lecture_review_restriction_enabled" in value &&
        "updated_at" in value)
    );
  };

  const options: AdminReviewAccessMockOptions = isDirectResponse(response)
    ? { get: response }
    : response;

  await page.route("**/api/v1/admin/review-access**", async (route) => {
    const isGet = route.request().method() === "GET";
    const mockResponse = isGet ? options.get : options.patch ?? options.get;

    if (mockResponse === "abort") {
      await route.abort();
      return;
    }

    if (mockResponse === "fail") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ errors: ["server error"] }),
      });
      return;
    }

    if (mockResponse === "forbidden") {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ errors: ["forbidden"] }),
      });
      return;
    }

    if (isGet) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
      return;
    }

    const payload = route.request().postDataJSON() as {
      review_access?: { lecture_review_restriction_enabled?: boolean };
    };
    const nextEnabled = Boolean(payload.review_access?.lecture_review_restriction_enabled);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lecture_review_restriction_enabled: nextEnabled,
        updated_at: "2026-03-21T00:00:00.000Z",
        last_updated_by: {
          id: 1,
          name: "管理者",
          email: "admin@example.com",
        },
      }),
    });
  });
}

export const fixtures = {
  lectureId: Number(lectureId),
  lectureResponse,
  lectureAResponse,
  lectureBResponse,
  lectureCResponse,
  firstReview,
  secondReview,
  secondReviewPreview,
  latestReview,
  mypageResponse,
};
