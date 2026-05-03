import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import type { Block } from '../../types'
import Checkbox from '../shared/Checkbox'
import { useAppContext } from '../../context/AppContext'

interface Props {
  block: Block
  date: string
  readOnly?: boolean
}

export default function WorkoutBlock({ block, date, readOnly = false }: Props) {
  const { dispatch } = useAppContext()
  const [expanded, setExpanded] = useState(true)

  const toggle = () => !readOnly && dispatch({ type: 'TOGGLE_BLOCK', date, blockId: block.id })
  const toggleItem = (itemId: string) => !readOnly && dispatch({ type: 'TOGGLE_SUBITEM', date, blockId: block.id, itemId })

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      block.checked
        ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30'
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
    }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <Dumbbell size={16} className="text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <Checkbox
            checked={block.checked}
            onChange={toggle}
            label={block.title}
            className={block.checked ? 'opacity-60' : ''}
          />
        </div>
        {block.subItems && (
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {expanded && block.subItems && block.subItems.length > 0 && (
        <div className="mt-3 ml-9 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          {block.subItems.map(item => (
            <Checkbox
              key={item.id}
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              label={item.text}
            />
          ))}
        </div>
      )}
    </div>
  )
}
