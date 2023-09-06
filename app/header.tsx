import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-[90px] flex justify-between items-center shadow-md mb-8">
        <Link href="/lectures" className="flex items-center">
          <div className="pl-8 flex align-middle">
            <img src="/white-title.png" alt="title" className="w-[40%] h-[80%]" />
          </div>
        </Link>
        <div className="pr-10">
          <Link href="/lectures/new" className="inline-flex items-center">
            <button className="bg-white text-[#1dbe67] font-bold text-[90%] p-3 rounded-lg shadow-lg transform hover:scale-110 transition-transform duration-200 ease-in-out">
              授業を登録
            </button>
          </Link>
        </div>
      </header>
    </>
  )
}