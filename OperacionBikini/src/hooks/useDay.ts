import { useAppContext } from '../context/AppContext'
import type { Day } from '../types'

export function useDay(date?: string): Day | null {
  const { state } = useAppContext()
  const target = date ?? new Date().toISOString().slice(0, 10)
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === target) return day
    }
  }
  return null
}

export function useCurrentWeekNumber(): number {
  const { state } = useAppContext()
  const today = new Date().toISOString().slice(0, 10)
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === today) return week.weekNumber
    }
  }
  return 1
}
