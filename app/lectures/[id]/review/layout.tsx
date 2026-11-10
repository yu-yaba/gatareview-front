import type { Metadata } from 'next';
import { noindexPageMetadata } from '../../../_helpers/seo';

// 授業ごとのレビュー投稿フォーム。タイトルは授業詳細（親の layout）のものを引き継ぎ、canonical は消す。
export const metadata: Metadata = noindexPageMetadata();

export default function LectureReviewFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
