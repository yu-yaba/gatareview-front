import { signOut, type SignOutParams } from 'next-auth/react'
import { isAxiosError } from 'axios'
import { authApi } from './api'

// API access must end before discarding the session that holds its token.
export async function signOutWithRevocation(options: SignOutParams) {
  try {
    await authApi.logout()
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 401) {
      throw new Error('ログアウトに失敗しました。通信状態を確認して再度お試しください。')
    }
  }

  return signOut(options)
}
