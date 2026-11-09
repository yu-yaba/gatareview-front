import type { Metadata } from 'next';
import { noindexPageMetadata } from '../_helpers/seo';

// ログインした本人だけが使う画面。マイページ配下（ブックマーク・自分のレビュー）すべてに適用される。
export const metadata: Metadata = noindexPageMetadata('マイページ - ガタレビュ！');

export default function MypageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
