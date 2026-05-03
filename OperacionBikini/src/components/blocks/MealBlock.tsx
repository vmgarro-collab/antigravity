import { Utensils, Coffee, Cookie, Moon } from 'lucide-react'
import type { Block } from '../../types'
import Checkbox from '../shared/Checkbox'
import { useAppContext } from '../../context/AppContext'

const mealIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
} as const

const mealColors = {
  breakfast: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  lunch: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  snack: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  dinner: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
} as const

interface Props {
  block: Block
  date: string
  readOnly?: boolean
}

export default function MealBlock({ block, date, readOnly = false }: Props) {
  const { dispatch } = useAppContext()
  const type = block.type as keyof typeof mealIcons
  const Icon = mealIcons[type]
  const colorClass = mealColors[type]

  const toggle = () => !readOnly && dispatch({ type: 'TOGGLE_BLOCK', date, blockId: block.id })

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      block.checked
        ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30'
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-1.5 rounded-lg ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <Checkbox checked={block.checked} onChange={toggle} label={block.title} />
          {block.description && (
            <p className={`mt-1.5 text-sm leading-relaxed transition-all duration-200 ${
              block.checked ? 'text-gray-400 line-through' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {block.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
