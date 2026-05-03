import { Scale } from 'lucide-react'
import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'

interface Props {
  date: string
  currentKg?: number
  readOnly?: boolean
}

export default function WeighInBlock({ date, currentKg, readOnly = false }: Props) {
  const { dispatch } = useAppContext()
  const [input, setInput] = useState(currentKg?.toString() ?? '')

  const save = () => {
    const kg = parseFloat(input)
    if (!isNaN(kg) && kg > 0) {
      dispatch({ type: 'SET_WEIGHT', date, kg })
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <Scale size={16} className="text-violet-600 dark:text-violet-400" />
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-200">Pesaje matutino</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">En ayunas, antes de café o agua.</p>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          min="40"
          max="200"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={readOnly}
          placeholder="kg"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
        />
        {!readOnly && (
          <button
            onClick={save}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Guardar
          </button>
        )}
        {currentKg && (
          <span className="flex items-center text-sm font-semibold text-violet-600 dark:text-violet-400 px-2">
            {currentKg} kg
          </span>
        )}
      </div>
    </div>
  )
}
