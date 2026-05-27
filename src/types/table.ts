export type RowHeight = 'compact' | 'normal' | 'tall'

export type TableLayout = {
  columns: Record<string, { width?: number; visible?: boolean }>
  rowHeight: RowHeight
}
