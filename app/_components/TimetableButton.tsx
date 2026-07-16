'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaCalendarPlus, FaSpinner } from 'react-icons/fa'
import type { OfferingData } from '@/app/_types/LectureSchema'
import type { TimetablePlacement } from '@/app/_types/TimetableData'
import { timetableApi } from '@/app/_helpers/api'
import LoginPromptModal from './LoginPromptModal'

type TimetableButtonProps = { lectureId: number; offering: OfferingData | null }

export default function TimetableButton({ lectureId, offering }: TimetableButtonProps) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const manualPlacement = (): { year: number; placements: TimetablePlacement[] } | null => {
    const value = window.prompt('年度, ターム, 曜日, 時限を「2026,3,2,2」の形式で入力してください（集中は「2026,0」）')
    if (!value) return null

    const values = value.split(',').map((item) => Number(item.trim()))
    if (values.length === 2 && values[1] === 0 && Number.isInteger(values[0])) {
      return { year: values[0], placements: [{ term: 0 }] }
    }
    if (values.length !== 4 || values.some((item) => !Number.isInteger(item))) return null

    const [year, term, day, period] = values
    if (year < 1000 || year > 9999 || term < 1 || term > 4 || day < 1 || day > 7 || period < 1 || period > 7) return null
    return { year, placements: [{ term, day, period }] }
  }

  const offeringPlacement = (): { year: number; placements: TimetablePlacement[] } | null => {
    if (!offering) return null
    if (offering.slots.length > 0 && offering.term_numbers.length > 0) {
      return {
        year: offering.year,
        placements: offering.term_numbers.flatMap((term) =>
          offering.slots.map((slot) => ({ term, day: slot.day, period: slot.period }))
        ),
      }
    }
    if (offering.schedule_kind === 'intensive' || offering.term_numbers.length === 0) {
      return { year: offering.year, placements: [{ term: 0 }] }
    }
    return null
  }

  const addToTimetable = async (replace = false, payload?: { year: number; placements: TimetablePlacement[] }) => {
    const target = payload ?? offeringPlacement() ?? manualPlacement()
    if (!target) {
      window.alert('入力内容を確認してください')
      return
    }
    if (!replace && !window.confirm(`${target.year}年度の時間割に追加しますか？`)) return

    setLoading(true)
    try {
      await timetableApi.createEntries(
        lectureId,
        target.year,
        target.placements,
        replace,
        offering?.year === target.year ? offering.id : undefined
      )
      window.alert('時間割に追加しました')
    } catch (error: any) {
      const conflicts = error.response?.data?.conflicts
      if (error.response?.status === 409 && conflicts?.length && window.confirm('既に講義が登録されています。置き換えますか？')) {
        await addToTimetable(true, target)
      } else {
        window.alert(error.response?.data?.errors?.[0] || '時間割への追加に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  const buttonClassName = 'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
  if (status === 'loading') {
    return <button type="button" disabled className={buttonClassName}><FaSpinner className="animate-spin" />確認中</button>
  }
  if (!session) {
    return (
      <>
        <button type="button" onClick={() => setShowLoginModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200">
          <FaCalendarPlus />時間割に追加
        </button>
        <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} featureType="timetable" />
      </>
    )
  }

  return (
    <button type="button" onClick={() => addToTimetable()} disabled={loading} className={buttonClassName}>
      {loading ? <FaSpinner className="animate-spin" /> : <FaCalendarPlus />}時間割に追加
    </button>
  )
}
