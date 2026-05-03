import { Droplets } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

interface Props {
  date: string
  glasses: number
  readOnly?: boolean
}

const GOAL = 10

export default function WaterBlock({ date, glasses, readOnly = false }: Props) {
  const { dispatch } = useAppContext()

  const set = (n: number) => {
    if (readOnly) return
    dispatch({ type: 'SET_WATER', date, glasses: Math.max(0, Math.min(15, n)) })
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
          <Droplets size={16} className="text-cyan-600 dark:text-cyan-400" />
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-200">Hidratación</span>
        <span className="ml-auto text-sm font-semibold text-cyan-600 dark:text-cyan-400">
          {glasses}/{GOAL} vasos
        </span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-3">
        <div
          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, (glasses / GOAL) * 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => set(glasses - 1)}
          disabled={glasses <= 0 || readOnly}
          className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:border-cyan-400 transition-colors"
        >
          −
        </button>
        <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
          {Array.from({ length: GOAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => !readOnly && set(i + 1)}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${
                i < glasses ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              aria-label={`${i + 1} vasos`}
            />
          ))}
        </div>
        <button
          onClick={() => set(glasses + 1)}
          disabled={glasses >= 15 || readOnly}
          className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:border-cyan-400 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
