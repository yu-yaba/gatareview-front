import type { Metadata } from 'next';
import { noindexPageMetadata } from '../../_helpers/seo';

export const metadata: Metadata = noindexPageMetadata('ログアウト - ガタレビュ！');

export default function SignOutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
