import Link from "next/link";
import Image from "next/image";
import whiteTitle from "../public/white-title.png";


export default function Header() {
  return (
    <>
      <header className="bg-[#1DBE67] h-20 md:h-[90px] flex justify-between items-center shadow-md mb-4">
        <Link href="/lectures" className="flex items-center">
          <div className="pl-7 md:pl-10 flex">
            <Image src={whiteTitle} alt="title" className="w-7/12 md:w-8/12"></Image>
          </div>
        </Link>
      </header>
    </>
  )
}