import { useState } from 'react'
import { Download, Upload, Sun, Moon, TrendingUp, Zap, Flame, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts'
import { useAppContext } from '../context/AppContext'
import { exportJSON, importJSON, localDateStr } from '../utils/storage'
import type { AppState, AeroSession } from '../types'

// Convierte paceMinKm a string mm:ss
function fmtPace(p: number): string {
  const min = Math.floor(p)
  const sec = Math.round((p - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const SESSION_LABEL: Record<AeroSession['type'], string> = {
  z2: 'Z2',
  quality: 'Calidad',
  long: 'Largo',
}
const SESSION_COLOR: Record<AeroSession['type'], string> = {
  z2: '#22c55e',
  quality: '#f59e0b',
  long: '#3b82f6',
}

export default function Progreso() {
  const { state, dispatch } = useAppContext()
  const today = localDateStr()

  // ── Racha ──────────────────────────────────────────────────────────
  const allDays = state.weeks.flatMap(w => w.days)
  const daysSorted = [...allDays].filter(d => d.date <= today).sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const d of daysSorted) {
    if (d.closed) streak++
    else break
  }

  // ── Sesiones aeróbicas ─────────────────────────────────────────────
  const sessions = [...state.aeroSessions].sort((a, b) => a.date.localeCompare(b.date))
  const z2Sessions = sessions.filter(s => s.type === 'z2' || s.type === 'long')
  const qualitySessions = sessions.filter(s => s.type === 'quality')

  // Datos gráfica eficiencia aeróbica (solo Z2 + largo)
  const chartData = z2Sessions.map(s => ({
    date: s.date.slice(5),   // mm-dd
    pace: s.paceMinKm,
    hr: s.heartRate,
    paceStr: fmtPace(s.paceMinKm),
  }))

  // ── Formulario nueva sesión ────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: today, paceStr: '', hr: '', type: 'z2' as AeroSession['type'], notes: '' })

  const addSession = () => {
    const [minStr, secStr] = form.paceStr.includes(':') ? form.paceStr.split(':') : [form.paceStr, '0']
    const paceMinKm = parseInt(minStr) + parseInt(secStr || '0') / 60
    if (!paceMinKm || !form.hr) return
    dispatch({
      type: 'ADD_AERO_SESSION',
      session: {
        id: `aero-${Date.now()}`,
        date: form.date,
        paceMinKm,
        heartRate: parseInt(form.hr),
        type: form.type,
        notes: form.notes || undefined,
      },
    })
    setShowForm(false)
    setForm({ date: today, paceStr: '', hr: '', type: 'z2', notes: '' })
  }

  // ── Misc ──────────────────────────────────────────────────────────
  const toggleDark = () => {
    const isDark = document.documentElement.classList.contains('dark')
    dispatch({ type: 'SET_DARK_MODE', value: !isDark })
  }

  const handleImport = async () => {
    try {
      const imported = await importJSON()
      if (confirm('¿Importar datos? Se sobrescribirá el estado actual.')) {
        dispatch({ type: 'IMPORT_STATE', state: imported as AppState })
      }
    } catch {
      alert('Error al importar el archivo.')
    }
  }

  // Tendencia: diferencia entre primera y última Z2
  const trendDelta = z2Sessions.length >= 2
    ? z2Sessions[0].paceMinKm - z2Sessions[z2Sessions.length - 1].paceMinKm
    : null

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Progreso</h1>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-0.5">Objetivo: 10K sub-45</p>
        </div>
        <button onClick={toggleDark} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {state.darkMode === true ? <Sun size={18} className="text-gray-600 dark:text-gray-300" /> : <Moon size={18} className="text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Ritmos de referencia */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Ritmos de referencia</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Z2 fácil', pace: '5:40–6:00', color: 'text-green-600 dark:text-green-400' },
            { label: 'Umbral', pace: '5:00–5:10', color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Objetivo 10K', pace: '4:30', color: 'text-violet-600 dark:text-violet-400' },
          ].map(r => (
            <div key={r.label}>
              <p className={`text-lg font-bold font-mono ${r.color}`}>{r.pace}</p>
              <p className="text-xs text-gray-400">{r.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Racha */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-3">
        <Flame size={20} className="text-orange-500 shrink-0" />
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{streak} <span className="text-sm font-normal text-gray-400">días cerrados</span></p>
          <p className="text-xs text-gray-400">Racha actual</p>
        </div>
      </div>

      {/* Curva de eficiencia aeróbica Z2 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Eficiencia aeróbica Z2</span>
          </div>
          {trendDelta !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendDelta > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : trendDelta < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              {trendDelta > 0 ? `+${fmtPace(Math.abs(trendDelta))} más rápido` : trendDelta < 0 ? `${fmtPace(Math.abs(trendDelta))} más lento` : 'sin cambio'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-3">Ritmo (min/km) a misma FC — la línea debe bajar con el tiempo</p>
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v: number) => fmtPace(v)}
                reversed
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(v: number) => [`${fmtPace(v)}/km`, 'Ritmo']}
              />
              <ReferenceLine y={5.75} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'sub-45 target', fill: '#22c55e', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="pace" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Necesitas al menos 2 sesiones Z2 para ver la curva.</p>
        )}
      </div>

      {/* Sesiones de calidad */}
      {qualitySessions.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sesiones de calidad</span>
          </div>
          <div className="space-y-2">
            {[...qualitySessions].reverse().map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <span className="text-xs text-gray-400">{s.date.slice(5).replace('-', '/')}</span>
                  {s.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{fmtPace(s.paceMinKm)}/km</p>
                  <p className="text-xs text-gray-400">{s.heartRate} ppm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Añadir sesión aeróbica */}
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <Activity size={16} />
            Registrar sesión
          </button>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nueva sesión</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fecha</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AeroSession['type'] }))}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="z2">Z2</option>
                  <option value="long">Largo</option>
                  <option value="quality">Calidad</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ritmo (mm:ss/km)</label>
                <input placeholder="5:45" value={form.paceStr} onChange={e => setForm(f => ({ ...f, paceStr: e.target.value }))}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">FC media (ppm)</label>
                <input placeholder="140" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: e.target.value }))}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <input placeholder="Notas (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400" />
            <div className="flex gap-2">
              <button onClick={addSession} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">Guardar</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Historial completo Z2 */}
      {z2Sessions.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Historial Z2</p>
          <div className="space-y-2">
            {[...z2Sessions].reverse().map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.date.slice(5).replace('-', '/')}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${SESSION_COLOR[s.type]}20`, color: SESSION_COLOR[s.type] }}>{SESSION_LABEL[s.type]}</span>
                  {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-green-600 dark:text-green-400">{fmtPace(s.paceMinKm)}/km</p>
                  <p className="text-xs text-gray-400">{s.heartRate} ppm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microciclo tipo */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Microciclo tipo</p>
        {[
          { d: 'Lun', t: 'Fuerza superior + core', c: 'text-blue-500' },
          { d: 'Mar', t: 'Z2 fácil 45 min', c: 'text-green-500' },
          { d: 'Mié', t: 'Fuerza inferior + core', c: 'text-blue-500' },
          { d: 'Jue', t: 'Calidad (tempo / series)', c: 'text-amber-500' },
          { d: 'Vie', t: 'Z2 fácil 35 min o descanso', c: 'text-green-500' },
          { d: 'Sáb', t: 'Rodaje largo Z2', c: 'text-green-500' },
          { d: 'Dom', t: 'Descanso', c: 'text-gray-400' },
        ].map(({ d, t, c }) => (
          <div key={d} className="flex items-center gap-3 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-xs font-bold text-gray-400 w-7">{d}</span>
            <span className={`text-sm ${c}`}>{t}</span>
          </div>
        ))}
        <p className="text-xs text-gray-400 mt-2">Regla: nunca 2 días duros seguidos.</p>
      </div>

      {/* Export / Import */}
      <div className="flex gap-3 pt-2 pb-6">
        <button onClick={() => exportJSON(state)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Download size={16} />Exportar JSON
        </button>
        <button onClick={handleImport}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Upload size={16} />Importar JSON
        </button>
      </div>
    </div>
  )
}
