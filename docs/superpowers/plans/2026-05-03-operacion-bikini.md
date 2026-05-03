# OperacionBikini Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una PWA móvil-first (React + Vite + TS + Tailwind) que sirve como agenda diaria de un plan de pérdida de peso de 8 semanas con persistencia en localStorage.

**Architecture:** Context API + useReducer para estado global. Persistencia debounced en localStorage bajo clave `plan2meses:v1`. Los datos del plan se definen en archivos `src/data/weekN.ts`; la app solo renderiza las semanas que existan.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS (darkMode: 'class'), lucide-react, recharts, PWA con service worker manual.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: `OperacionBikini/` (directorio raíz)
- Create: `OperacionBikini/tailwind.config.ts`
- Create: `OperacionBikini/src/index.css`
- Create: `OperacionBikini/index.html`

- [ ] **Step 1: Crear proyecto Vite**

Ejecutar desde `c:\Users\victor.m.garro.perez\Documents\AntiGravity`:
```bash
npm create vite@latest OperacionBikini -- --template react-ts
cd OperacionBikini
npm install
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Renombrar tailwind.config.js a .ts y configurar**

Reemplazar el contenido de `tailwind.config.js` (o `.ts`):
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Configurar src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100;
  }
}
```

- [ ] **Step 5: Limpiar boilerplate**

Eliminar `src/App.css`. Vaciar `src/App.tsx` dejando solo:
```tsx
export default function App() {
  return <div>OperacionBikini</div>
}
```

Vaciar `src/main.tsx` dejando:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verificar que arranca**

```bash
npm run dev
```
Esperado: servidor en http://localhost:5173 mostrando "OperacionBikini".

- [ ] **Step 7: Commit**

```bash
git add OperacionBikini/
git commit -m "feat(operacion-bikini): scaffold Vite + React + TS + Tailwind"
```

---

### Task 2: Types

**Files:**
- Create: `OperacionBikini/src/types/index.ts`

- [ ] **Step 1: Crear types/index.ts**

```ts
export type ShoppingCategory =
  | 'proteinas'
  | 'verduras-frutas'
  | 'carbohidratos'
  | 'lacteos-huevos'
  | 'despensa'

export interface ShoppingItem {
  id: string
  category: ShoppingCategory
  name: string
  checked: boolean
  custom?: boolean
}

export interface ShoppingList {
  week: number
  items: ShoppingItem[]
}

export interface SubItem {
  id: string
  text: string
  checked: boolean
}

export interface Block {
  id: string
  type: 'workout' | 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'weighIn'
  title: string
  description: string
  subItems?: SubItem[]
  checked: boolean
}

export interface Day {
  date: string        // "2026-05-04"
  dayName: string     // "Lunes"
  blocks: Block[]
  notes: string
  waterGlasses: number
  closed: boolean
}

export interface Week {
  weekNumber: number
  days: Day[]
}

export interface AppState {
  user: {
    startWeight: number
    targetWeight: number
    height: number
    startDate: string
  }
  weeks: Week[]
  weights: { date: string; kg: number }[]
  shoppingList: ShoppingList[]
  darkMode: boolean | null
}
```

- [ ] **Step 2: Commit**

```bash
git add OperacionBikini/src/types/
git commit -m "feat(operacion-bikini): define tipos TypeScript"
```

---

### Task 3: Storage utils

**Files:**
- Create: `OperacionBikini/src/utils/storage.ts`

- [ ] **Step 1: Crear utils/storage.ts**

```ts
import type { AppState } from '../types'

export const STORAGE_KEY = 'plan2meses:v1'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage lleno o bloqueado — ignorar silenciosamente
  }
}

export function exportJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `operacion-bikini-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('Sin archivo'))
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target?.result as string) as AppState
          resolve(state)
        } catch {
          reject(new Error('JSON inválido'))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add OperacionBikini/src/utils/
git commit -m "feat(operacion-bikini): utils de persistencia localStorage + export/import JSON"
```

---

### Task 4: Datos semana 1

**Files:**
- Create: `OperacionBikini/src/data/week1.ts`

- [ ] **Step 1: Crear src/data/week1.ts**

```ts
import type { Week, ShoppingList } from '../types'

export const week1: Week = {
  weekNumber: 1,
  days: [
    {
      date: '2026-05-04',
      dayName: 'Lunes',
      blocks: [
        {
          id: 'weighin-lun',
          type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Pésate en ayunas antes de café o agua.',
          checked: false,
        },
        {
          id: 'workout-lun',
          type: 'workout',
          title: 'Entreno — Fuerza tren superior + core (45 min)',
          description: '',
          checked: false,
          subItems: [
            { id: 'w-lun-1', text: 'Calentamiento 5 min (movilidad hombros, círculos de brazos)', checked: false },
            { id: 'w-lun-2', text: 'Dominadas: 4 series × máx reps (descanso 90 s)', checked: false },
            { id: 'w-lun-3', text: 'Press militar mancuernas 4 kg: 4 × 12', checked: false },
            { id: 'w-lun-4', text: 'Remo mancuerna 1 mano: 4 × 12 por lado', checked: false },
            { id: 'w-lun-5', text: 'Curl bíceps + extensión tríceps superset: 3 × 12', checked: false },
            { id: 'w-lun-6', text: 'Plancha frontal: 3 × 45 s', checked: false },
            { id: 'w-lun-7', text: 'Plancha lateral: 3 × 30 s por lado', checked: false },
          ],
        },
        {
          id: 'breakfast-lun',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Café solo o con leche desnatada. Ayuno hasta la comida.',
          checked: false,
        },
        {
          id: 'lunch-lun',
          type: 'lunch',
          title: 'Comida — FUERA',
          description: 'Proteína magra + verdura/ensalada. Sin pan, sin postre. Bebida: 0,0 / agua con gas / máx 1 copa de vino.',
          checked: false,
        },
        {
          id: 'snack-lun',
          type: 'snack',
          title: 'Merienda (opcional)',
          description: 'Café o infusión.',
          checked: false,
        },
        {
          id: 'dinner-lun',
          type: 'dinner',
          title: 'Cena',
          description: 'Muy ligera: yogur natural 0% + fruta + puñado pequeño de frutos secos. O saltarla si la comida fue copiosa.',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-05',
      dayName: 'Martes',
      blocks: [
        {
          id: 'workout-mar',
          type: 'workout',
          title: 'Entreno — Rodaje suave (45 min)',
          description: '',
          checked: false,
          subItems: [
            { id: 'w-mar-1', text: 'Calentamiento 5 min', checked: false },
            { id: 'w-mar-2', text: 'Rodaje suave 35-40 min zona 2 (ritmo conversacional)', checked: false },
            { id: 'w-mar-3', text: 'Vuelta a la calma 5 min + estiramientos', checked: false },
          ],
        },
        {
          id: 'breakfast-mar',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Café. Ayuno hasta la cena.',
          checked: false,
        },
        {
          id: 'lunch-mar',
          type: 'lunch',
          title: 'Comida — Ayuno',
          description: 'Solo agua, café e infusiones.',
          checked: false,
        },
        {
          id: 'dinner-mar',
          type: 'dinner',
          title: 'Cena (~900 kcal — única comida del día)',
          description: '200 g salmón al horno con limón · Ensalada grande (lechuga, tomate, pepino, zanahoria, 1 cda aceite oliva) · 1 patata mediana asada · Yogur natural 0% de postre',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-06',
      dayName: 'Miércoles',
      blocks: [
        {
          id: 'workout-mie',
          type: 'workout',
          title: 'Entreno — Fuerza tren inferior + core (45 min)',
          description: '',
          checked: false,
          subItems: [
            { id: 'w-mie-1', text: 'Calentamiento 5 min', checked: false },
            { id: 'w-mie-2', text: 'Sentadilla con mancuernas 4 kg: 4 × 15', checked: false },
            { id: 'w-mie-3', text: 'Zancadas alternas: 4 × 12 por pierna', checked: false },
            { id: 'w-mie-4', text: 'Sentadilla búlgara: 3 × 10 por pierna', checked: false },
            { id: 'w-mie-5', text: 'Puente de glúteos: 4 × 15', checked: false },
            { id: 'w-mie-6', text: 'Elevaciones de gemelos: 3 × 20', checked: false },
            { id: 'w-mie-7', text: 'Elevación de piernas en barra: 3 × 12', checked: false },
            { id: 'w-mie-8', text: 'Plancha frontal: 3 × 60 s', checked: false },
          ],
        },
        {
          id: 'breakfast-mie',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Café. Ayuno hasta la cena.',
          checked: false,
        },
        {
          id: 'lunch-mie',
          type: 'lunch',
          title: 'Comida — Ayuno',
          description: 'Solo agua, café e infusiones.',
          checked: false,
        },
        {
          id: 'dinner-mie',
          type: 'dinner',
          title: 'Cena (~950 kcal)',
          description: '2 pechugas de pollo a la plancha (200 g) · Verdura asada (calabacín, pimiento, berenjena, cebolla) · 70 g arroz integral (en seco) · 1 cda aceite oliva · 1 fruta de postre',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-07',
      dayName: 'Jueves',
      blocks: [
        {
          id: 'weighin-jue',
          type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Pésate en ayunas antes de café o agua.',
          checked: false,
        },
        {
          id: 'workout-jue',
          type: 'workout',
          title: 'Entreno — Remo HIIT (45 min)',
          description: '',
          checked: false,
          subItems: [
            { id: 'w-jue-1', text: 'Calentamiento 5 min suave en remo', checked: false },
            { id: 'w-jue-2', text: 'HIIT 20 min: 1 min fuerte / 1 min suave (10 rondas)', checked: false },
            { id: 'w-jue-3', text: 'Vuelta a la calma 5 min', checked: false },
            { id: 'w-jue-4', text: 'Abdominales: 3 × 15 crunch', checked: false },
            { id: 'w-jue-5', text: 'Plancha: 3 × 30 s', checked: false },
          ],
        },
        {
          id: 'breakfast-jue',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Café. Ayuno hasta la cena.',
          checked: false,
        },
        {
          id: 'lunch-jue',
          type: 'lunch',
          title: 'Comida — Ayuno',
          description: 'Solo agua, café e infusiones.',
          checked: false,
        },
        {
          id: 'dinner-jue',
          type: 'dinner',
          title: 'Cena (~900 kcal)',
          description: 'Tortilla de 3 huevos + claras con espinacas y champiñones · Ensalada grande · 2 rebanadas pan integral · 1 yogur natural 0%',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-08',
      dayName: 'Viernes',
      blocks: [
        {
          id: 'workout-vie',
          type: 'workout',
          title: 'Entreno — Carrera con series (45 min)',
          description: '',
          checked: false,
          subItems: [
            { id: 'w-vie-1', text: 'Calentamiento 10 min trote suave', checked: false },
            { id: 'w-vie-2', text: '6 series: 1 min rápido / 1,5 min trote suave', checked: false },
            { id: 'w-vie-3', text: 'Vuelta a la calma 10 min + estiramientos', checked: false },
          ],
        },
        {
          id: 'breakfast-vie',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Café. Ayuno hasta la comida.',
          checked: false,
        },
        {
          id: 'lunch-vie',
          type: 'lunch',
          title: 'Comida — FUERA',
          description: 'Proteína magra + verdura/ensalada. Sin pan, sin postre. Bebida: 0,0 / agua con gas / máx 1 copa de vino.',
          checked: false,
        },
        {
          id: 'dinner-vie',
          type: 'dinner',
          title: 'Cena',
          description: 'Muy ligera o saltarla.',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-09',
      dayName: 'Sábado',
      blocks: [
        {
          id: 'workout-sab',
          type: 'workout',
          title: 'Entreno — Bici larga (60-90 min)',
          description: 'Bici a ritmo moderado o rodaje largo 50-60 min. Flexible en horario.',
          checked: false,
        },
        {
          id: 'breakfast-sab',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Yogur natural 0% + muesli (30 g) + frutos secos (15 g) + fruta.',
          checked: false,
        },
        {
          id: 'lunch-sab',
          type: 'lunch',
          title: 'Comida (~700 kcal)',
          description: 'Ensalada completa con proteína (atún, pollo o huevo) + 1 fruta. Alcohol: máx 2 copas de vino o cervezas 0,0 sin límite.',
          checked: false,
        },
        {
          id: 'snack-sab',
          type: 'snack',
          title: 'Merienda',
          description: 'Café.',
          checked: false,
        },
        {
          id: 'dinner-sab',
          type: 'dinner',
          title: 'Cena (~600 kcal)',
          description: 'Crema de verduras + pescado blanco a la plancha + ensalada.',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
    {
      date: '2026-05-10',
      dayName: 'Domingo',
      blocks: [
        {
          id: 'workout-dom',
          type: 'workout',
          title: 'Entreno — Partido de fútbol (50 min)',
          description: 'Partido ya programado.',
          checked: false,
        },
        {
          id: 'breakfast-dom',
          type: 'breakfast',
          title: 'Desayuno',
          description: 'Yogur natural 0% + muesli + frutos secos + fruta + café.',
          checked: false,
        },
        {
          id: 'lunch-dom',
          type: 'lunch',
          title: 'Comida (~750 kcal)',
          description: 'Proteína + verdura + ración pequeña de carbohidrato. Alcohol: máx 2 copas de vino o cervezas 0,0 sin límite.',
          checked: false,
        },
        {
          id: 'snack-dom',
          type: 'snack',
          title: 'Merienda',
          description: 'Fruta o café.',
          checked: false,
        },
        {
          id: 'dinner-dom',
          type: 'dinner',
          title: 'Cena (~550 kcal)',
          description: 'Ligera: tortilla, pescado o ensalada.',
          checked: false,
        },
      ],
      notes: '',
      waterGlasses: 0,
      closed: false,
    },
  ],
}

export const week1ShoppingList: ShoppingList = {
  week: 1,
  items: [
    { id: 'p1', category: 'proteinas', name: 'Salmón fresco (200 g)', checked: false },
    { id: 'p2', category: 'proteinas', name: 'Pechugas de pollo (500 g)', checked: false },
    { id: 'p3', category: 'proteinas', name: 'Pescado blanco — merluza o lubina (300 g)', checked: false },
    { id: 'p4', category: 'proteinas', name: 'Huevos (1 docena)', checked: false },
    { id: 'p5', category: 'proteinas', name: 'Atún en lata al natural (3 latas)', checked: false },
    { id: 'p6', category: 'proteinas', name: 'Pavo o jamón cocido bajo en sal', checked: false },
    { id: 'v1', category: 'verduras-frutas', name: 'Lechuga, tomate, pepino, zanahoria', checked: false },
    { id: 'v2', category: 'verduras-frutas', name: 'Calabacín, pimiento rojo y verde, berenjena, cebolla', checked: false },
    { id: 'v3', category: 'verduras-frutas', name: 'Espinacas frescas', checked: false },
    { id: 'v4', category: 'verduras-frutas', name: 'Champiñones', checked: false },
    { id: 'v5', category: 'verduras-frutas', name: 'Verduras para crema (puerro, calabacín, zanahoria)', checked: false },
    { id: 'v6', category: 'verduras-frutas', name: 'Limones', checked: false },
    { id: 'v7', category: 'verduras-frutas', name: 'Fruta variada: manzanas, plátanos, fresas, kiwis (5-6 piezas)', checked: false },
    { id: 'c1', category: 'carbohidratos', name: 'Arroz integral (paquete)', checked: false },
    { id: 'c2', category: 'carbohidratos', name: 'Patatas (4-5 unidades medianas)', checked: false },
    { id: 'c3', category: 'carbohidratos', name: 'Pan integral (barra o molde)', checked: false },
    { id: 'c4', category: 'carbohidratos', name: 'Muesli sin azúcar añadido (paquete)', checked: false },
    { id: 'l1', category: 'lacteos-huevos', name: 'Yogur natural 0% (pack de 8)', checked: false },
    { id: 'l2', category: 'lacteos-huevos', name: 'Leche desnatada (1 L)', checked: false },
    { id: 'd1', category: 'despensa', name: 'Aceite de oliva virgen extra', checked: false },
    { id: 'd2', category: 'despensa', name: 'Frutos secos sin sal (200 g) — almendras, nueces, pistachos', checked: false },
    { id: 'd3', category: 'despensa', name: 'Café', checked: false },
    { id: 'd4', category: 'despensa', name: 'Infusiones (rooibos, té verde, manzanilla)', checked: false },
    { id: 'd5', category: 'despensa', name: 'Agua con gas', checked: false },
    { id: 'd6', category: 'despensa', name: 'Cerveza 0,0 (pack)', checked: false },
    { id: 'd7', category: 'despensa', name: 'Vino tinto (1 botella)', checked: false },
    { id: 'd8', category: 'despensa', name: 'Especias: pimienta, comino, pimentón, orégano', checked: false },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add OperacionBikini/src/data/
git commit -m "feat(operacion-bikini): datos semana 1 — 7 días completos + lista de la compra"
```

---

### Task 5: AppContext + reducer

**Files:**
- Create: `OperacionBikini/src/context/AppContext.tsx`

- [ ] **Step 1: Crear AppContext.tsx**

```tsx
import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { AppState, Block, ShoppingCategory } from '../types'
import { week1, week1ShoppingList } from '../data/week1'
import { loadState, saveState } from '../utils/storage'

const initialState: AppState = {
  user: {
    startWeight: 79,
    targetWeight: 72.5,
    height: 1.72,
    startDate: '2026-05-04',
  },
  weeks: [week1],
  weights: [],
  shoppingList: [week1ShoppingList],
  darkMode: null,
}

type Action =
  | { type: 'TOGGLE_BLOCK'; date: string; blockId: string }
  | { type: 'TOGGLE_SUBITEM'; date: string; blockId: string; itemId: string }
  | { type: 'SET_WATER'; date: string; glasses: number }
  | { type: 'SET_WEIGHT'; date: string; kg: number }
  | { type: 'SET_NOTES'; date: string; notes: string }
  | { type: 'CLOSE_DAY'; date: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; week: number; itemId: string }
  | { type: 'ADD_SHOPPING_ITEM'; week: number; name: string; category: ShoppingCategory }
  | { type: 'RESET_SHOPPING'; week: number }
  | { type: 'SET_DARK_MODE'; value: boolean | null }
  | { type: 'IMPORT_STATE'; state: AppState }

function updateDay(state: AppState, date: string, updater: (day: AppState['weeks'][0]['days'][0]) => AppState['weeks'][0]['days'][0]): AppState {
  return {
    ...state,
    weeks: state.weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.date === date ? updater(d) : d),
    })),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_BLOCK':
      return updateDay(state, action.date, d => ({
        ...d,
        blocks: d.blocks.map(b =>
          b.id === action.blockId ? { ...b, checked: !b.checked } : b
        ),
      }))

    case 'TOGGLE_SUBITEM':
      return updateDay(state, action.date, d => ({
        ...d,
        blocks: d.blocks.map(b =>
          b.id === action.blockId
            ? {
                ...b,
                subItems: b.subItems?.map(s =>
                  s.id === action.itemId ? { ...s, checked: !s.checked } : s
                ),
              }
            : b
        ),
      }))

    case 'SET_WATER':
      return updateDay(state, action.date, d => ({ ...d, waterGlasses: action.glasses }))

    case 'SET_WEIGHT': {
      const exists = state.weights.find(w => w.date === action.date)
      const weights = exists
        ? state.weights.map(w => w.date === action.date ? { ...w, kg: action.kg } : w)
        : [...state.weights, { date: action.date, kg: action.kg }]
      return { ...state, weights }
    }

    case 'SET_NOTES':
      return updateDay(state, action.date, d => ({ ...d, notes: action.notes }))

    case 'CLOSE_DAY':
      return updateDay(state, action.date, d => ({ ...d, closed: true }))

    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? { ...sl, items: sl.items.map(i => i.id === action.itemId ? { ...i, checked: !i.checked } : i) }
            : sl
        ),
      }

    case 'ADD_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? {
                ...sl,
                items: [...sl.items, {
                  id: `custom-${Date.now()}`,
                  category: action.category,
                  name: action.name,
                  checked: false,
                  custom: true,
                }],
              }
            : sl
        ),
      }

    case 'RESET_SHOPPING':
      return {
        ...state,
        shoppingList: state.shoppingList.map(sl =>
          sl.week === action.week
            ? { ...sl, items: sl.items.filter(i => !i.custom).map(i => ({ ...i, checked: false })) }
            : sl
        ),
      }

    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.value }

    case 'IMPORT_STATE':
      return action.state

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? initialState)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveState(state), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [state])

  // Aplicar clase dark al <html>
  useEffect(() => {
    const root = document.documentElement
    if (state.darkMode === true) {
      root.classList.add('dark')
    } else if (state.darkMode === false) {
      root.classList.remove('dark')
    } else {
      // seguir preferencia del sistema
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [state.darkMode])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider')
  return ctx
}
```

- [ ] **Step 2: Envolver App con el provider en main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Verificar que arranca sin errores en consola**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add OperacionBikini/src/context/ OperacionBikini/src/main.tsx
git commit -m "feat(operacion-bikini): AppContext + reducer con persistencia debounced"
```

---

### Task 6: Hook useDay + shell de App.tsx con navegación

**Files:**
- Create: `OperacionBikini/src/hooks/useDay.ts`
- Modify: `OperacionBikini/src/App.tsx`

- [ ] **Step 1: Crear hooks/useDay.ts**

```ts
import { useAppContext } from '../context/AppContext'
import type { Day } from '../types'

export function useDay(date?: string): Day | null {
  const { state } = useAppContext()
  const target = date ?? new Date().toISOString().slice(0, 10)
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === target) return day
    }
  }
  return null
}

export function useCurrentWeekNumber(): number {
  const { state } = useAppContext()
  const today = new Date().toISOString().slice(0, 10)
  for (const week of state.weeks) {
    for (const day of week.days) {
      if (day.date === today) return week.weekNumber
    }
  }
  return 1
}
```

- [ ] **Step 2: Crear shell de App.tsx con bottom nav y rutas**

```tsx
import { useState } from 'react'
import { Calendar, ShoppingCart, TrendingUp, Sun } from 'lucide-react'
import Hoy from './pages/Hoy'
import Semana from './pages/Semana'
import Compra from './pages/Compra'
import Progreso from './pages/Progreso'
import { useAppContext } from './context/AppContext'

type Tab = 'hoy' | 'semana' | 'compra' | 'progreso'

const tabs: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'hoy', label: 'Hoy', icon: Sun },
  { id: 'semana', label: 'Semana', icon: Calendar },
  { id: 'compra', label: 'Compra', icon: ShoppingCart },
  { id: 'progreso', label: 'Progreso', icon: TrendingUp },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('hoy')
  const { state, dispatch } = useAppContext()

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
```

- [ ] **Step 3: Crear páginas placeholder para que compile**

Crear `src/pages/Hoy.tsx`:
```tsx
export default function Hoy() { return <div className="p-4">Hoy</div> }
```

Crear `src/pages/Semana.tsx`:
```tsx
export default function Semana() { return <div className="p-4">Semana</div> }
```

Crear `src/pages/Compra.tsx`:
```tsx
export default function Compra() { return <div className="p-4">Compra</div> }
```

Crear `src/pages/Progreso.tsx`:
```tsx
export default function Progreso() { return <div className="p-4">Progreso</div> }
```

- [ ] **Step 4: Verificar navegación funciona en browser**

```bash
npm run dev
```
Esperado: bottom nav con 4 tabs, cambio de pestaña funciona.

- [ ] **Step 5: Commit**

```bash
git add OperacionBikini/src/
git commit -m "feat(operacion-bikini): shell App con bottom nav + hook useDay"
```

---

### Task 7: Componentes shared y de bloque

**Files:**
- Create: `OperacionBikini/src/components/shared/Checkbox.tsx`
- Create: `OperacionBikini/src/components/blocks/WorkoutBlock.tsx`
- Create: `OperacionBikini/src/components/blocks/MealBlock.tsx`
- Create: `OperacionBikini/src/components/blocks/WaterBlock.tsx`
- Create: `OperacionBikini/src/components/blocks/WeighInBlock.tsx`

- [ ] **Step 1: Crear Checkbox.tsx**

```tsx
interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  className?: string
}

export default function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-3 text-left w-full group ${className}`}
      aria-checked={checked}
      role="checkbox"
    >
      <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
        checked
          ? 'bg-green-500 border-green-500'
          : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label && (
        <span className={`text-sm transition-all duration-200 ${checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {label}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Crear WorkoutBlock.tsx**

```tsx
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
```

- [ ] **Step 3: Crear MealBlock.tsx**

```tsx
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
```

- [ ] **Step 4: Crear WaterBlock.tsx**

```tsx
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
```

- [ ] **Step 5: Crear WeighInBlock.tsx**

```tsx
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
```

- [ ] **Step 6: Commit**

```bash
git add OperacionBikini/src/components/
git commit -m "feat(operacion-bikini): componentes Checkbox + bloques Workout/Meal/Water/WeighIn"
```

---

### Task 8: Página Hoy

**Files:**
- Modify: `OperacionBikini/src/pages/Hoy.tsx`

- [ ] **Step 1: Implementar Hoy.tsx**

```tsx
import { useRef, useEffect } from 'react'
import { CheckCircle2, Moon } from 'lucide-react'
import { useDay } from '../hooks/useDay'
import { useAppContext } from '../context/AppContext'
import WorkoutBlock from '../components/blocks/WorkoutBlock'
import MealBlock from '../components/blocks/MealBlock'
import WaterBlock from '../components/blocks/WaterBlock'
import WeighInBlock from '../components/blocks/WeighInBlock'
import type { Block } from '../types'

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function Hoy() {
  const today = new Date().toISOString().slice(0, 10)
  const day = useDay(today)
  const { state, dispatch } = useAppContext()
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const notesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const weight = state.weights.find(w => w.date === today)

  const d = new Date(today + 'T12:00:00')
  const dateLabel = `${DAYS_ES[d.getDay()].charAt(0).toUpperCase() + DAYS_ES[d.getDay()].slice(1)}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`

  const handleNotes = (value: string) => {
    if (notesDebounce.current) clearTimeout(notesDebounce.current)
    notesDebounce.current = setTimeout(() => {
      dispatch({ type: 'SET_NOTES', date: today, notes: value })
    }, 500)
  }

  const closeDay = () => {
    if (day?.closed) return
    dispatch({ type: 'CLOSE_DAY', date: today })
  }

  if (!day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Moon size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Sin plan para hoy</h2>
        <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">Disfruta el descanso o espera a que empiece la siguiente semana.</p>
      </div>
    )
  }

  const renderBlock = (block: Block) => {
    if (block.type === 'workout') return <WorkoutBlock key={block.id} block={block} date={today} />
    if (block.type === 'weighIn') return <WeighInBlock key={block.id} date={today} currentKg={weight?.kg} />
    return <MealBlock key={block.id} block={block} date={today} />
  }

  const totalBlocks = day.blocks.length
  const checkedBlocks = day.blocks.filter(b => b.checked).length
  const progress = totalBlocks > 0 ? Math.round((checkedBlocks / totalBlocks) * 100) : 0

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dateLabel}</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{progress}%</span>
        </div>
      </div>

      {/* Bloques */}
      {day.blocks.map(renderBlock)}

      {/* Agua */}
      <WaterBlock date={today} glasses={day.waterGlasses} />

      {/* Notas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas del día</p>
        <textarea
          ref={notesRef}
          defaultValue={day.notes}
          onChange={e => handleNotes(e.target.value)}
          placeholder="¿Cómo ha ido el día? Sensaciones, ajustes..."
          rows={3}
          className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent resize-none focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
        />
      </div>

      {/* Cerrar día */}
      <button
        onClick={closeDay}
        disabled={day.closed}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
          day.closed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
            : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
        }`}
      >
        <CheckCircle2 size={18} />
        {day.closed ? 'Día cerrado ✓' : 'Cerrar día'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verificar en browser**

`npm run dev` → navegar a Hoy. Si hoy es 2026-05-04 (lunes) debe mostrar todos los bloques del lunes. Probar tachar ejercicios y bloques de comida. Probar el contador de agua. Probar "Cerrar día".

- [ ] **Step 3: Commit**

```bash
git add OperacionBikini/src/pages/Hoy.tsx
git commit -m "feat(operacion-bikini): página Hoy con bloques, agua, notas y cierre de día"
```

---

### Task 9: Página Semana con drawer

**Files:**
- Modify: `OperacionBikini/src/pages/Semana.tsx`
- Create: `OperacionBikini/src/components/layout/DayDrawer.tsx`

- [ ] **Step 1: Crear DayDrawer.tsx**

```tsx
import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { Day } from '../../types'
import { useAppContext } from '../../context/AppContext'
import WorkoutBlock from '../blocks/WorkoutBlock'
import MealBlock from '../blocks/MealBlock'
import WaterBlock from '../blocks/WaterBlock'
import WeighInBlock from '../blocks/WeighInBlock'
import type { Block } from '../../types'

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
```

- [ ] **Step 2: Implementar Semana.tsx**

```tsx
import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import type { Day } from '../types'
import DayDrawer from '../components/layout/DayDrawer'

const DAY_TYPES: Record<string, { label: string; color: string }> = {
  'Lunes':     { label: 'Fuera', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  'Martes':    { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Miércoles': { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Jueves':    { label: 'Estricto', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'Viernes':   { label: 'Fuera', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  'Sábado':    { label: 'Flexible', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  'Domingo':   { label: 'Flexible', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
}

function DayCard({ day, onClick }: { day: Day; onClick: () => void }) {
  const { state } = useAppContext()
  const today = new Date().toISOString().slice(0, 10)
  const isToday = day.date === today
  const isPast = day.date < today
  const weight = state.weights.find(w => w.date === day.date)
  const checked = day.blocks.filter(b => b.checked).length
  const total = day.blocks.length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0
  const dayType = DAY_TYPES[day.dayName]

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all active:scale-95 ${
        isToday
          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{day.dayName}</span>
            {isToday && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Hoy</span>}
          </div>
          <span className="text-xs text-gray-400">{day.date}</span>
        </div>
        <div className="flex items-center gap-2">
          {dayType && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dayType.color}`}>{dayType.label}</span>}
          {day.closed ? <CheckCircle2 size={16} className="text-green-500" /> : isPast ? <Circle size={16} className="text-gray-300" /> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>

      {weight && (
        <p className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium">⚖️ {weight.kg} kg</p>
      )}
    </button>
  )
}

export default function Semana() {
  const { state } = useAppContext()
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const allDays = state.weeks.flatMap(w => w.days)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pt-2">Semana</h1>
      <div className="space-y-2">
        {allDays.map(day => (
          <DayCard key={day.date} day={day} onClick={() => setSelectedDay(day)} />
        ))}
      </div>
      <DayDrawer day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  )
}
```

- [ ] **Step 3: Verificar drawer en browser**

`npm run dev` → Semana → tap en un día → debe abrirse el drawer con detalle. Tap en overlay → cierra.

- [ ] **Step 4: Commit**

```bash
git add OperacionBikini/src/pages/Semana.tsx OperacionBikini/src/components/layout/
git commit -m "feat(operacion-bikini): página Semana con cards y drawer de detalle"
```

---

### Task 10: Página Compra

**Files:**
- Modify: `OperacionBikini/src/pages/Compra.tsx`

- [ ] **Step 1: Implementar Compra.tsx**

```tsx
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
```

- [ ] **Step 2: Verificar en browser**

`npm run dev` → Compra → debe mostrar 5 categorías con items. Tachar items, añadir uno manual, reiniciar lista.

- [ ] **Step 3: Commit**

```bash
git add OperacionBikini/src/pages/Compra.tsx
git commit -m "feat(operacion-bikini): página Compra con categorías colapsables y items manuales"
```

---

### Task 11: Página Progreso + export/import + toggle dark mode

**Files:**
- Modify: `OperacionBikini/src/pages/Progreso.tsx`

- [ ] **Step 1: Implementar Progreso.tsx**

```tsx
import { useState } from 'react'
import { Download, Upload, Sun, Moon, ChevronDown, ChevronUp, Target, Flame, BarChart2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAppContext } from '../context/AppContext'
import { exportJSON, importJSON } from '../utils/storage'
import type { AppState } from '../types'

export default function Progreso() {
  const { state, dispatch } = useAppContext()
  const [notesOpen, setNotesOpen] = useState(false)

  const { user, weights, weeks } = state
  const allDays = weeks.flatMap(w => w.days)
  const today = new Date().toISOString().slice(0, 10)

  // Peso actual = último pesaje
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const currentWeight = sortedWeights[sortedWeights.length - 1]?.kg ?? user.startWeight
  const imc = (currentWeight / (user.height * user.height)).toFixed(1)

  // Racha: días consecutivos cerrados hasta hoy
  const daysSorted = [...allDays].filter(d => d.date <= today).sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const d of daysSorted) {
    if (d.closed) streak++
    else break
  }

  // Adherencia semana actual
  const weekDays = allDays.filter(d => {
    const dDate = new Date(d.date + 'T12:00:00')
    const mon = new Date(today + 'T12:00:00')
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return dDate >= mon && dDate <= sun && d.date <= today
  })
  const adherencia = weekDays.length > 0
    ? Math.round((weekDays.filter(d => d.closed).length / weekDays.length) * 100)
    : 0

  // Datos gráfica
  const chartData = sortedWeights.map(w => ({
    date: w.date.slice(5), // "05-04"
    kg: w.kg,
  }))

  // Notas históricas
  const notes = allDays.filter(d => d.notes.trim()).sort((a, b) => b.date.localeCompare(a.date))

  const handleImport = async () => {
    try {
      const imported = await importJSON()
      if (confirm('¿Importar datos? Se sobrescribirá el estado actual.')) {
        dispatch({ type: 'IMPORT_STATE', state: imported as AppState })
      }
    } catch {
      alert('Error al importar el archivo. Asegúrate de que es un JSON válido.')
    }
  }

  const toggleDark = () => {
    const isDark = document.documentElement.classList.contains('dark')
    dispatch({ type: 'SET_DARK_MODE', value: !isDark })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Progreso</h1>
        <button onClick={toggleDark} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {state.darkMode === true ? <Sun size={18} className="text-gray-600 dark:text-gray-300" /> : <Moon size={18} className="text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Peso */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-violet-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">Peso</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentWeight} <span className="text-lg font-normal text-gray-400">kg</span></p>
            <p className="text-sm text-gray-400">Objetivo: {user.targetWeight} kg</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IMC</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{imc}</p>
            <p className="text-xs text-gray-400">Quedan {(currentWeight - user.targetWeight).toFixed(1)} kg</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Racha</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{streak} <span className="text-sm font-normal text-gray-400">días</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={16} className="text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Adherencia</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adherencia}<span className="text-sm font-normal text-gray-400">%</span></p>
        </div>
      </div>

      {/* Gráfica */}
      {chartData.length > 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Evolución del peso</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#a78bfa' }}
                formatter={(v: number) => [`${v} kg`, 'Peso']}
              />
              <ReferenceLine y={user.targetWeight} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1.5} />
              <Line type="monotone" dataKey="kg" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-green-500 mt-1">— Objetivo ({user.targetWeight} kg)</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-400">Registra tu primer pesaje el lunes o jueves para ver la gráfica.</p>
        </div>
      )}

      {/* Notas históricas */}
      {notes.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <button
            onClick={() => setNotesOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Notas ({notes.length})</span>
            {notesOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {notesOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              {notes.map(d => (
                <div key={d.date}>
                  <p className="text-xs text-gray-400 mb-0.5">{d.date} — {d.dayName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{d.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export / Import */}
      <div className="flex gap-3 pt-2 pb-6">
        <button
          onClick={() => exportJSON(state)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Download size={16} />
          Exportar JSON
        </button>
        <button
          onClick={handleImport}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload size={16} />
          Importar JSON
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar en browser**

`npm run dev` → Progreso → debe mostrar peso actual, IMC, racha, adherencia. Toggle dark mode debe cambiar el tema. Export JSON debe descargar archivo.

- [ ] **Step 3: Commit**

```bash
git add OperacionBikini/src/pages/Progreso.tsx
git commit -m "feat(operacion-bikini): página Progreso con gráfica, stats, notas y export/import"
```

---

### Task 12: PWA — manifest + service worker

**Files:**
- Create: `OperacionBikini/public/manifest.json`
- Create: `OperacionBikini/public/sw.js`
- Modify: `OperacionBikini/index.html`
- Modify: `OperacionBikini/src/main.tsx`

- [ ] **Step 1: Crear public/manifest.json**

```json
{
  "name": "Operación Bikini",
  "short_name": "Op. Bikini",
  "description": "Agenda diaria de plan de adelgazamiento 8 semanas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Crear iconos SVG → PNG**

Crear `public/icon-192.png` e `public/icon-512.png` usando cualquier herramienta (favicon.io, squoosh, etc.) con un icono verde sencillo. Alternativa rápida: usar el emoji 🏋️ o crear un SVG simple. Si no hay herramienta, usar este SVG como placeholder guardado en `public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#22c55e"/>
  <text x="50" y="67" font-size="55" text-anchor="middle" fill="white">💪</text>
</svg>
```

Y luego convertirlo a PNG 192×192 y 512×512. Si no es posible, el manifest funcionará sin iconos pero la app seguirá instalándose en algunos browsers.

- [ ] **Step 3: Crear public/sw.js**

```js
const CACHE = 'op-bikini-v1'
const ASSETS = ['/', '/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // Network first para JS/CSS (para recibir actualizaciones)
  if (e.request.url.includes('/assets/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
    return
  }
  // Cache first para todo lo demás
  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(e.request, clone))
      return res
    }))
  )
})
```

- [ ] **Step 4: Añadir manifest al index.html**

En `index.html`, dentro de `<head>`, añadir:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#22c55e" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Op. Bikini" />
```

- [ ] **Step 5: Registrar SW en main.tsx**

Añadir al final de `main.tsx`, después del `createRoot(...).render(...)`:
```ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* SW no crítico */})
  })
}
```

- [ ] **Step 6: Verificar PWA**

```bash
npm run build
npm run preview
```

Abrir http://localhost:4173 en Chrome → DevTools → Application → Manifest debe aparecer sin errores. Service Worker debe estar registrado.

- [ ] **Step 7: Commit**

```bash
git add OperacionBikini/public/ OperacionBikini/index.html OperacionBikini/src/main.tsx
git commit -m "feat(operacion-bikini): PWA manifest + service worker offline"
```

---

### Task 13: README

**Files:**
- Create: `OperacionBikini/README.md`

- [ ] **Step 1: Crear README.md**

```markdown
# Operación Bikini 💪

Agenda diaria de un plan de adelgazamiento + ejercicio de 8 semanas. PWA instalable, funciona offline, sin backend.

## Instalación y desarrollo

```bash
cd OperacionBikini
npm install
npm run dev        # http://localhost:5173
npm run build      # Genera dist/
npm run preview    # Sirve dist/ en http://localhost:4173
```

## Despliegue

### Vercel
1. Importar el repo en vercel.com
2. Root directory: `OperacionBikini`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

### Netlify
1. Drag & drop de la carpeta `dist/` en app.netlify.com/drop

## Añadir a pantalla de inicio

**iOS (Safari):** Abrir la URL → botón Compartir → "Añadir a pantalla de inicio"  
**Android (Chrome):** Abrir la URL → menú ⋮ → "Añadir a pantalla de inicio" o el banner automático

## Añadir semana 2

1. Crear `src/data/week2.ts` exportando `week2: Week` y `week2ShoppingList: ShoppingList`
2. En `src/context/AppContext.tsx`, importar y añadir a `initialState.weeks` y `initialState.shoppingList`

## Estructura de datos

Todo el estado persiste en `localStorage` bajo la clave `plan2meses:v1`.  
Usa "Exportar JSON" en Progreso para hacer backup antes de cambiar de dispositivo.
```

- [ ] **Step 2: Commit final**

```bash
git add OperacionBikini/README.md
git commit -m "docs(operacion-bikini): README con instrucciones de instalación y despliegue"
```

---

## Self-Review

**Spec coverage:**
- ✅ React + Vite + TypeScript + Tailwind CSS — Task 1
- ✅ localStorage `plan2meses:v1` — Task 3 (storage.ts)
- ✅ Export/Import JSON — Task 11 (Progreso)
- ✅ PWA manifest + SW offline — Task 12
- ✅ 4 tabs: Hoy / Semana / Compra / Progreso — Task 6
- ✅ Bloques del día con checkboxes — Tasks 7, 8
- ✅ Contador de agua +/- con barra — Task 7 (WaterBlock)
- ✅ Pesaje lunes y jueves — week1.ts + WeighInBlock
- ✅ Notas del día debounced — Task 8
- ✅ Cerrar día — Task 8
- ✅ Semana con cards + drawer — Task 9
- ✅ Compra agrupada + items manuales + reiniciar — Task 10
- ✅ Progreso: peso, IMC, racha, adherencia, gráfica Recharts — Task 11
- ✅ Notas históricas colapsables — Task 11
- ✅ Dark mode toggle — Task 11 (AppContext lo gestiona)
- ✅ Persistencia debounced 300 ms — Task 5 (AppContext)
- ✅ Semana 1 completa en week1.ts — Task 4
- ✅ README — Task 13

**Placeholder scan:** ninguno.

**Type consistency:** `Block`, `Day`, `Week`, `AppState`, `ShoppingList`, `ShoppingCategory`, `SubItem` definidos en Task 2 y usados consistentemente en todos los Tasks. `TOGGLE_BLOCK`/`TOGGLE_SUBITEM`/`SET_WATER`/`SET_WEIGHT`/`SET_NOTES`/`CLOSE_DAY`/`TOGGLE_SHOPPING_ITEM`/`ADD_SHOPPING_ITEM`/`RESET_SHOPPING`/`SET_DARK_MODE`/`IMPORT_STATE` definidos en Task 5 y usados en Tasks 7-11.
