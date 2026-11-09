import type { MetadataRoute } from 'next'
import { absoluteUrl } from './_helpers/seo'
import { getSitemapLectures } from './_helpers/sitemapLectures'

// ビルド時に backend へ問い合わせないよう、リクエストごとに生成する。
// 授業一覧の取得結果は Data Cache に1時間保存されるので、backend への問い合わせは1時間に1回程度。
export const dynamic = 'force-dynamic'

// 1つのサイトマップに載せられる URL の上限（sitemaps.org）。授業は約6,000件なので分割していない。
const SITEMAP_URL_LIMIT = 50_000
// 検索結果に出したいページだけを載せる（noindex のページや 404 になる /reviews は載せない）。
const STATIC_PATHS = ['/', '/lectures', '/faq', '/privacy', '/terms']
// 最新レビューが表示されるページ。最終更新日 = 最新レビューの投稿日にする。
const LATEST_REVIEW_PATHS = new Set(['/', '/lectures'])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lectures = await getSitemapLectures()
  const latestReviewDate = lectures.reduce<string | null>(
    (latest, lecture) => (lecture.lastmod && (!latest || lecture.lastmod > latest) ? lecture.lastmod : latest),
    null,
  )

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    ...(LATEST_REVIEW_PATHS.has(path) && latestReviewDate ? { lastModified: latestReviewDate } : {}),
  }))

  const lectureLimit = SITEMAP_URL_LIMIT - staticEntries.length
  if (lectures.length > lectureLimit) {
    console.warn(`[sitemap] ${lectures.length} lectures exceed one sitemap; split it with generateSitemaps.`)
  }
  const lectureEntries: MetadataRoute.Sitemap = lectures.slice(0, lectureLimit).map((lecture) => ({
    url: absoluteUrl(`/lectures/${lecture.id}`),
    ...(lecture.lastmod ? { lastModified: lecture.lastmod } : {}),
  }))

  return [...staticEntries, ...lectureEntries]
}
