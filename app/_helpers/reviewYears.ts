const FIRST_REVIEW_YEAR = 2020

export const getCurrentJapanYear = (date = new Date()) => (
  Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
    }).format(date)
  )
)

export const getReviewYearOptions = (currentYear = getCurrentJapanYear()) => {
  if (currentYear < FIRST_REVIEW_YEAR) return []

  return Array.from(
    { length: currentYear - FIRST_REVIEW_YEAR + 1 },
    (_, index) => String(currentYear - index)
  )
}
