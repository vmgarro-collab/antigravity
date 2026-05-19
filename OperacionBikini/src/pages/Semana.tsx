import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { localDateStr } from '../utils/storage'
import type { Day } from '../types'
import DayDrawer from '../components/layout/DayDrawer'

const DAY_TYPES: Record<string, { label: string; color: string }> = {
  'Lunes':     { label: 'Fuera', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  'Martes':    { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Miércoles': { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Jueves':    { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Viernes':   { label: 'Fuera', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  'Sábado':    { label: 'Flexible', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  'Domingo':   { label: 'Flexible', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
}

function DayCard({ day, onClick }: { day: Day; onClick: () => void }) {
  const { state } = useAppContext()
  const today = localDateStr()
  const isToday = day.date === today
  const isPast = day.date < today
  const weight = state.weights.find(w => w.date === day.date)
  const checked = day.blocks.filter(b => b.checked).length
  const total = day.blocks.length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0
  const dayType = DAY_TYPES[day.dayName]

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all active:scale-95 ${
        isToday
          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{day.dayName}</span>
            {isToday && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Hoy</span>}
          </div>
          <span className="text-xs text-gray-400">{day.date}</span>
        </div>
        <div className="flex items-center gap-2">
          {dayType && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dayType.color}`}>{dayType.label}</span>}
          {day.closed ? <CheckCircle2 size={16} className="text-green-500" /> : isPast ? <Circle size={16} className="text-gray-300" /> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>

      {weight && (
        <p className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium">⚖️ {weight.kg} kg</p>
      )}
    </button>
  )
}

export default function Semana() {
  const { state } = useAppContext()
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const allDays = state.weeks.flatMap(w => w.days)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pt-2">Semana</h1>
      <div className="space-y-2">
        {allDays.map(day => (
          <DayCard key={day.date} day={day} onClick={() => setSelectedDay(day)} />
        ))}
      </div>
      <DayDrawer day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  )
}
