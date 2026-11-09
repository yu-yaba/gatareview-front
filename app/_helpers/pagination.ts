export function isValidPageNumber(value: string | null): value is string {
  return value !== null && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10000;
}

export function readPageNumber(value: string | null): number {
  return isValidPageNumber(value) ? Number(value) : 1;
}
