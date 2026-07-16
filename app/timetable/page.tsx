'use client'

import { useCallback, useEffect, useState } from 'react'
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
const defaultYears = Array.from({ length: 7 }, (_, index) => currentYear + 1 - index)

export default function TimetablePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<TimetableData | null>(null)
  const [year, setYear] = useState(currentYear)
  const [term, setTerm] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await timetableApi.get(year, term)
      setData(response.data)
      setYear(response.data.year)
      setTerm(response.data.term)
    } catch {
      setError('時間割を読み込めませんでした。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }, [year, term])

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (session) load()
  }, [session, load])

  const remove = async (entry: TimetableEntry) => {
    if (!window.confirm(`${entry.lecture.title}を時間割から削除しますか？`)) return
    try {
      await timetableApi.deleteEntry(entry.id)
      await load()
    } catch {
      window.alert('時間割から削除できませんでした。')
    }
  }

  if (status === 'loading' || (loading && !data)) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loading type="bubbles" color="#16a34a" width={96} height={96} /></div>
  }
  if (!session) return null

  const yearOptions = Array.from(new Set([year, ...defaultYears])).sort((left, right) => right - left)

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
            <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="ml-3 rounded-xl border border-gray-200 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100">
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
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${term === item ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'border border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:text-green-700'}`}
            >
              {item === 0 ? '集中講義' : `第${item}ターム`}
            </button>
          ))}
        </nav>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error} <button type="button" onClick={load} className="ml-2 underline">再読み込み</button>
          </div>
        )}

        {data && (term === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl sm:p-7">
            <h2 className="text-xl font-bold text-gray-900">集中講義・その他</h2>
            {data.intensive_entries.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.intensive_entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <Link href={`/lectures/${entry.lecture.id}`} className="font-semibold text-gray-800 hover:text-green-700">{entry.lecture.title}</Link>
                    <button type="button" onClick={() => remove(entry)} className="shrink-0 text-sm font-bold text-red-600 hover:text-red-700"><FaTrash className="mr-1 inline" />削除</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500">登録された集中講義はありません。</p>
            )}
          </section>
        ) : <TimetableGrid entries={data.entries} year={data.year} term={term} onDelete={remove} />)}
      </div>
    </main>
  )
}
