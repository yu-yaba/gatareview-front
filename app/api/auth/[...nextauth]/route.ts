import NextAuth from "next-auth"
import type { NextRequest } from "next/server"

import { authOptions } from "@/app/_helpers/authOptions"

const handler = NextAuth(authOptions)

export { handler as GET }

// NextAuthのCSRF検証後のイベントでAPIトークンを失効させる。
// イベントの例外はNextAuthが握りつぶすため、失敗時はCookie削除を含む
// レスポンスを破棄し、既存セッションを保持して再試行できるようにする。
export async function POST(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  let revocationFailed = false
  const requestHandler = NextAuth({
    ...authOptions,
    events: {
      ...authOptions.events,
      async signOut({ token }) {
        if (!token?.backendToken) return

        try {
          const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV
          if (!backendUrl) throw new Error('Backend URL is not configured')
          const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token.backendToken}` },
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(10_000),
          })
          if (!response.ok && response.status !== 401) throw new Error('API revocation failed')
        } catch {
          revocationFailed = true
          throw new Error('API revocation failed')
        }
      },
    },
  })
  const response: Response = await requestHandler(request, context)
  if (revocationFailed) {
    return Response.json(
      { error: 'ログアウトに失敗しました。通信状態を確認して再度お試しください。' },
      { status: 503, headers: { 'Cache-Control': 'private, no-cache, no-store' } },
    )
  }
  return response
}
