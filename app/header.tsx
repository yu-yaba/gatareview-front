import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-20 md:h-24 flex justify-between items-center shadow-md mb-4">
        {/* Logo section */}
        <Link href="/" className="flex items-center group">
          <div className="pl-7 md:pl-10 flex">
            <Image
              src="/white-title.svg"
              alt="ガタレビュ - 新潟大学授業レビューサイト"
              width={200}
              height={60}
              className="w-[160px] md:w-[200px] h-auto transition-transform duration-200 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 160px, 200px"
            />
          </div>
        </Link>

        {/* Action buttons section */}
        <div className="flex items-center pr-7 md:pr-10">
          <Link href="/reviews/new">
            <button className="px-4 py-2.5 md:px-6 md:py-3 bg-white/90 backdrop-blur-md text-green-600 font-bold rounded-xl shadow-lg border border-white/30 transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50">
              <span className="text-sm md:text-base">レビューする</span>
            </button>
          </Link>
        </div>
      </header>
    </>
  )
}