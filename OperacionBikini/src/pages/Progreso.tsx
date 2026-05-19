import { useState } from 'react'
import { Download, Upload, Sun, Moon, ChevronDown, ChevronUp, Target, Flame, BarChart2, Trophy } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAppContext } from '../context/AppContext'
import { exportJSON, importJSON } from '../utils/storage'
import type { AppState } from '../types'

export default function Progreso() {
  const { state, dispatch } = useAppContext()
  const [notesOpen, setNotesOpen] = useState(false)

  const { user, weights, weeks } = state
  const allDays = weeks.flatMap(w => w.days)
  const today = new Date().toISOString().slice(0, 10)

  // Peso actual = último pesaje
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const currentWeight = sortedWeights[sortedWeights.length - 1]?.kg ?? user.startWeight
  const imc = (currentWeight / (user.height * user.height)).toFixed(1)

  // Racha: días consecutivos cerrados hasta hoy
  const daysSorted = [...allDays].filter(d => d.date <= today).sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const d of daysSorted) {
    if (d.closed) streak++
    else break
  }

  // Adherencia semana actual
  const weekDays = allDays.filter(d => {
    const dDate = new Date(d.date + 'T12:00:00')
    const mon = new Date(today + 'T12:00:00')
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return dDate >= mon && dDate <= sun && d.date <= today
  })
  const adherencia = weekDays.length > 0
    ? Math.round((weekDays.filter(d => d.closed).length / weekDays.length) * 100)
    : 0

  // Datos gráfica
  const chartData = sortedWeights.map(w => ({
    date: w.date.slice(5),
    kg: w.kg,
  }))

  // Notas históricas
  const notes = allDays.filter(d => d.notes.trim()).sort((a, b) => b.date.localeCompare(a.date))

  // Countdown torneo 31 mayo
  const torneoDate = new Date('2026-05-31T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')
  const diasTorneo = Math.max(0, Math.round((torneoDate.getTime() - todayDate.getTime()) / 86400000))

  const handleImport = async () => {
    try {
      const imported = await importJSON()
      if (confirm('¿Importar datos? Se sobrescribirá el estado actual.')) {
        dispatch({ type: 'IMPORT_STATE', state: imported as AppState })
      }
    } catch {
      alert('Error al importar el archivo. Asegúrate de que es un JSON válido.')
    }
  }

  const toggleDark = () => {
    const isDark = document.documentElement.classList.contains('dark')
    dispatch({ type: 'SET_DARK_MODE', value: !isDark })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Progreso</h1>
        <button onClick={toggleDark} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {state.darkMode === true ? <Sun size={18} className="text-gray-600 dark:text-gray-300" /> : <Moon size={18} className="text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Torneo countdown */}
      {diasTorneo >= 0 && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} className="text-violet-500" />
            <span className="font-semibold text-violet-800 dark:text-violet-300">Torneo 5x5 — 31 mayo</span>
          </div>
          {diasTorneo === 0 ? (
            <p className="text-sm text-violet-700 dark:text-violet-300 font-semibold">¡Hoy es el día! Suerte.</p>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-violet-700 dark:text-violet-300">{diasTorneo}</span>
              <span className="text-sm text-violet-500">{diasTorneo === 1 ? 'día' : 'días'} para el torneo</span>
            </div>
          )}
          <p className="text-xs text-violet-400 mt-1">Objetivo: llegar a tope físico y mental.</p>
        </div>
      )}

      {/* Peso */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-violet-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">Peso</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentWeight} <span className="text-lg font-normal text-gray-400">kg</span></p>
            <p className="text-sm text-gray-400">Objetivo: {user.targetWeight} kg</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IMC</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{imc}</p>
            <p className="text-xs text-gray-400">Quedan {(currentWeight - user.targetWeight).toFixed(1)} kg</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Racha</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{streak} <span className="text-sm font-normal text-gray-400">días</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={16} className="text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Adherencia S3</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adherencia}<span className="text-sm font-normal text-gray-400">%</span></p>
        </div>
      </div>

      {/* Resumen semanas cerradas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Historial de semanas</p>

        {/* S1 */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">S1 — 4-11 mayo ✓</p>
            <p className="text-xs text-gray-400">79.0 → 77.4 kg · −1.6 kg</p>
          </div>
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Cerrada</span>
        </div>

        {/* S2 */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">S2 — 12-18 mayo ✓</p>
            <p className="text-xs text-gray-400">77.4 → 77.8 kg · +0.4 aparente (−0.5 real)</p>
            <p className="text-xs text-gray-400">Retención hídrica comunión — adherencia media</p>
          </div>
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Cerrada</span>
        </div>

        {/* S3 en curso */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">S3 — 19-25 mayo</p>
            <p className="text-xs text-gray-400">Inicio: 77.8 kg · Objetivo: 75.8-76.3 kg</p>
            <p className="text-xs text-violet-400">Semana de sostenibilidad · Pre-torneo</p>
          </div>
          <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">En curso</span>
        </div>
      </div>

      {/* Gráfica */}
      {chartData.length > 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Evolución del peso</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#a78bfa' }}
                formatter={(v) => [`${v} kg`, 'Peso']}
              />
              <ReferenceLine y={user.targetWeight} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1.5} />
              <Line type="monotone" dataKey="kg" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-green-500 mt-1">— Objetivo ({user.targetWeight} kg)</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-400">Registra tu primer pesaje el lunes o jueves para ver la gráfica.</p>
        </div>
      )}

      {/* Notas históricas */}
      {notes.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <button
            onClick={() => setNotesOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Notas ({notes.length})</span>
            {notesOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {notesOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              {notes.map(d => (
                <div key={d.date}>
                  <p className="text-xs text-gray-400 mb-0.5">{d.date} — {d.dayName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{d.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export / Import */}
      <div className="flex gap-3 pt-2 pb-6">
        <button
          onClick={() => exportJSON(state)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Download size={16} />
          Exportar JSON
        </button>
        <button
          onClick={handleImport}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload size={16} />
          Importar JSON
        </button>
      </div>
    </div>
  )
}
