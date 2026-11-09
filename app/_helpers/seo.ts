import type { Metadata } from 'next';

// canonical・og:url・サイトマップ・構造化データは、プレビュー環境やローカルでも常に本番ドメインを指す。
export const SITE_URL = 'https://www.gatareview.com';
export const SITE_NAME = 'ガタレビュ！';
export const HOME_TITLE = 'ガタレビュ！ - 新潟大学の授業レビューサイト';
export const HOME_DESCRIPTION = '新潟大学生のための授業レビューサイトです。シラバスではわからないリアルな授業情報を共有しましょう。履修選択に役立つ学生の生の声をお届けします。';

export const DEFAULT_OG_IMAGE = {
  url: '/ogp.png',
  width: 1200,
  height: 630,
  alt: HOME_TITLE,
  type: 'image/png',
} as const;

const TWITTER_ACCOUNT = '@gatareview';

// 検索結果に出す必要のない画面（ログイン・マイページ・管理・投稿フォームなど）。
// 親（授業詳細など）の canonical を引き継がないよう、canonical も明示的に消す。
export const NOINDEX_ROBOTS = { index: false, follow: true } as const;

export function absoluteUrl(path: string): string {
  if (path === '/' || path === '') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

interface IndexablePageMetadataInput {
  title: string;
  description: string;
  // サイト内パス（例: '/faq'、'/lectures?page=2'）。canonical と og:url に使う。
  path: string;
  keywords?: string[];
  openGraphType?: 'website' | 'article';
}

// 検索結果に出したいページ用。canonical・og:url をそのページ自身の URL にし、
// タイトル・説明文を OGP / X カードにもそろえる。
export function indexablePageMetadata({
  title,
  description,
  path,
  keywords,
  openGraphType = 'website',
}: IndexablePageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [DEFAULT_OG_IMAGE],
      locale: 'ja_JP',
      type: openGraphType,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: { url: DEFAULT_OG_IMAGE.url, alt: DEFAULT_OG_IMAGE.alt },
      creator: TWITTER_ACCOUNT,
      site: TWITTER_ACCOUNT,
    },
  };
}

export function noindexPageMetadata(title?: string): Metadata {
  return {
    ...(title ? { title } : {}),
    robots: NOINDEX_ROBOTS,
    alternates: { canonical: null },
  };
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const HOME_BREADCRUMB: BreadcrumbItem = { name: 'ホーム', path: '/' };

// <script type="application/ld+json"> に埋め込む文字列。
// 値に "</script>" などが入っても script 要素を閉じられないよう < > & をエスケープする。
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const LECTURE_LIST_PATH = '/lectures';
const LECTURE_LIST_MAX_PAGE = 10_000;
// 表示内容を変える検索・絞り込み・並び替えの条件（lectureSearch.ts の queryKeys と同じ）。
// utm_* などの無関係なパラメータは canonical の判定に使わない。
const LECTURE_LIST_FILTER_KEYS = [
  'search', 'faculty', 'sort', 'period_year', 'period_term',
  'textbook', 'attendance', 'grading_type', 'content_difficulty', 'content_quality',
] as const;

// 授業一覧（/lectures）の canonical。
// - 条件なしの1ページ目: /lectures
// - 条件なしの2ページ目以降: /lectures?page=N（Google の推奨どおり各ページ自身を canonical にし、1ページ目にまとめない）
// - 検索語・学部・並び替え・詳細条件がある: /lectures（組み合わせが無数にある検索結果ページを1つにまとめる）
// - 不正な page: /lectures
export function lectureListCanonicalPath(params: URLSearchParams): string {
  const hasFilter = LECTURE_LIST_FILTER_KEYS.some((key) => {
    // backend と同じく、前後の空白・ゼロ幅スペース（U+200B）・BOM（U+FEFF）だけの値は条件なしとみなす。
    const value = params.get(key)?.replace(/^[\s\u200B\uFEFF]+|[\s\u200B\uFEFF]+$/g, '');
    return Boolean(value) && !(key === 'sort' && value === 'newest');
  });
  if (hasFilter) return LECTURE_LIST_PATH;

  const page = params.get('page');
  if (!page || !/^\d+$/.test(page)) return LECTURE_LIST_PATH;
  const pageNumber = Number(page);
  if (pageNumber < 2 || pageNumber > LECTURE_LIST_MAX_PAGE) return LECTURE_LIST_PATH;
  return `${LECTURE_LIST_PATH}?page=${pageNumber}`;
}
