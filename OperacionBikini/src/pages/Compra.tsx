import { useState } from 'react'
import { Plus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import Checkbox from '../components/shared/Checkbox'
import type { ShoppingCategory } from '../types'

const CATEGORIES: { id: ShoppingCategory; label: string; emoji: string }[] = [
  { id: 'proteinas', label: 'Proteínas', emoji: '🥩' },
  { id: 'verduras-frutas', label: 'Verduras y frutas', emoji: '🥦' },
  { id: 'carbohidratos', label: 'Carbohidratos', emoji: '🍚' },
  { id: 'lacteos-huevos', label: 'Lácteos y huevos', emoji: '🥛' },
  { id: 'despensa', label: 'Despensa / otros', emoji: '🧴' },
]

export default function Compra() {
  const { state, dispatch } = useAppContext()
  const [collapsed, setCollapsed] = useState<Set<ShoppingCategory>>(new Set())
  const [newItem, setNewItem] = useState<Record<ShoppingCategory, string>>({
    proteinas: '', 'verduras-frutas': '', carbohidratos: '', 'lacteos-huevos': '', despensa: '',
  })

  const currentWeek = 1
  const list = state.shoppingList.find(sl => sl.week === currentWeek)
  const items = list?.items ?? []

  const toggle = (id: ShoppingCategory) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addItem = (category: ShoppingCategory) => {
    const name = newItem[category].trim()
    if (!name) return
    dispatch({ type: 'ADD_SHOPPING_ITEM', week: currentWeek, name, category })
    setNewItem(prev => ({ ...prev, [category]: '' }))
  }

  const resetList = () => {
    if (confirm('¿Reiniciar la lista? Se desmarcarán todos los items y se eliminarán los añadidos manualmente.')) {
      dispatch({ type: 'RESET_SHOPPING', week: currentWeek })
    }
  }

  const checkedCount = items.filter(i => i.checked).length

  return (
    <div className="p-4">
      <div className="flex items-center justify-between pt-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compra</h1>
          <p className="text-xs text-gray-400 mt-0.5">{checkedCount}/{items.length} items</p>
        </div>
        <button
          onClick={resetList}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 transition-colors"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map(({ id, label, emoji }) => {
          const catItems = items.filter(i => i.category === id)
          const isCollapsed = collapsed.has(id)
          const catChecked = catItems.filter(i => i.checked).length

          return (
            <div key={id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <button
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {emoji} {label}
                  <span className="ml-2 text-xs text-gray-400">({catChecked}/{catItems.length})</span>
                </span>
                {isCollapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
              </button>

              {!isCollapsed && (
                <div className="px-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {catItems.map(item => (
                    <Checkbox
                      key={item.id}
                      checked={item.checked}
                      onChange={() => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', week: currentWeek, itemId: item.id })}
                      label={item.name}
                    />
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newItem[id]}
                      onChange={e => setNewItem(prev => ({ ...prev, [id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addItem(id)}
                      placeholder="Añadir item..."
                      className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                    <button
                      onClick={() => addItem(id)}
                      className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
