import 'server-only';
import { unstable_cache } from 'next/cache';

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

// 実在する日付で、未来（日本時間とのずれを見込んで2日先まで）でないものだけを使う。
// 不正な未来日付がホームや授業一覧の lastmod になるのを防ぐ。
function validLastmod(value: unknown, now: number): string | null {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  if (year < 2000 || time > now + 2 * 24 * 60 * 60 * 1000) return null;
  return value;
}

export function parseSitemapLectures(body: unknown, now = Date.now()): SitemapLecture[] {
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
    result.push({ id, lastmod: validLastmod(lastmod, now) });
  }
  return result;
}

async function fetchSitemapLectures(base: string): Promise<SitemapLecture[]> {
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
  return parseSitemapLectures(await response.json());
}

// 検証に通った結果だけを1時間保存する（失敗や形式違いの応答は例外になり、保存されない）。
// fetch の Data Cache だと 200 なら中身が壊れていても保存されてしまうので、unstable_cache で包む。
// 期限切れ後は古い内容を返しつつ裏で取り直し、取り直しに失敗しても古い内容が残る。
// キャッシュが空の状態で失敗した場合だけ例外にし、sitemap.xml を 5xx にする（Google は後で取り直す）。
export async function getSitemapLectures(): Promise<SitemapLecture[]> {
  // backend をキャッシュキーに含め、環境どうしでデータを共有しない。
  const base = backendBaseUrl();
  if (process.env.NODE_ENV === 'development') return fetchSitemapLectures(base);
  return unstable_cache(fetchSitemapLectures, ['sitemap-lectures-v1'], {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
  })(base);
}
