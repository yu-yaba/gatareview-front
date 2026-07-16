import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const AuthButton = dynamic(() => import("./_components/AuthButton"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center px-5 py-3 sm:px-6 sm:py-3 md:px-7 md:py-3 lg:px-8 lg:py-3.5">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-20 md:h-24 flex justify-between items-center border-b border-green-700/10 shadow-sm mb-4">
        {/* Logo section */}
        <Link href="/" className="flex items-center group">
          <div className="pl-4 sm:pl-8 md:pl-7 lg:pl-10 flex">
            <Image
              src="/white-header-title.png"
              alt="ガタレビュ - 新潟大学授業レビューサイト"
              width={220}
              height={66}
              className="w-[132px] xs:w-[145px] sm:w-[180px] md:w-[190px] lg:w-[200px] xl:w-[220px] h-auto transition-opacity duration-200 group-hover:opacity-90"
              priority
              sizes="(max-width: 475px) 160px, (max-width: 640px) 180px, (max-width: 768px) 190px, (max-width: 1024px) 200px, 220px"
            />
          </div>
        </Link>

        {/* Action buttons section */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 md:space-x-3 pr-3 sm:pr-8 md:pr-7 lg:pr-10">
          {/* レビューするボタン */}
          <Link href="/lectures/">
            <button className="group relative flex items-center px-3.5 py-3 sm:px-6 sm:py-3 md:px-7 md:py-3 lg:px-8 lg:py-3.5 bg-white/95 backdrop-blur-md text-green-600 font-bold rounded-xl shadow-md border border-white/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-green-700 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              {/* アイコン */}
              <svg className="w-4 h-4 lg:w-5 lg:h-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {/* テキスト（md以上で表示） */}
              <span className="hidden md:inline ml-2 text-sm lg:text-base relative">レビューする</span>
            </button>
          </Link>

          {/* 認証ボタン */}
          <AuthButton />
        </div>
      </header>
    </>
  )
}
