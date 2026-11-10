import type { MetadataRoute } from 'next'
import { absoluteUrl } from './_helpers/seo'
import { getSitemapLectureIds } from './_helpers/sitemapLectures'

// ビルド時に backend へ問い合わせないよう、リクエストごとに生成する。
// 授業 ID の取得結果は1時間キャッシュするので、backend への問い合わせは1時間に1回程度。
export const dynamic = 'force-dynamic'

// 1つのサイトマップに載せられる URL の上限（sitemaps.org）。授業は約6,000件なので分割していない。
const SITEMAP_URL_LIMIT = 50_000
// 検索結果に出したいページだけを載せる（noindex のページや 404 になる /reviews は載せない）。
const STATIC_PATHS = ['/', '/lectures', '/faq', '/privacy', '/terms']

// lastmod は付けない。授業ページの更新日はレビューの投稿・編集時刻から作るしかなく、
// 時刻は（日・月単位に丸めても）公開しない方針のため。固定ページにも根拠のない日付は付けない。
// changefreq・priority は Google が使わないので付けない。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lectureIds = await getSitemapLectureIds()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) }))

  const lectureLimit = SITEMAP_URL_LIMIT - staticEntries.length
  if (lectureIds.length > lectureLimit) {
    console.warn(`[sitemap] ${lectureIds.length} lectures exceed one sitemap; split it with generateSitemaps.`)
  }
  const lectureEntries: MetadataRoute.Sitemap = lectureIds
    .slice(0, lectureLimit)
    .map((id) => ({ url: absoluteUrl(`/lectures/${id}`) }))

  return [...staticEntries, ...lectureEntries]
}
