const TermsOfService = () => (
  <div className="flex justify-center">
    <div className="w-9/12">
      <li className="list-none my-6">
        <h1 className="text-center font-bold text-3xl mb-6">プライバシーポリシー</h1>
      </li>
      <li className="list-none my-6">
        <h2 className="font-bold text-xl my-3">Cookieについて</h2>
        <ul className="mb-3">本ウェブサイトでは、利便性の向上を目的としてクッキーを使用しています。なお、お客様の個人情報を取得する目的では使用していません。</ul>
        <ul>このCookieの機能はCookieを無効にすることで拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</ul>
      </li>
      <li className="list-none my-6">
        <h2 className="font-bold text-xl my-3">アクセス解析ツールについて</h2>
        <ul className="mb-3">当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</ul>
        <ul>この規約に関して、詳しくは以下のURLからご確認ください。</ul>
        <a href='https://marketingplatform.google.com/about/analytics/terms/jp/' target='_blank' rel='noopener noreferrer' className="text-blue-500 hover:underline">Googleアナリティクス利用規約</a>
      </li>
      <li className="list-none my-6">
        <h2 className="font-bold text-xl my-3">IPアドレスの記録について</h2>
        <ul>一部サービスにおいて情報管理の目的でIPアドレスを収集する場合があります。サイト上ではIPアドレスが公開されることはありません。</ul>
      </li>
      <li className="list-none my-6">
        <h2 className="font-bold text-xl my-3">プライバシーポリシーの変更</h2>
        <ul className="mb-3">本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，ユーザーに通知することなく，変更することができるものとします。</ul>
        <ul>当社が別途定める場合を除いて，変更後のプライバシーポリシーは，本ウェブサイトに掲載したときから効力を生じるものとします</ul>
      </li>
    </div>
  </div>
);

export default TermsOfService;
