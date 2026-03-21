'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { FaLock, FaShieldAlt, FaUnlockAlt } from 'react-icons/fa'
import { error as notifyError, success as notifySuccess } from '@/app/_helpers/notifications'
import { reviewAccessAdminApi, type AdminReviewAccessState } from '@/app/_helpers/api'

const enableConfirmationMessage = [
  'レビュー閲覧制限を有効にしますか？',
  '',
  '未ログインユーザーとレビュー未投稿ユーザーは、授業詳細ページのレビュー全文を閲覧できなくなります。',
].join('\n')

const disableConfirmationMessage = [
  'レビュー閲覧制限を無効にしますか？',
  '',
  'すべてのユーザーが、授業詳細ページのレビュー全文を閲覧できるようになります。',
].join('\n')

const formatUpdatedAt = (updatedAt: string | null) => {
  if (!updatedAt) return '未更新'

  return new Date(updatedAt).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReviewAccessAdminPage() {
  const router = useRouter()
  const { status } = useSession()
  const [reviewAccessState, setReviewAccessState] = useState<AdminReviewAccessState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isForbidden, setIsForbidden] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
      return
    }

    if (status !== 'authenticated') return

    const fetchReviewAccessState = async () => {
      try {
        setIsLoading(true)
        setIsForbidden(false)
        setLoadError(null)
        const response = await reviewAccessAdminApi.getReviewAccess()
        setReviewAccessState(response.data)
      } catch (requestError) {
        if (axios.isAxiosError(requestError)) {
          if (requestError.response?.status === 401) {
            router.replace('/auth/signin')
            return
          }

          if (requestError.response?.status === 403) {
            setIsForbidden(true)
            return
          }
        }

        setReviewAccessState(null)
        setLoadError('通信エラーが発生しました。時間をおいて再度お試しください')
        notifyError('通信エラーが発生しました。時間をおいて再度お試しください')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviewAccessState()
  }, [router, status])

  const handleToggle = async () => {
    if (!reviewAccessState || isSaving) return

    const nextEnabled = !reviewAccessState.lecture_review_restriction_enabled
    const shouldUpdate = window.confirm(nextEnabled ? enableConfirmationMessage : disableConfirmationMessage)

    if (!shouldUpdate) return

    try {
      setIsSaving(true)
      const response = await reviewAccessAdminApi.updateReviewAccess(nextEnabled)
      setReviewAccessState(response.data)
      notifySuccess(
        nextEnabled
          ? 'レビュー閲覧制限を有効にしました'
          : 'レビュー閲覧制限を無効にしました'
      )
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && !requestError.response) {
        notifyError('通信エラーが発生しました。時間をおいて再度お試しください')
      } else {
        notifyError('レビュー閲覧制限の更新に失敗しました')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <p className="text-sm font-medium text-slate-500">設定を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-red-500">403 FORBIDDEN</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">管理者のみアクセスできます</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            この画面はレビュー閲覧制限の切替専用です。管理者権限を持つアカウントでログインしてください。
          </p>
        </div>
      </div>
    )
  }

  if (!reviewAccessState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-red-500">LOAD ERROR</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">設定を取得できませんでした</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {loadError || '通信エラーが発生しました。時間をおいて再度お試しください'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold tracking-[0.2em] text-emerald-700">
                <FaShieldAlt />
                REVIEW ACCESS
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">レビュー閲覧制限</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                対象は授業詳細ページのレビュー本文だけです。ルートページや一覧表示には影響しません。
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              reviewAccessState?.lecture_review_restriction_enabled
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {reviewAccessState?.lecture_review_restriction_enabled ? <FaLock /> : <FaUnlockAlt />}
              {reviewAccessState?.lecture_review_restriction_enabled ? '制限 ON' : '制限 OFF'}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">現在の状態</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {reviewAccessState?.lecture_review_restriction_enabled ? '有効' : '無効'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {reviewAccessState?.lecture_review_restriction_enabled
                  ? '未ログインユーザーとレビュー未投稿ユーザーは、授業詳細ページのレビュー全文を閲覧できません。'
                  : 'すべてのユーザーが、授業詳細ページのレビュー全文を閲覧できます。'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={!reviewAccessState || isSaving}
              className={`inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition ${
                reviewAccessState?.lecture_review_restriction_enabled
                  ? 'bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
              }`}
            >
              {isSaving
                ? '更新中...'
                : reviewAccessState?.lecture_review_restriction_enabled
                  ? '制限を OFF にする'
                  : '制限を ON にする'}
            </button>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">LAST UPDATED</p>
              <p className="mt-2 font-medium text-slate-900">{formatUpdatedAt(reviewAccessState?.updated_at || null)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">UPDATED BY</p>
              <p className="mt-2 font-medium text-slate-900">
                {reviewAccessState?.last_updated_by
                  ? `${reviewAccessState.last_updated_by.name} (${reviewAccessState.last_updated_by.email})`
                  : '未更新'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
