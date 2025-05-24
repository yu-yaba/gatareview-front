import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './header'
import Footer from './footer'
import { ToastContainer } from 'react-toastify';
import ScriptGa from './_components/ScriptGa'
import Script from 'next/script';
import NextAuthProvider from './_components/NextAuthProvider';

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
  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en">
      <head>
        <ScriptGa />
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <NextAuthProvider>
          <Header />
          <ToastContainer />
          {children}
          <Footer />
        </NextAuthProvider>
      </body>
    </html>
  )
}