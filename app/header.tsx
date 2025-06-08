import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-20 md:h-[90px] flex justify-between items-center shadow-md mb-4">
        <Link href="/lectures" className="flex items-center">
          <div className="pl-7 md:pl-10 flex">
            <img src="/white-title.png" alt="title" className="w-[160px] md:w-[40%] md:h-[80%]" />
          </div>
        </Link>
        {/* <Link href="/reviews/new" className="mr-7 md:mr-10">
          <button className="bg-white text-green-500 font-bold py-2 px-4 rounded-md shadow-md hover:scale-110 transition-transform duration-200 ease-in-out">
            レビューする
          </button>
        </Link> */}
      </header>
    </>
  )
}