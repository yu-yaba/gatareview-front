const LAST_UPDATED = '2025年12月17日';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="font-bold text-3xl">プライバシーポリシー</h1>
          <p className="text-sm text-gray-500 mt-3">最終更新日：{LAST_UPDATED}</p>
        </header>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          <p>
            ガタレビュ！運営事務局（以下「当事務局」といいます。）は、本サービスの提供にあたり取得するユーザー情報（個人情報を含みます。）を、以下のとおり取り扱います。
          </p>

          <section>
            <h2 className="font-bold text-xl mb-3">1. 事業者情報</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">個人情報取扱事業者：</span>
                ガタレビュ！運営事務局
              </li>
              <li>
                <span className="font-semibold">所在地・代表者等：</span>
                本人からの求めに応じて遅滞なく開示します（下記「お問い合わせ先」よりご連絡ください）。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">2. 取得する情報</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">アカウント情報：</span>
                Google認証により取得されるメールアドレス、表示名、プロフィール画像URL、外部サービス上の識別子等
              </li>
              <li>
                <span className="font-semibold">投稿・利用情報：</span>
                レビュー内容、評価、投稿日時、授業に紐づく入力項目（出席、テスト形式等）、ブックマーク、ありがとう等の操作履歴
              </li>
              <li>
                <span className="font-semibold">問い合わせ情報：</span>
                お問い合わせや削除依頼のフォームに入力された内容（連絡先、本文等）
              </li>
              <li>
                <span className="font-semibold">端末・ログ情報：</span>
                IPアドレス、ユーザーエージェント、閲覧日時、リファラ等のアクセスログ
              </li>
              <li>
                <span className="font-semibold">Cookie等：</span>
                ログイン状態の維持、設定の保持、アクセス解析等のためのCookieやローカルストレージ等
              </li>
              <li>
                <span className="font-semibold">不正利用対策情報：</span>
                レビュー投稿時等にreCAPTCHAを通じて取得されるトークン等（当該トークンは不正アクセス・スパム対策のために利用されます）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">3. 利用目的</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>本サービスの提供、本人確認、ログインの管理のため</li>
              <li>レビュー等の投稿・表示、機能提供（閲覧条件の判定等）のため</li>
              <li>不正利用・スパム・不正アクセスの防止およびセキュリティ確保のため</li>
              <li>問い合わせ対応、削除依頼等への対応のため</li>
              <li>利用状況の分析、品質向上、新機能の検討のため</li>
              <li>法令遵守、権利保護、紛争対応のため</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">4. 第三者提供・外部サービスの利用</h2>
            <p className="mb-3">当事務局は、以下の外部サービスを利用する場合があります。外部サービスの提供者が取得する情報や取り扱いについては、各社の規約・ポリシーが適用されます。</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Google認証（Google OAuth）：</span>
                ログイン機能の提供のために利用します。
              </li>
              <li>
                <span className="font-semibold">Google reCAPTCHA：</span>
                スパム等の不正利用防止のために利用します。
              </li>
              <li>
                <span className="font-semibold">Googleアナリティクス：</span>
                アクセス解析のために利用します（Cookie等を用いてトラフィックデータを収集します）。
              </li>
              <li>
                <span className="font-semibold">Googleフォーム：</span>
                お問い合わせ・削除依頼の受付のために利用する場合があります。
              </li>
            </ul>

            <p className="mt-4 text-sm text-gray-700">
              reCAPTCHAに関する表示（外部サイト）：<br />
              <span className="font-mono">This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</span>
            </p>

            <p className="mt-4 text-sm text-gray-700">
              なお、当事務局が外部サービスを利用することにより、ユーザー情報の一部が日本国外で取り扱われる場合があります。当事務局は、法令に従い必要な情報提供・同意取得その他の措置を講じます。
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-700">関連情報（外部サイト）：</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google プライバシーポリシー
                  </a>
                </li>
                <li>
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google 利用規約
                  </a>
                </li>
                <li>
                  <a
                    href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Googleアナリティクス利用規約
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">5. Cookie等の利用について</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cookie等は、ログイン状態の維持、機能提供、アクセス解析等のために利用します。</li>
              <li>ブラウザ設定によりCookieを無効化できますが、その場合はログイン等の機能が利用できない、または正しく動作しないことがあります。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">6. 保管期間</h2>
            <p>当事務局は、利用目的の達成に必要な範囲で情報を保管し、不要となった場合または法令等に従い適切な方法で削除または匿名化します。</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">7. 安全管理</h2>
            <p>当事務局は、取得した情報の漏えい、滅失または毀損の防止その他の安全管理のため、合理的な安全対策を講じるよう努めます。</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">8. 開示・訂正・利用停止等の請求</h2>
            <p className="mb-3">
              ユーザーは、当事務局が保有する自己の情報について、法令の定めに従い、開示、訂正・追加・削除、利用停止・消去、第三者提供の停止等を請求できます。
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>請求は下記「お問い合わせ先」より受け付けます。</li>
              <li>請求内容の確認および本人確認のため、追加情報の提出をお願いする場合があります。</li>
              <li>法令上の要件を満たさない場合、または当事務局の保有しない情報等については、請求に応じられない場合があります。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">9. 本ポリシーの変更</h2>
            <p>当事務局は、法令その他本ポリシーに別段の定めのある事項を除いて、本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じます。</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-3">10. お問い合わせ先</h2>
            <p>
              本ポリシーに関するお問い合わせは、フッターの「お問い合わせ」または下記メールアドレス宛にご連絡ください。
              <br />
              <span className="font-semibold">メール：</span>
              contact@gatareview.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
