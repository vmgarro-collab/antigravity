import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { Day, Block } from '../../types'
import { useAppContext } from '../../context/AppContext'
import WorkoutBlock from '../blocks/WorkoutBlock'
import MealBlock from '../blocks/MealBlock'
import WaterBlock from '../blocks/WaterBlock'
import WeighInBlock from '../blocks/WeighInBlock'

interface Props {
  day: Day | null
  onClose: () => void
}

export default function DayDrawer({ day, onClose }: Props) {
  const { state } = useAppContext()

  useEffect(() => {
    if (day) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [day])

  const isReadOnly = day ? day.closed && day.date < new Date().toISOString().slice(0, 10) : true
  const weight = day ? state.weights.find(w => w.date === day.date) : undefined

  const renderBlock = (block: Block) => {
    if (!day) return null
    if (block.type === 'workout') return <WorkoutBlock key={block.id} block={block} date={day.date} readOnly={isReadOnly} />
    if (block.type === 'weighIn') return <WeighInBlock key={block.id} date={day.date} currentKg={weight?.kg} readOnly={isReadOnly} />
    return <MealBlock key={block.id} block={block} date={day.date} readOnly={isReadOnly} />
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${day ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer */}
      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-gray-950 rounded-t-2xl z-50 transition-transform duration-300 ${day ? 'translate-y-0' : 'translate-y-full'}`}
           style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{day?.dayName}</h2>
            <p className="text-xs text-gray-400">{day?.date}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(85vh - 70px)' }}>
          {day?.blocks.map(renderBlock)}
          {day && <WaterBlock date={day.date} glasses={day.waterGlasses} readOnly={isReadOnly} />}
          {day?.notes && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{day.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
