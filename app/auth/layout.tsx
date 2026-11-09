import type { Metadata } from 'next';
import { noindexPageMetadata } from '../_helpers/seo';

// ログイン・ログアウト画面。ヘッダーから全ページでリンクされるので、クロールは許可して noindex で外す。
export const metadata: Metadata = noindexPageMetadata('ログイン - ガタレビュ！');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
