import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Links section */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            <a
              href="https://forms.gle/2EU6Yud7f5YXeJX18"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-green-600 text-sm md:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md px-2 py-1"
            >
              削除依頼
            </a>

            <a
              href="https://forms.gle/kawPCGBi6NB5pfQz8"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-green-600 text-sm md:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md px-2 py-1"
            >
              お問い合わせ
            </a>

            <Link href="/faq" className="text-gray-600 hover:text-green-600 text-sm md:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md px-2 py-1">
              FAQ
            </Link>

            <Link href="/terms" className="text-gray-600 hover:text-green-600 text-sm md:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md px-2 py-1">
              利用規約
            </Link>

            <Link href="/privacy" className="text-gray-600 hover:text-green-600 text-sm md:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md px-2 py-1">
              プライバシーポリシー
            </Link>
          </div>
        </div>

        {/* Brand section */}
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 py-4">
          <Image
            src="/green-title.svg"
            alt="ガタレビュ - 新潟大学授業レビューサイト"
            width={128}
            height={40}
            className="w-24 h-8 md:w-32 md:h-10 transition-opacity duration-200 hover:opacity-80"
            sizes="(max-width: 768px) 96px, 128px"
          />

          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm md:text-base">
              © 2025 ガタレビュ！
            </p>
            <p className="text-gray-500 text-xs md:text-sm">
              新潟大学授業レビューサイト
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}