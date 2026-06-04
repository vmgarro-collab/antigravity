// Sesión aeróbica registrada manualmente (Z2 o calidad)
export interface AeroSession {
  id: string
  date: string           // "2026-05-17"
  paceMinKm: number      // minutos decimales, e.g. 5.75 = 5:45/km
  heartRate: number      // ppm media
  type: 'z2' | 'quality' | 'long'
  durationMin?: number
  distanceKm?: number
  notes?: string         // e.g. "tempo 7.2km bloque 20' a 5:03"
}

export interface SubItem {
  id: string
  text: string
  checked: boolean
}

export interface Block {
  id: string
  type: 'workout' | 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'weighIn' | 'pre_match' | 'post_match_strategy'
  title: string
  description?: string
  subItems?: SubItem[]
  checked: boolean
  estimatedKcal?: number
  recipe?: string[]
  alternatives?: string[]
  cookingMethod?: 'plancha' | 'horno' | 'microondas' | 'airfryer' | 'vapor' | 'crudo' | 'salteado'
  do?: string[]
  phrase?: string
}

export interface Day {
  date: string        // "2026-05-04"
  dayName: string     // "Lunes"
  blocks: Block[]
  notes: string
  waterGlasses: number
  waterTarget?: number
  closed: boolean
  specialNote?: string
  alcoholQuota?: number
  estimatedDailyKcal?: number
}

export interface Week {
  weekNumber: number
  days: Day[]
}

export interface AppState {
  weeks: Week[]
  weights: { date: string; kg: number }[]   // pesajes opcionales, sin objetivo
  aeroSessions: AeroSession[]               // historial eficiencia aeróbica
  darkMode: boolean | null
}
