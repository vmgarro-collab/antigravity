import { useState } from 'react'
import { Calendar, ShoppingCart, TrendingUp, Sun } from 'lucide-react'
import Hoy from './pages/Hoy'
import Semana from './pages/Semana'
import Compra from './pages/Compra'
import Progreso from './pages/Progreso'

type Tab = 'hoy' | 'semana' | 'compra' | 'progreso'

const tabs: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'hoy', label: 'Hoy', icon: Sun },
  { id: 'semana', label: 'Semana', icon: Calendar },
  { id: 'compra', label: 'Compra', icon: ShoppingCart },
  { id: 'progreso', label: 'Progreso', icon: TrendingUp },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('hoy')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'hoy' && <Hoy />}
        {activeTab === 'semana' && <Semana />}
        {activeTab === 'compra' && <Compra />}
        {activeTab === 'progreso' && <Progreso />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
