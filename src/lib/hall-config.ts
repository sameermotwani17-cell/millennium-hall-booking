// ─── Millennium Hall — exact layout from physical seating chart ───────────────
//
// Each row has up to 5 blocks:
//   [outerLeft 1-4] [innerLeft 5-16] [center 17-28] [innerRight 29-40] [outerRight 41-44]
//
// Outer wing blocks are staggered (row A & K have none; B has 1 each side; E-J full 4).
// A small wing aisle separates outer from inner on both sides.

export type RowConfig = {
  row: string
  outerLeftStart:  number   // 0 = absent; otherwise the lowest outer-left seat (e.g. 4 for row B, 1 for E)
  outerLeftEnd:    number   // always 4 when present, 0 when absent
  // innerLeft always 5-16, center always 17-28, innerRight always 29-40
  outerRightStart: number   // always 41 when present, 0 when absent
  outerRightEnd:   number   // 41(B), 42(C), 43(D), 44(E+); 0 when absent
  isBalcony?:      boolean
  isWheelchair?:   boolean  // Row R: center only, no left/right blocks
}

export const INNER_LEFT_START  = 5
export const INNER_LEFT_END    = 16
export const CENTER_START      = 17
export const CENTER_END        = 28
export const INNER_RIGHT_START = 29
export const INNER_RIGHT_END   = 40

export const ROW_CONFIGS: RowConfig[] = [
  // ── Main Floor (A-J) ────────────────────────────────────────────────────────
  { row: 'A', outerLeftStart: 0, outerLeftEnd: 0, outerRightStart:  0, outerRightEnd:  0 },
  { row: 'B', outerLeftStart: 4, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 41 },
  { row: 'C', outerLeftStart: 3, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 42 },
  { row: 'D', outerLeftStart: 2, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 43 },
  { row: 'E', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  { row: 'F', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  { row: 'G', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  { row: 'H', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  { row: 'I', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  { row: 'J', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44 },
  // ── Balcony (K-R) ────────────────────────────────────────────────────────────
  { row: 'K', outerLeftStart: 0, outerLeftEnd: 0, outerRightStart:  0, outerRightEnd:  0, isBalcony: true },
  { row: 'L', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'M', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'N', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'O', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'P', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'Q', outerLeftStart: 1, outerLeftEnd: 4, outerRightStart: 41, outerRightEnd: 44, isBalcony: true },
  { row: 'R', outerLeftStart: 0, outerLeftEnd: 0, outerRightStart:  0, outerRightEnd:  0, isBalcony: true, isWheelchair: true },
]

// Section codes: OL = outer-left wing, L = inner-left, C = center, R = inner-right, OR = outer-right wing
export type SeatEntry = { id: string; seatNum: number; section: string }

export function getRowSeatEntries(row: RowConfig): SeatEntry[] {
  const entries: SeatEntry[] = []

  // Outer left wing (seats 1–4 range, staggered)
  if (row.outerLeftStart > 0) {
    for (let n = row.outerLeftStart; n <= row.outerLeftEnd; n++) {
      entries.push({ id: `${row.row}${String(n).padStart(2, '0')}`, seatNum: n, section: 'OL' })
    }
  }

  // Inner left (5–16) — absent only on wheelchair row R
  if (!row.isWheelchair) {
    for (let n = INNER_LEFT_START; n <= INNER_LEFT_END; n++) {
      entries.push({ id: `${row.row}${String(n).padStart(2, '0')}`, seatNum: n, section: 'L' })
    }
  }

  // Center (17–28) — always present
  for (let n = CENTER_START; n <= CENTER_END; n++) {
    entries.push({ id: `${row.row}${String(n).padStart(2, '0')}`, seatNum: n, section: 'C' })
  }

  // Inner right (29–40) — absent only on wheelchair row R
  if (!row.isWheelchair) {
    for (let n = INNER_RIGHT_START; n <= INNER_RIGHT_END; n++) {
      entries.push({ id: `${row.row}${String(n).padStart(2, '0')}`, seatNum: n, section: 'R' })
    }
  }

  // Outer right wing (41–44 range, staggered)
  if (row.outerRightStart > 0) {
    for (let n = row.outerRightStart; n <= row.outerRightEnd; n++) {
      entries.push({ id: `${row.row}${String(n).padStart(2, '0')}`, seatNum: n, section: 'OR' })
    }
  }

  return entries
}

export function getSeatZone(row: string, seatNum: number): 'premium' | 'standard' | 'balcony' {
  if ('KLMNOPQR'.includes(row)) return 'balcony'
  if ('ABC'.includes(row) && seatNum >= CENTER_START && seatNum <= CENTER_END) return 'premium'
  return 'standard'
}

export const TOTAL_SEATS = ROW_CONFIGS.reduce((sum, r) => {
  let n = 0
  if (r.outerLeftStart > 0) n += r.outerLeftEnd - r.outerLeftStart + 1
  if (!r.isWheelchair) {
    n += INNER_LEFT_END - INNER_LEFT_START + 1   // 5-16 = 12
    n += INNER_RIGHT_END - INNER_RIGHT_START + 1  // 29-40 = 12
  }
  n += CENTER_END - CENTER_START + 1              // 17-28 = 12
  if (r.outerRightStart > 0) n += r.outerRightEnd - r.outerRightStart + 1
  return sum + n
}, 0)  // = 732

export const MAX_SEATS_PER_BOOKING = 1

export const ZONE_LABELS: Record<string, string> = {
  premium:  'Premium · Centre Front',
  standard: 'Standard Stalls',
  balcony:  'Balcony',
}

// Legacy compat
export type SectionConfig = { id: string; label: string; zone: string; rows: number; cols: number }
export const SECTION_CONFIG: SectionConfig[] = []
