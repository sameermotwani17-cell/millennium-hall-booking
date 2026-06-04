import type { SectionConfig } from '@/types'

export const SECTION_CONFIG: SectionConfig[] = [
  { id: 'L',  label: 'Left Stalls',    zone: 'standard', rows: 8,  cols: 12 },
  { id: 'C',  label: 'Center Stalls',  zone: 'standard', rows: 11, cols: 12, premiumRows: 3 },
  { id: 'R',  label: 'Right Stalls',   zone: 'standard', rows: 8,  cols: 12 },
  { id: 'FL', label: 'Front Left',     zone: 'premium',  rows: 4,  cols: 5  },
  { id: 'FR', label: 'Front Right',    zone: 'premium',  rows: 4,  cols: 5  },
  { id: 'BL', label: 'Balcony Left',   zone: 'balcony',  rows: 7,  cols: 12 },
  { id: 'BC', label: 'Balcony Center', zone: 'balcony',  rows: 11, cols: 11 },
  { id: 'BR', label: 'Balcony Right',  zone: 'balcony',  rows: 7,  cols: 12 },
  { id: 'RL', label: 'Rear Left',      zone: 'balcony',  rows: 4,  cols: 7  },
  { id: 'RR', label: 'Rear Right',     zone: 'balcony',  rows: 4,  cols: 7  },
]

export const TOTAL_SEATS = SECTION_CONFIG.reduce((sum, s) => sum + s.rows * s.cols, 0)

export const ZONE_LABELS: Record<string, string> = {
  premium:  'Premium Front',
  standard: 'Standard Stalls',
  balcony:  'Balcony',
  side:     'Side Stalls',
}

export const MAX_SEATS_PER_BOOKING = 4

export function getSeatZone(sectionId: string, rowIndex: number): string {
  const section = SECTION_CONFIG.find(s => s.id === sectionId)
  if (!section) return 'standard'
  if (section.zone === 'premium') return 'premium'
  if (section.premiumRows && rowIndex < section.premiumRows) return 'premium'
  return section.zone
}
