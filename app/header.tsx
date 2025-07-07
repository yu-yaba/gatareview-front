import Link from "next/link";
import Image from "next/image";
import AuthButton from "./_components/AuthButton";

export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-20 md:h-24 flex justify-between items-center shadow-md mb-4">
        {/* Logo section */}
        <Link href="/" className="flex items-center group">
          <div className="pl-5 sm:pl-8 md:pl-7 lg:pl-10 flex">
            <Image
              src="/white-title.svg"
              alt="ガタレビュ - 新潟大学授業レビューサイト"
              width={200}
              height={60}
              className="w-[150px] sm:w-[170px] md:w-[180px] lg:w-[200px] h-auto transition-transform duration-200 group-hover:scale-105"
              priority
              sizes="(max-width: 640px) 170px, (max-width: 768px) 180px, (max-width: 1024px) 180px, 200px"
            />
          </div>
        </Link>

        {/* Action buttons section */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3 pr-5 sm:pr-8 md:pr-7 lg:pr-10">
          {/* レビューするボタン */}
          <Link href="/reviews/new">
            <button className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-2.5 lg:px-6 lg:py-3 bg-white/90 backdrop-blur-md text-green-600 font-bold rounded-xl shadow-lg border border-white/30 transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50">
              {/* アイコン */}
              <svg className="w-5 h-5 sm:w-5 sm:h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {/* テキスト（md以上で表示） */}
              <span className="hidden md:inline ml-2 text-sm lg:text-base">レビューする</span>
            </button>
          </Link>

          {/* 認証ボタン */}
          <AuthButton />
        </div>
      </header>
    </>
  )
}