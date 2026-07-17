import Link from 'next/link'
import { FaPlus, FaStar, FaTrash } from 'react-icons/fa'
import type { TimetableEntry } from '@/app/_types/TimetableData'
import { DAY_LABELS } from '@/app/_helpers/offering'

type TimetableGridProps = {
  entries: TimetableEntry[];
  year: number;
  term: number;
  onDelete: (entry: TimetableEntry) => void;
  disabled?: boolean;
}

export default function TimetableGrid({ entries, year, term, onDelete, disabled = false }: TimetableGridProps) {
  const days = [1, 2, 3, 4, 5, 6, 7].filter((day) => day <= 5 || entries.some((entry) => entry.day === day))
  const periods = [1, 2, 3, 4, 5, 6, 7].filter((period) => period <= 5 || entries.some((entry) => entry.period === period))
  const entryFor = (day: number, period: number) => entries.find((entry) => entry.day === day && entry.period === period)

  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-xl">
      <table className="w-full min-w-[760px] table-fixed text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-16 p-3 text-xs font-bold text-gray-400">時限</th>
            {days.map((day) => <th key={day} className="p-3 font-bold text-gray-700">{DAY_LABELS[day]}</th>)}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} className="border-b border-gray-100 last:border-0">
              <th className="bg-gray-50/70 p-3 text-gray-500">{period}限</th>
              {days.map((day) => {
                const entry = entryFor(day, period)
                const offeringQuery = entry?.lecture_offering_id && entry.lecture_offering_status === 'active'
                  ? `?offering_id=${entry.lecture_offering_id}`
                  : ''
                return (
                  <td key={day} className="h-28 border-l border-gray-100 p-2 align-top">
                    {entry ? (
                      <div className="flex h-full flex-col rounded-xl border border-green-100 bg-green-50 p-3 text-green-950">
                        <Link href={`/lectures/${entry.lecture.id}${offeringQuery}`} className="line-clamp-2 font-bold leading-5 hover:text-green-700">
                          {entry.lecture.title}
                        </Link>
                        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600"><FaStar />{entry.lecture.avg_rating.toFixed(1)}</p>
                        <button type="button" onClick={() => onDelete(entry)} disabled={disabled} className="mt-auto text-left text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50">
                          <FaTrash className="mr-1 inline" />削除
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/lectures?term=${term}&day=${day}&period=${period}&offering_year=${year}`}
                        className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-300 transition hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                        aria-label={`${DAY_LABELS[day]}曜日${period}限に授業を追加`}
                      >
                        <FaPlus />
                      </Link>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
