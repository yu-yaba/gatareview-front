import type { Metadata } from 'next';
import { noindexPageMetadata } from '../../_helpers/seo';

// 授業を選んでレビューを書くフォーム。検索結果に出す内容がない。
export const metadata: Metadata = noindexPageMetadata('レビューを投稿 - ガタレビュ！');

export default function NewReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
