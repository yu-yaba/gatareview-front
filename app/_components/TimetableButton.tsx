'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Modal from 'react-modal'
import { FaCalendarPlus, FaSpinner } from 'react-icons/fa'
import type { OfferingData } from '@/app/_types/LectureSchema'
import type { TimetableEntry, TimetablePlacement } from '@/app/_types/TimetableData'
import { DAY_LABELS } from '@/app/_helpers/offering'
import { timetableApi } from '@/app/_helpers/api'
import { getCurrentAcademicTerm, getCurrentAcademicYear } from '@/app/_helpers/academicCalendar'
import { getModalAppElement } from '@/app/_helpers/modalAppElement'
import LoginPromptModal from './LoginPromptModal'

type TimetableButtonProps = { lectureId: number; offering: OfferingData | null }
type PlacementMode = 'automatic' | 'manual'
type PlacementTarget = {
  source: PlacementMode;
  year: number;
  placements: TimetablePlacement[];
  lectureOfferingId?: number;
}

const terms = [1, 2, 3, 4]
const days = [1, 2, 3, 4, 5, 6, 7]
const periods = [1, 2, 3, 4, 5, 6, 7]

function automaticTarget(offering: OfferingData | null): PlacementTarget | null {
  if (!offering || offering.schedule_kind === 'unknown') return null

  if (offering.schedule_kind === 'intensive' || offering.schedule_kind === 'other') {
    return {
      source: 'automatic',
      year: offering.year,
      placements: [{ term: 0 }],
      lectureOfferingId: offering.id,
    }
  }

  if (offering.schedule_kind === 'regular' && offering.slots.length > 0 && offering.term_numbers.length > 0) {
    return {
      source: 'automatic',
      year: offering.year,
      placements: offering.term_numbers.flatMap((term) =>
        offering.slots.map((slot) => ({ term, day: slot.day, period: slot.period }))
      ),
      lectureOfferingId: offering.id,
    }
  }

  return null
}

function placementLabel(placement: TimetablePlacement) {
  if (placement.term === 0) return '集中講義・その他'
  return `第${placement.term}ターム ${DAY_LABELS[placement.day ?? 0] ?? '?'}${placement.period ?? '?'}限`
}

function conflictLabel(entry: TimetableEntry) {
  const slot = entry.term === 0
    ? '集中講義・その他'
    : `第${entry.term}ターム ${DAY_LABELS[entry.day ?? 0] ?? '?'}${entry.period ?? '?'}限`
  return `${entry.year}年度 ${slot}「${entry.lecture.title}」`
}

export default function TimetableButton({ lectureId, offering }: TimetableButtonProps) {
  const { data: session, status } = useSession()
  const backendToken = session?.backendToken?.trim()
  const autoTarget = useMemo(() => automaticTarget(offering), [offering])
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [requiresReauthentication, setRequiresReauthentication] = useState(false)
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [mode, setMode] = useState<PlacementMode>('manual')
  const [manualYear, setManualYear] = useState(() => offering?.year ?? getCurrentAcademicYear())
  const [manualTerms, setManualTerms] = useState<number[]>(() => [getCurrentAcademicTerm()])
  const [manualDay, setManualDay] = useState(offering?.slots[0]?.day ?? 1)
  const [manualPeriod, setManualPeriod] = useState(offering?.slots[0]?.period ?? 1)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openPlacementModal = () => {
    const suggestedTerms = offering?.term_numbers.length
      ? offering.term_numbers
      : [getCurrentAcademicTerm()]
    setMode(autoTarget ? 'automatic' : 'manual')
    setManualYear(offering?.year ?? getCurrentAcademicYear())
    setManualTerms(suggestedTerms)
    setManualDay(offering?.slots[0]?.day ?? 1)
    setManualPeriod(offering?.slots[0]?.period ?? 1)
    setSubmitError(null)
    setShowPlacementModal(true)
  }

  const toggleManualTerm = (term: number) => {
    if (term === 0) {
      setManualTerms([0])
      return
    }

    setManualTerms((current) => {
      const regularTerms = current.filter((item) => item !== 0)
      return regularTerms.includes(term)
        ? regularTerms.filter((item) => item !== term)
        : [...regularTerms, term].sort()
    })
  }

  const manualTarget = (): PlacementTarget | null => {
    if (!Number.isInteger(manualYear) || manualYear < 1000 || manualYear > 9999 || manualTerms.length === 0) {
      return null
    }

    if (manualTerms.includes(0)) {
      return { source: 'manual', year: manualYear, placements: [{ term: 0 }] }
    }

    if (!days.includes(manualDay) || !periods.includes(manualPeriod)) return null
    return {
      source: 'manual',
      year: manualYear,
      placements: manualTerms.map((term) => ({ term, day: manualDay, period: manualPeriod })),
    }
  }

  const save = async (target: PlacementTarget) => {
    setLoading(true)
    setSubmitError(null)
    try {
      try {
        await timetableApi.createEntries(
          lectureId,
          target.year,
          target.placements,
          false,
          target.source === 'automatic' ? target.lectureOfferingId : undefined
        )
      } catch (error: any) {
        const conflicts = error.response?.data?.conflicts as TimetableEntry[] | undefined
        if (error.response?.status !== 409 || !conflicts?.length) throw error

        const conflictList = conflicts.map((entry) => `・${conflictLabel(entry)}`).join('\n')
        const confirmed = window.confirm(
          `${conflictList}\n\n上記の講義を削除し、この講義に置き換えますか？`
        )
        if (!confirmed) return

        await timetableApi.createEntries(
          lectureId,
          target.year,
          target.placements,
          true,
          target.source === 'automatic' ? target.lectureOfferingId : undefined,
          conflicts.map((entry) => entry.id),
        )
      }

      setShowPlacementModal(false)
      window.alert('時間割に追加しました')
    } catch (error: any) {
      if (error.response?.status === 401) {
        setShowPlacementModal(false)
        setRequiresReauthentication(true)
        setShowLoginModal(true)
        return
      }
      setSubmitError(
        error.response?.data?.errors?.[0] ||
        error.response?.data?.message ||
        '時間割への追加に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const target = mode === 'automatic' ? autoTarget : manualTarget()
    if (!target) {
      setSubmitError('年度・ターム・曜日・時限を確認してください')
      return
    }
    await save(target)
  }

  const buttonClassName = 'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
  if (status === 'loading') {
    return <button type="button" disabled className={buttonClassName}><FaSpinner className="animate-spin" />確認中</button>
  }
  if (!backendToken) {
    return (
      <>
        <button type="button" onClick={() => setShowLoginModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200">
          <FaCalendarPlus />時間割に追加
        </button>
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          featureType="timetable"
          forceReauthentication={Boolean(session)}
        />
      </>
    )
  }

  return (
    <>
      <button type="button" onClick={openPlacementModal} disabled={loading} className={buttonClassName}>
        {loading ? <FaSpinner className="animate-spin" /> : <FaCalendarPlus />}時間割に追加
      </button>

      <Modal
        isOpen={showPlacementModal}
        onRequestClose={() => {
          if (!loading) setShowPlacementModal(false)
        }}
        appElement={getModalAppElement()}
        contentLabel="時間割への追加"
        shouldCloseOnEsc={!loading}
        shouldCloseOnOverlayClick={!loading}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-left shadow-2xl outline-none sm:p-8"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
          <form onSubmit={submit}>
            <h2 id="timetable-placement-title" className="text-2xl font-bold text-gray-900">時間割への追加</h2>
            <p className="mt-2 text-sm text-gray-600">登録する年度とコマを確認してください。</p>

            {autoTarget && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('automatic')}
                  disabled={loading}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === 'automatic' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}
                >
                  シラバス通り
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  disabled={loading}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === 'manual' ? 'bg-white text-green-700 shadow' : 'text-gray-600'}`}
                >
                  手動で修正
                </button>
              </div>
            )}

            {mode === 'automatic' && autoTarget ? (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-bold text-green-900">{autoTarget.year}年度</p>
                <ul className="mt-2 space-y-1 text-sm text-green-800">
                  {autoTarget.placements.map((placement) => (
                    <li key={`${placement.term}-${placement.day ?? 0}-${placement.period ?? 0}`}>・{placementLabel(placement)}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-green-700">シラバスの開講情報に紐づけて登録します。</p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {!autoTarget && offering?.schedule_kind === 'unknown' && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                    シラバスの曜限を特定できないため、手動で配置してください。
                  </p>
                )}

                <label className="block text-sm font-bold text-gray-700">
                  年度
                  <input
                    type="number"
                    min="1000"
                    max="9999"
                    value={manualYear}
                    onChange={(event) => setManualYear(Number(event.target.value))}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <fieldset>
                  <legend className="text-sm font-bold text-gray-700">ターム（複数選択可）</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {terms.map((term) => (
                      <label key={term} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-bold ${manualTerms.includes(term) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600'}`}>
                        <input type="checkbox" checked={manualTerms.includes(term)} onChange={() => toggleManualTerm(term)} disabled={loading} className="sr-only" />
                        第{term}ターム
                      </label>
                    ))}
                    <label className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-bold ${manualTerms.includes(0) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600'}`}>
                      <input type="checkbox" checked={manualTerms.includes(0)} onChange={() => toggleManualTerm(0)} disabled={loading} className="sr-only" />
                      集中・その他
                    </label>
                  </div>
                </fieldset>

                {!manualTerms.includes(0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm font-bold text-gray-700">
                      曜日
                      <select value={manualDay} onChange={(event) => setManualDay(Number(event.target.value))} disabled={loading} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100">
                        {days.map((day) => <option key={day} value={day}>{DAY_LABELS[day]}曜日</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-bold text-gray-700">
                      時限
                      <select value={manualPeriod} onChange={(event) => setManualPeriod(Number(event.target.value))} disabled={loading} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100">
                        {periods.map((period) => <option key={period} value={period}>{period}限</option>)}
                      </select>
                    </label>
                  </div>
                )}

                <p className="text-xs text-gray-500">手動配置はシラバスの開講情報に紐づけず、選択したコマをそのまま保存します。</p>
              </div>
            )}

            {submitError && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{submitError}</p>}

            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setShowPlacementModal(false)} disabled={loading} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                キャンセル
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
                {loading && <FaSpinner className="animate-spin" />}追加する
              </button>
            </div>
          </form>
      </Modal>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        featureType="timetable"
        forceReauthentication={requiresReauthentication}
      />
    </>
  )
}
