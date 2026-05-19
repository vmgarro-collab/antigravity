import { Shield, Sword } from 'lucide-react'
import type { Block } from '../../types'
import { useAppContext } from '../../context/AppContext'
import Checkbox from '../shared/Checkbox'

interface Props {
  block: Block
  date: string
  readOnly?: boolean
}

export default function SimpleStrategyBlock({ block, date, readOnly = false }: Props) {
  const { dispatch } = useAppContext()
  const isPreMatch = block.type === 'pre_match'
  const Icon = isPreMatch ? Sword : Shield
  const colorClass = isPreMatch
    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'

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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{block.description}</p>
          )}
          {block.subItems && block.subItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {block.subItems.map(s => (
                <li key={s.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="mt-1 text-gray-300 dark:text-gray-600">•</span>
                  {s.text}
                </li>
              ))}
            </ul>
          )}
          {block.do && block.do.length > 0 && (
            <ul className="mt-2 space-y-1">
              {block.do.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {block.phrase && (
            <p className="mt-2 text-sm italic text-violet-600 dark:text-violet-400 border-l-2 border-violet-300 pl-3">
              {block.phrase}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
