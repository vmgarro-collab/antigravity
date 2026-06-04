import { useRef } from 'react'
import { CheckCircle2, Moon, AlertTriangle } from 'lucide-react'
import { useDay } from '../hooks/useDay'
import { useAppContext } from '../context/AppContext'
import { localDateStr } from '../utils/storage'
import WorkoutBlock from '../components/blocks/WorkoutBlock'
import WeighInBlock from '../components/blocks/WeighInBlock'
import SimpleStrategyBlock from '../components/blocks/SimpleStrategyBlock'
import type { Block } from '../types'

const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function Hoy() {
  const today = localDateStr()
  const day = useDay(today)
  const { state, dispatch } = useAppContext()
  const notesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const weight = state.weights.find(w => w.date === today)

  const d = new Date(today + 'T12:00:00')
  const dateLabel = `${DAYS_ES[d.getDay()].charAt(0).toUpperCase() + DAYS_ES[d.getDay()].slice(1)}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`

  const handleNotes = (value: string) => {
    if (notesDebounce.current) clearTimeout(notesDebounce.current)
    notesDebounce.current = setTimeout(() => {
      dispatch({ type: 'SET_NOTES', date: today, notes: value })
    }, 500)
  }

  const closeDay = () => {
    if (day?.closed) return
    dispatch({ type: 'CLOSE_DAY', date: today })
  }

  if (!day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Moon size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Sin plan para hoy</h2>
        <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">Disfruta el descanso o espera a que empiece la siguiente semana.</p>
      </div>
    )
  }

  const renderBlock = (block: Block) => {
    if (MEAL_TYPES.has(block.type)) return null   // comidas eliminadas
    if (block.type === 'workout') return <WorkoutBlock key={block.id} block={block} date={today} />
    if (block.type === 'weighIn') return <WeighInBlock key={block.id} date={today} currentKg={weight?.kg} />
    if (block.type === 'pre_match' || block.type === 'post_match_strategy') {
      return <SimpleStrategyBlock key={block.id} block={block} date={today} />
    }
    return null
  }

  const trainingBlocks = day.blocks.filter(b => !MEAL_TYPES.has(b.type))
  const totalBlocks = trainingBlocks.length
  const checkedBlocks = trainingBlocks.filter(b => b.checked).length
  const progress = totalBlocks > 0 ? Math.round((checkedBlocks / totalBlocks) * 100) : 0

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dateLabel}</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{progress}%</span>
        </div>
      </div>

      {/* Nota especial del día */}
      {day.specialNote && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">{day.specialNote}</p>
        </div>
      )}

      {/* Bloques de entreno */}
      {day.blocks.map(renderBlock)}

      {/* Nota fija de nutrición */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed">
          Come suficiente para sostener los entrenos. Comidas completas, hidratación, 7-8h de sueño. En carrera, el combustible es lo que permite mejorar.
        </p>
      </div>

      {/* Notas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas del día</p>
        <textarea
          defaultValue={day.notes}
          onChange={e => handleNotes(e.target.value)}
          placeholder="¿Cómo ha ido el día? Sensaciones, ajustes..."
          rows={3}
          className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent resize-none focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
        />
      </div>

      {/* Cerrar día */}
      <button
        onClick={closeDay}
        disabled={day.closed}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
          day.closed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
            : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
        }`}
      >
        <CheckCircle2 size={18} />
        {day.closed ? 'Día cerrado ✓' : 'Cerrar día'}
      </button>
    </div>
  )
}
