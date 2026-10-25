export function readPageNumber(value: string | null): number {
  return value && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10000 ? Number(value) : 1;
}
