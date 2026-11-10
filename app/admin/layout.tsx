import type { Metadata } from 'next';
import { noindexPageMetadata } from '../_helpers/seo';

// 管理者用の画面。
export const metadata: Metadata = noindexPageMetadata('管理画面 - ガタレビュ！');

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
