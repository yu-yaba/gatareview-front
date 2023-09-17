import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import Header from './header'
import Footer from './footer'
import { ToastContainer } from 'react-toastify';
import Favicon from '../public/icon.png'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ガタレビュ！',
  description: '新潟大学生のための授業レビューサイトです。シラバスではわからない情報や過去問を共有しましょう。',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png'
  },
  themeColor: '#1DBE67',
  colorScheme: 'light',
  openGraph: {
    title: 'ガタレビュ！',
    description: '新潟大学生のための授業レビューサイトです。シラバスではわからない情報や過去問を共有しましょう。',
    url: 'https://gatareview.com',
    siteName: 'ガタレビュ！',
    images: [
      {
        url: 'https://gatareview.com/ogp.png',
        width: '1200',
        height: '630'
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <Header />
        <ToastContainer />
        {children}
        <Footer />
      </body>
    </html>
  )
}
