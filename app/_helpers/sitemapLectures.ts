import 'server-only';

// サイトマップに載せる授業（レビューが1件以上ある授業）を backend の専用 API から1回で取得する。
// 公開一覧 API をページ送りすると数百回の呼び出しになり、backend の利用者ごとの回数制限にかかるため使わない。
export const SITEMAP_REVALIDATE_SECONDS = 60 * 60;
const SITEMAP_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3001';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export interface SitemapLecture {
  id: number;
  // 最新レビューの投稿日（日本時間の YYYY-MM-DD）。不正な値なら null。
  lastmod: string | null;
}

function backendBaseUrl(): string {
  const configured = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV || DEFAULT_LOCAL_BACKEND_URL;
  return configured.replace(/\/$/, '');
}

export function parseSitemapLectures(body: unknown): SitemapLecture[] {
  const lectures = (body as { lectures?: unknown } | null)?.lectures;
  if (!Array.isArray(lectures)) {
    throw new Error('Unexpected response from the sitemap lecture API');
  }

  const seen = new Set<number>();
  const result: SitemapLecture[] = [];
  for (const item of lectures) {
    if (!item || typeof item !== 'object') continue;
    const { id, lastmod } = item as Record<string, unknown>;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1 || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, lastmod: typeof lastmod === 'string' && DATE_ONLY.test(lastmod) ? lastmod : null });
  }
  return result;
}

// 成功した応答だけが Next の Data Cache に1時間保存される（Next は 200 以外を保存しない）。
// 期限切れ後は古い内容を返しつつ裏で取り直すので、backend が一時的に落ちても直前の内容が使われる。
// キャッシュが空の状態で失敗した場合だけ例外にし、sitemap.xml を 5xx にする（Google は後で取り直す）。
export async function getSitemapLectures(): Promise<SitemapLecture[]> {
  const response = await fetch(`${backendBaseUrl()}/api/v1/lectures/sitemap`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GataReview-NextJS-Sitemap/1.0',
    },
    next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Sitemap lecture API responded with ${response.status}`);
  }
  return parseSitemapLectures(await response.json());
}
