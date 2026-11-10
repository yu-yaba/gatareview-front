import NextAuth, { type AuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { NextRequest } from "next/server"

import { authOptions } from "@/app/_helpers/authOptions"
import { clientIpSigner } from "@/app/_helpers/backendRequest"
import { applySessionCookieLifetime } from "@/app/_helpers/sessionLifetime"

type RouteContext = { params: Promise<{ nextauth: string[] }> }

// NextAuth v4はセッションCookieに必ずExpiresを付けるため、発行したトークンの記憶設定と
// APIトークンの期限に合わせて応答のSet-Cookieを書き換える。
async function handleAuth(request: NextRequest, context: RouteContext, events?: AuthOptions["events"]) {
  const issued: { token: JWT | null } = { token: null }
  const requestHandler = NextAuth({
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      async jwt(params) {
        issued.token = null
        const token = await authOptions.callbacks!.jwt!(params)
        issued.token = token
        return token
      },
    },
    ...(events && { events: { ...authOptions.events, ...events } }),
  })
  const response: Response = await requestHandler(request, context)
  return applySessionCookieLifetime(response, issued.token)
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAuth(request, context)
}

// NextAuthのCSRF検証後のイベントでAPIトークンを失効させる。
// イベントの例外はNextAuthが握りつぶすため、失敗時はCookie削除を含む
// レスポンスを破棄し、既存セッションを保持して再試行できるようにする。
export async function POST(request: NextRequest, context: RouteContext) {
  let revocationFailed = false
  const response = await handleAuth(request, context, {
    async signOut({ token }) {
      if (!token?.backendToken) return

      try {
        const backendUrl = process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_ENV
        if (!backendUrl) throw new Error('Backend URL is not configured')
        const logoutUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/auth/logout`
        const signClientIp = await clientIpSigner()
        const response = await fetch(logoutUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.backendToken}`, ...signClientIp(logoutUrl, 'POST') },
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
  })
  if (revocationFailed) {
    return Response.json(
      { error: 'ログアウトに失敗しました。通信状態を確認して再度お試しください。' },
      { status: 503, headers: { 'Cache-Control': 'private, no-cache, no-store' } },
    )
  }
  return response
}
