type JapanYearMonth = {
  year: number;
  month: number;
}

function japanYearMonth(date: Date): JapanYearMonth {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)

  return { year, month }
}

export function getCurrentAcademicYear(date = new Date()): number {
  const { year, month } = japanYearMonth(date)
  return month < 4 ? year - 1 : year
}

export function getCurrentAcademicTerm(date = new Date()): number {
  const { month } = japanYearMonth(date)
  if (month === 4 || month === 5) return 1
  if (month >= 6 && month <= 8) return 2
  if (month >= 9 && month <= 11) return 3
  return 4
}
