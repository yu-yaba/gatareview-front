'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Loading from 'react-loading'
import { FaCalendarAlt, FaTrash } from 'react-icons/fa'
import { timetableApi } from '@/app/_helpers/api'
import type { TimetableData, TimetableEntry } from '@/app/_types/TimetableData'
import TimetableGrid from '@/app/_components/TimetableGrid'

const terms = [1, 2, 3, 4, 0]
const currentYear = new Date().getFullYear()

export default function TimetablePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const requestId = useRef(0)
  const resolvedDefault = useRef<string | null>(null)
  const [data, setData] = useState<TimetableData | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [year, setYear] = useState(currentYear)
  const [term, setTerm] = useState<number | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    if (term !== null && resolvedDefault.current === `${year}-${term}`) {
      resolvedDefault.current = null
      return
    }

    const controller = new AbortController()
    const activeRequestId = ++requestId.current
    setLoading(true)
    setError(null)
    setData(null)

    timetableApi.get(year, term ?? undefined, controller.signal)
      .then((response) => {
        if (controller.signal.aborted || requestId.current !== activeRequestId) return
        const responseData = response.data
        if (responseData.year !== year || (term !== null && responseData.term !== term)) {
          throw new Error('Requested timetable does not match the response')
        }
        if (term === null) {
          resolvedDefault.current = `${responseData.year}-${responseData.term}`
          setTerm(responseData.term)
        }
        setData(responseData)
        setAvailableYears((current) => Array.from(new Set([
          ...current,
          ...(responseData.available_years ?? []),
          responseData.year,
        ])).sort((left, right) => right - left))
      })
      .catch(() => {
        if (controller.signal.aborted || requestId.current !== activeRequestId) return
        setData(null)
        setError('時間割を読み込めませんでした。時間をおいて再度お試しください。')
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId.current === activeRequestId) setLoading(false)
      })

    return () => controller.abort()
  }, [session, year, term, reloadVersion])

  const remove = async (entry: TimetableEntry) => {
    if (loading || deletingId !== null) return
    if (!window.confirm(`${entry.lecture.title}を時間割から削除しますか？`)) return

    setDeletingId(entry.id)
    try {
      await timetableApi.deleteEntry(entry.id)
      setData((current) => {
        if (!current || current.year !== year || current.term !== term) return current
        return {
          ...current,
          entries: current.entries.filter((item) => item.id !== entry.id),
          intensive_entries: current.intensive_entries.filter((item) => item.id !== entry.id),
        }
      })
    } catch {
      window.alert('時間割から削除できませんでした。')
    } finally {
      setDeletingId(null)
    }
  }

  const yearOptions = useMemo(
    () => Array.from(new Set([year, ...availableYears])).sort((left, right) => right - left),
    [year, availableYears]
  )
  const activeData = term !== null && data?.year === year && data.term === term ? data : null
  const controlsDisabled = loading || deletingId !== null

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loading type="bubbles" color="#16a34a" width={96} height={96} /></div>
  }
  if (!session) return null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-green-600">MY SCHEDULE</p>
            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-gray-900"><FaCalendarAlt className="text-green-600" />時間割</h1>
            <p className="mt-3 text-gray-600">履修中の授業を、曜日と時限で管理できます。</p>
          </div>
          <label className="text-sm font-bold text-gray-600">
            年度
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              disabled={controlsDisabled}
              className="ml-3 rounded-xl border border-gray-200 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:cursor-wait disabled:opacity-60"
            >
              {yearOptions.map((item) => <option key={item} value={item}>{item}年度</option>)}
            </select>
          </label>
        </header>

        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="学期を選択">
          {terms.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTerm(item)}
              disabled={controlsDisabled}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${term === item ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'border border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:text-green-700'}`}
            >
              {item === 0 ? '集中講義' : `第${item}ターム`}
            </button>
          ))}
        </nav>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}{' '}
            <button type="button" onClick={() => setReloadVersion((current) => current + 1)} disabled={loading} className="ml-2 underline disabled:opacity-60">再読み込み</button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-xl">
            <Loading type="bubbles" color="#16a34a" width={80} height={80} />
          </div>
        ) : activeData && term === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl sm:p-7">
            <h2 className="text-xl font-bold text-gray-900">集中講義・その他</h2>
            {activeData.intensive_entries.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {activeData.intensive_entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <Link href={`/lectures/${entry.lecture.id}${entry.lecture_offering_id && entry.lecture_offering_status === 'active' ? `?offering_id=${entry.lecture_offering_id}` : ''}`} className="font-semibold text-gray-800 hover:text-green-700">{entry.lecture.title}</Link>
                    <button type="button" onClick={() => remove(entry)} disabled={controlsDisabled} className="shrink-0 text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"><FaTrash className="mr-1 inline" />削除</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500">登録された集中講義はありません。</p>
            )}
          </section>
        ) : activeData ? (
          <TimetableGrid entries={activeData.entries} year={activeData.year} term={activeData.term} onDelete={remove} disabled={controlsDisabled} />
        ) : !error ? (
          <p className="rounded-3xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-xl">時間割を表示できませんでした。</p>
        ) : null}
      </div>
    </main>
  )
}
