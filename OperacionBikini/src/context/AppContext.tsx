import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { AppState, ShoppingCategory } from '../types'
import { week1, week1ShoppingList } from '../data/week1'
import { loadState, saveState } from '../utils/storage'

const initialState: AppState = {
  user: {
    startWeight: 79,
    targetWeight: 72.5,
    height: 1.72,
    startDate: '2026-05-04',
  },
  weeks: [week1],
  weights: [],
  shoppingList: [week1ShoppingList],
  darkMode: null,
}

type Action =
  | { type: 'TOGGLE_BLOCK'; date: string; blockId: string }
  | { type: 'TOGGLE_SUBITEM'; date: string; blockId: string; itemId: string }
  | { type: 'SET_WATER'; date: string; glasses: number }
  | { type: 'SET_WEIGHT'; date: string; kg: number }
  | { type: 'SET_NOTES'; date: string; notes: string }
  | { type: 'CLOSE_DAY'; date: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; week: number; itemId: string }
  | { type: 'ADD_SHOPPING_ITEM'; week: number; name: string; category: ShoppingCategory }
  | { type: 'RESET_SHOPPING'; week: number }
  | { type: 'SET_DARK_MODE'; value: boolean | null }
  | { type: 'IMPORT_STATE'; state: AppState }

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

    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? { ...sl, items: sl.items.map(i => i.id === action.itemId ? { ...i, checked: !i.checked } : i) }
            : sl
        ),
      }

    case 'ADD_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? {
                ...sl,
                items: [...sl.items, {
                  id: `custom-${Date.now()}`,
                  category: action.category,
                  name: action.name,
                  checked: false,
                  custom: true,
                }],
              }
            : sl
        ),
      }

    case 'RESET_SHOPPING':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? { ...sl, items: sl.items.filter(i => !i.custom).map(i => ({ ...i, checked: false })) }
            : sl
        ),
      }

    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.value }

    case 'IMPORT_STATE':
      return action.state

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? initialState)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveState(state), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [state])

  // Aplicar clase dark al <html>
  useEffect(() => {
    const root = document.documentElement
    if (state.darkMode === true) {
      root.classList.add('dark')
    } else if (state.darkMode === false) {
      root.classList.remove('dark')
    } else {
      // seguir preferencia del sistema
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
