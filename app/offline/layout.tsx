import type { Metadata } from 'next';
import { noindexPageMetadata } from '../_helpers/seo';

// PWA のオフライン表示用。
export const metadata: Metadata = noindexPageMetadata('オフライン - ガタレビュ！');

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
