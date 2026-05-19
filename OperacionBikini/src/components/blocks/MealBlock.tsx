import { useState } from 'react'
import { Utensils, Coffee, Cookie, Moon, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
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
  const [recipeOpen, setRecipeOpen] = useState(false)
  const type = block.type as keyof typeof mealIcons
  const Icon = mealIcons[type]
  const colorClass = mealColors[type]

  const toggle = () => !readOnly && dispatch({ type: 'TOGGLE_BLOCK', date, blockId: block.id })
  const toggleSubItem = (itemId: string) =>
    !readOnly && dispatch({ type: 'TOGGLE_SUBITEM', date, blockId: block.id, itemId })

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
          <div className="flex items-center justify-between">
            <Checkbox checked={block.checked} onChange={toggle} label={block.title} />
            {block.estimatedKcal && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">~{block.estimatedKcal} kcal</span>
            )}
          </div>

          {block.description && (
            <p className={`mt-1.5 text-sm leading-relaxed transition-all duration-200 ${
              block.checked ? 'text-gray-400 line-through' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {block.description}
            </p>
          )}

          {block.subItems && block.subItems.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {block.subItems.map(s => (
                <li key={s.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => toggleSubItem(s.id)}
                    disabled={readOnly}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-green-500 accent-green-500 cursor-pointer shrink-0"
                  />
                  <span className={`text-sm leading-snug ${s.checked ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {s.text}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {block.recipe && block.recipe.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setRecipeOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors"
              >
                <BookOpen size={12} />
                {recipeOpen ? 'Ocultar receta' : 'Ver receta'}
                {recipeOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {recipeOpen && (
                <ol className="mt-2 space-y-1 pl-4">
                  {block.recipe.map((step, i) => (
                    <li key={i} className="text-xs text-gray-500 dark:text-gray-400 list-decimal leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
