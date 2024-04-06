import Link from "next/link";
import Image from "next/image";
import greenTitle from "../public/green-title.png";


export default function Header() {
  return (
    <footer className="mt-20 border-t border-[#eaedf0] w-[80%] m-auto py-4">
      <div className="flex flex-wrap justify-center items-center text-xs md:text-base">
        <a href="https://forms.gle/2EU6Yud7f5YXeJX18" target="_blank" rel="noreferrer" className="m-3">
          削除依頼
        </a>
        <a href="https://forms.gle/kawPCGBi6NB5pfQz8" target="_blank" rel="noreferrer" className="m-3">
          お問い合わせ
        </a>
        <Link href="/terms" className="m-3">
          利用規約
        </Link>
        <Link href="/privacy" className="m-3">
          プライバシーポリシー
        </Link>
      </div>
      <div className="flex justify-center items-center text-center py-2">
        <Image src={greenTitle} alt="title" className="w-20 mx-2"></Image>
        <p className="text-[#808080] text-[0.7rem] mx-2">© 2024 ガタレビュ！</p>
      </div>
    </footer>
  )
}