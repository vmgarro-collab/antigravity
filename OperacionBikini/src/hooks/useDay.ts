import { useAppContext } from '../context/AppContext'
import { localDateStr } from '../utils/storage'
import type { Day } from '../types'

export function useDay(date?: string): Day | null {
  const { state } = useAppContext()
  const target = date ?? localDateStr()
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === target) return day
    }
  }
  return null
}

export function useCurrentWeekNumber(): number {
  const { state } = useAppContext()
  const today = localDateStr()
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === today) return week.weekNumber
    }
  }
  return 1
}
