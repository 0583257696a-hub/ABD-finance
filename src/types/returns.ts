export type AbdRow = Record<string, unknown>

export type ReturnsData = {
  source?: string
  trackId?: string
  month?: number | null
  yearToDate?: number | null
  months12?: number | null
  months36?: number | null
  months60?: number | null
  feeText?: string
  updatedAt?: string
}
