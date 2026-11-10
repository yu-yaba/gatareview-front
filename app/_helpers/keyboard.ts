// 日本語入力の変換確定で押した Enter は検索の実行に使わない。
// Safari は確定時の keydown を isComposing=false, keyCode=229 で送るため両方を見る。
export function isImeComposing(event: { nativeEvent: { isComposing?: boolean }; keyCode?: number }): boolean {
  return event.nativeEvent.isComposing === true || event.keyCode === 229;
}
