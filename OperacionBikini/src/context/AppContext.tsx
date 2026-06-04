import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { AppState, Week, AeroSession } from '../types'
import { week1 } from '../data/week1'
import { week3 } from '../data/week3'
import { week4 } from '../data/week4'
import { week5 } from '../data/week5'
import { week6 } from '../data/week6'
import { loadState, saveState } from '../utils/storage'

// Sesiones aeróbicas históricas (pre-cargadas)
const INITIAL_AERO: AeroSession[] = [
  { id: 'aero-1', date: '2026-05-17', paceMinKm: 6.0,   heartRate: 138, type: 'z2',     durationMin: 48, distanceKm: 8,   notes: '8 km Z2' },
  { id: 'aero-2', date: '2026-05-20', paceMinKm: 5.75,  heartRate: 138, type: 'z2',     durationMin: 35, distanceKm: 6,   notes: '6 km Z2' },
  { id: 'aero-3', date: '2026-06-02', paceMinKm: 5.867, heartRate: 141, type: 'z2',     durationMin: 35, distanceKm: 6,   notes: 'Z2 reactivación' },
  { id: 'aero-4', date: '2026-06-04', paceMinKm: 5.05,  heartRate: 153, type: 'quality', durationMin: 40, distanceKm: 7.2, notes: 'Tempo 7.2km, bloque 20\' a 5:03/km @153' },
]

const fallbackState: AppState = {
  weeks: [week1, week3, week4, week5, week6],
  weights: [],
  aeroSessions: INITIAL_AERO,
  darkMode: null,
}

function applyPlanData(planWeeks: Week[], saved: AppState): Week[] {
  const blockChecked: Record<string, boolean> = {}
  const subChecked: Record<string, boolean> = {}
  const dayMeta: Record<string, { waterGlasses: number; notes: string; closed: boolean }> = {}

  for (const w of saved.weeks) {
    for (const d of w.days) {
      dayMeta[d.date] = { waterGlasses: d.waterGlasses, notes: d.notes, closed: d.closed }
      for (const b of d.blocks) {
        blockChecked[b.id] = b.checked
        for (const s of b.subItems ?? []) subChecked[s.id] = s.checked
      }
    }
  }

  return planWeeks.map(w => ({
    ...w,
    days: w.days.map(d => ({
      ...d,
      ...(dayMeta[d.date] ?? {}),
      blocks: d.blocks.map(b => ({
        ...b,
        checked: blockChecked[b.id] ?? b.checked,
        subItems: b.subItems?.map(s => ({ ...s, checked: subChecked[s.id] ?? s.checked })),
      })),
    })),
  }))
}

type Action =
  | { type: 'TOGGLE_BLOCK'; date: string; blockId: string }
  | { type: 'TOGGLE_SUBITEM'; date: string; blockId: string; itemId: string }
  | { type: 'SET_WATER'; date: string; glasses: number }
  | { type: 'SET_WEIGHT'; date: string; kg: number }
  | { type: 'SET_NOTES'; date: string; notes: string }
  | { type: 'CLOSE_DAY'; date: string }
  | { type: 'ADD_AERO_SESSION'; session: AeroSession }
  | { type: 'SET_DARK_MODE'; value: boolean | null }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'LOAD_PLAN'; weeks: Week[] }

function updateDay(state: AppState, date: string, updater: (day: AppState['weeks'][0]['days'][0]) => AppState['weeks'][0]['days'][0]): AppState {
  return {
    ...state,
    weeks: state.weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.date === date ? updater(d) : d),
    })),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_BLOCK':
      return updateDay(state, action.date, d => ({
        ...d,
        blocks: d.blocks.map(b =>
          b.id === action.blockId ? { ...b, checked: !b.checked } : b
        ),
      }))

    case 'TOGGLE_SUBITEM':
      return updateDay(state, action.date, d => ({
        ...d,
        blocks: d.blocks.map(b =>
          b.id === action.blockId
            ? {
                ...b,
                subItems: b.subItems?.map(s =>
                  s.id === action.itemId ? { ...s, checked: !s.checked } : s
                ),
              }
            : b
        ),
      }))

    case 'SET_WATER':
      return updateDay(state, action.date, d => ({ ...d, waterGlasses: action.glasses }))

    case 'SET_WEIGHT': {
      const exists = state.weights.find(w => w.date === action.date)
      const weights = exists
        ? state.weights.map(w => w.date === action.date ? { ...w, kg: action.kg } : w)
        : [...state.weights, { date: action.date, kg: action.kg }]
      return { ...state, weights }
    }

    case 'SET_NOTES':
      return updateDay(state, action.date, d => ({ ...d, notes: action.notes }))

    case 'CLOSE_DAY':
      return updateDay(state, action.date, d => ({ ...d, closed: true }))

    case 'ADD_AERO_SESSION':
      return {
        ...state,
        aeroSessions: [...state.aeroSessions.filter(s => s.id !== action.session.id), action.session]
          .sort((a, b) => a.date.localeCompare(b.date)),
      }

    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.value }

    case 'IMPORT_STATE':
      return action.state

    case 'LOAD_PLAN':
      return { ...state, weeks: applyPlanData(action.weeks, state) }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

const PLAN_URL = 'https://raw.githubusercontent.com/vmgarro-collab/antigravity/main/OperacionBikini/public/data/plan.json'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadState()
    if (!saved) return fallbackState
    // Migrar estado antiguo que podría no tener aeroSessions
    return {
      ...fallbackState,
      ...saved,
      aeroSessions: saved.aeroSessions?.length ? saved.aeroSessions : INITIAL_AERO,
    } as AppState
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveState(state), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [state])

  // Cargar plan remoto
  useEffect(() => {
    fetch(`${PLAN_URL}?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.weeks)) {
          dispatch({ type: 'LOAD_PLAN', weeks: data.weeks })
        }
      })
      .catch(() => { /* sin red — usar datos locales */ })
  }, [])

  // Aplicar clase dark al <html>
  useEffect(() => {
    const root = document.documentElement
    if (state.darkMode === true) {
      root.classList.add('dark')
    } else if (state.darkMode === false) {
      root.classList.remove('dark')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [state.darkMode])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider')
  return ctx
}
