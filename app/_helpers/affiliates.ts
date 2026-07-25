import type { AffiliatePlacement, AffiliateProgram } from '../_types/AffiliateProgram';

/**
 * A8.netの広告案件。季節ごとの入れ替えはこの配列だけを編集する。
 *
 * 各URLはA8.netの管理画面で取得した広告タグから転記する。
 *   linkUrl            : <a href="..."> のURL          (https://px.a8.net/svt/ejp?a8mat=...)
 *   bannerUrl          : バナー <img> のsrc            (https://www**.a8.net/svt/bgt?aid=...)
 *   impressionPixelUrl : 末尾の1x1計測用 <img> のsrc   (https://www**.a8.net/0.gif?a8mat=...)
 *
 * activeMonths は掲載したい月(1〜12)。履修登録期に合わせて出し分ける想定。
 *   3〜4月  : 合宿免許・自動車学校
 *   9〜10月 : 就活サービス
 *   通年     : 塾講師バイト等
 *
 * 配列が空、または該当する案件がない月は広告枠ごと非表示になる。
 */
export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [];

/**
 * 日本時間での月(1〜12)を返す。
 *
 * サーバー(Vercelは通常UTC)とブラウザ(利用者はJST)で月の判定がズレると、
 * 月替わりの前後9時間でハイドレーション不一致や誤った出し分けが起きるため、
 * 実行環境に依存せずJSTで判定する。履修登録期という基準自体が日本時間のもの。
 */
function currentMonthInJst(date: Date): number {
  const month = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
  }).format(date);

  return Number(month);
}

/**
 * 指定した掲載面・時期に表示すべき案件を1件返す。該当がなければnull。
 */
export function getActiveProgram(
  placement: AffiliatePlacement,
  date: Date = new Date()
): AffiliateProgram | null {
  const month = currentMonthInJst(date);

  return (
    AFFILIATE_PROGRAMS.find(
      (program) =>
        program.placements.includes(placement) && program.activeMonths.includes(month)
    ) ?? null
  );
}
