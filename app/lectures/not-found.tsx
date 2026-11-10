import NotFoundContent from '../_components/NotFoundContent'

// 存在しない授業ID（/lectures/[id] の notFound()）の 404 画面。デザインはサイト共通の 404 と同じ。
// タイトルは授業詳細の generateMetadata（授業が見つからない場合）が付ける。
export default function LectureNotFound() {
  return (
    <NotFoundContent
      title="授業が見つかりません"
      description={
        <>
          お探しの授業ページは存在しないか、削除された可能性があります。
          <br className="hidden sm:block" />
          授業検索から目的の授業を探してみてください。
        </>
      }
    />
  )
}
