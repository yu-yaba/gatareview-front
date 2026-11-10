import 'server-only';
import { unstable_cache } from 'next/cache';

// サイトマップに載せる授業（レビューが1件以上ある授業）の ID を backend の専用 API から1回で取得する。
// 公開一覧 API をページ送りすると数百回の呼び出しになり、backend の利用者ごとの回数制限にかかるため使わない。
// lastmod は付けない。レビュー・授業の作成・更新時刻から作る値は、日や月に丸めても公開しない
// （匿名レビューは編集できないため、時刻からログイン投稿かどうかや同じ人の投稿が推測できる）。
export const SITEMAP_REVALIDATE_SECONDS = 60 * 60;
const SITEMAP_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3001';

function backendBaseUrl(): string {
  const configured = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV || DEFAULT_LOCAL_BACKEND_URL;
  return configured.replace(/\/$/, '');
}

// 正の整数の ID だけを、重複なく受け取った順に返す。形式が違えば例外にする（キャッシュしない）。
export function parseSitemapLectureIds(body: unknown): number[] {
  const ids = (body as { lecture_ids?: unknown } | null)?.lecture_ids;
  if (!Array.isArray(ids)) {
    throw new Error('Unexpected response from the sitemap lecture API');
  }
  const seen = new Set<number>();
  for (const id of ids) {
    if (typeof id === 'number' && Number.isSafeInteger(id) && id >= 1) seen.add(id);
  }
  return Array.from(seen);
}

async function fetchSitemapLectureIds(base: string): Promise<number[]> {
  const response = await fetch(`${base}/api/v1/lectures/sitemap`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GataReview-NextJS-Sitemap/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Sitemap lecture API responded with ${response.status}`);
  }
  return parseSitemapLectureIds(await response.json());
}

// 検証に通った結果だけを1時間保存する（失敗や形式違いの応答は例外になり、保存されない）。
// fetch の Data Cache だと 200 なら中身が壊れていても保存されてしまうので、unstable_cache で包む。
// 期限切れ後は古い内容を返しつつ裏で取り直し、取り直しに失敗しても古い内容が残る。
// キャッシュが空の状態で失敗した場合だけ例外にし、sitemap.xml を 5xx にする（Google は後で取り直す）。
export async function getSitemapLectureIds(): Promise<number[]> {
  // backend をキャッシュキーに含め、環境どうしでデータを共有しない。
  const base = backendBaseUrl();
  if (process.env.NODE_ENV === 'development') return fetchSitemapLectureIds(base);
  return unstable_cache(fetchSitemapLectureIds, ['sitemap-lecture-ids-v1'], {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
  })(base);
}
