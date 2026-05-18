export type ShoppingCategory =
  | 'proteinas'
  | 'verduras-frutas'
  | 'carbohidratos'
  | 'lacteos-huevos'
  | 'despensa'

export interface ShoppingItem {
  id: string
  category: ShoppingCategory
  name: string
  checked: boolean
  custom?: boolean
}

export interface ShoppingList {
  week: number
  items: ShoppingItem[]
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
  recipe?: string
}

export interface Day {
  date: string        // "2026-05-04"
  dayName: string     // "Lunes"
  blocks: Block[]
  notes: string
  waterGlasses: number
  closed: boolean
}

export interface Week {
  weekNumber: number
  days: Day[]
}

export interface AppState {
  user: {
    startWeight: number
    targetWeight: number
    height: number
    startDate: string
  }
  weeks: Week[]
  weights: { date: string; kg: number }[]
  shoppingList: ShoppingList[]
  darkMode: boolean | null
}
