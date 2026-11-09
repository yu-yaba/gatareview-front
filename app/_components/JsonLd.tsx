import { serializeJsonLd } from '../_helpers/seo';

// ページごとの構造化データ。サーバーコンポーネントから使う。
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
