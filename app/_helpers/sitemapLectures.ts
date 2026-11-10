import 'server-only';
import { unstable_cache } from 'next/cache';

// サイトマップに載せる授業（レビューが1件以上ある授業）の ID を backend の専用 API から1回で取得する。
// 公開一覧 API をページ送りすると数百回の呼び出しになり、backend の利用者ごとの回数制限にかかるため使わない。
// lastmod は付けない。レビュー・授業の作成・更新時刻から作る値は、日や月に丸めても公開しない
// （匿名レビューは編集できないため、時刻からログイン投稿かどうかや同じ人の投稿が推測できる）。
export const SITEMAP_REVALIDATE_SECONDS = 60 * 60;
// ほかの backend 呼び出し（backendRequest.ts の BACKEND_TIMEOUT_MS）と同じ。
const SITEMAP_FETCH_TIMEOUT_MS = 8_000;
const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3001';

function backendBaseUrl(): string {
  const configured = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV || DEFAULT_LOCAL_BACKEND_URL;
  return configured.replace(/\/$/, '');
}

// サイトマップ API がまだない backend（旧版）。授業の `/lectures/:id` に当たって 404 になる。
class SitemapEndpointMissingError extends Error {
  constructor() {
    super('Sitemap lecture API is not available (404)');
    this.name = 'SitemapEndpointMissingError';
  }
}

// 正の整数の ID の配列だけを受け付け、重複を除いて返す。1件でも形式が違えば応答全体を例外にする
// （保存しない）。壊れた応答で、保存済みの正しい一覧が置き換わらないようにするため。
export function parseSitemapLectureIds(body: unknown): number[] {
  const ids = (body as { lecture_ids?: unknown } | null)?.lecture_ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'number' && Number.isSafeInteger(id) && id >= 1)) {
    throw new Error('Unexpected response from the sitemap lecture API');
  }
  return Array.from(new Set(ids as number[]));
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
  if (response.status === 404) throw new SitemapEndpointMissingError();
  if (!response.ok) {
    throw new Error(`Sitemap lecture API responded with ${response.status}`);
  }
  return parseSitemapLectureIds(await response.json());
}

// 検証に通った結果だけを1時間保存する（失敗や形式違いの応答は例外になり、保存されない）。
// fetch の Data Cache だと 200 なら中身が壊れていても保存されてしまうので、unstable_cache で包む。
// 期限切れ後は古い内容を返しつつ裏で取り直し、取り直しに失敗しても古い内容が残る。
// キャッシュが空の状態で失敗した場合だけ例外にし、sitemap.xml を 5xx にする（Google は後で取り直す）。
// backend にサイトマップ API がまだない（404）場合だけは、授業なし（固定ページだけ）のサイトマップにする。
// フロントを先にデプロイしても、いまの本番と同じ内容のまま 200 を返すため。この結果は保存しないので、
// backend をデプロイすれば次のリクエストから授業が載る。
export async function getSitemapLectureIds(): Promise<number[]> {
  // backend をキャッシュキーに含め、環境どうしでデータを共有しない。
  const base = backendBaseUrl();
  try {
    if (process.env.NODE_ENV === 'development') return await fetchSitemapLectureIds(base);
    return await unstable_cache(fetchSitemapLectureIds, ['sitemap-lecture-ids-v1'], {
      revalidate: SITEMAP_REVALIDATE_SECONDS,
    })(base);
  } catch (error) {
    if (error instanceof Error && error.name === 'SitemapEndpointMissingError') {
      console.warn('[sitemap] /api/v1/lectures/sitemap returned 404; listing static pages only until the backend is deployed');
      return [];
    }
    throw error;
  }
}
