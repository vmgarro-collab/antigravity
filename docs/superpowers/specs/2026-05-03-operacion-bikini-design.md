# Spec: OperacionBikini — App de agenda diaria para plan de pérdida de peso

**Fecha:** 2026-05-03  
**Carpeta destino:** `OperacionBikini/` dentro de AntiGravity  
**Stack:** React + Vite + TypeScript + Tailwind CSS + PWA

---

## Objetivo

Web app móvil-first instalable (PWA) que sirve como agenda diaria de un plan de adelgazamiento + ejercicio de 8 semanas. Muestra el plan del día, permite tachar tareas, gestiona la lista de la compra semanal, y registra peso y notas. Sin backend, sin autenticación. Todo persiste en localStorage.

---

## Alcance

- Semana 1 precargada en `src/data/week1.ts`
- Semanas 2-8 se añaden como `week2.ts`, `week3.ts`... cuando el usuario proporcione los datos
- La app solo renderiza las semanas que tengan archivo de datos
- Fecha de inicio del plan: **2026-05-04** (lunes)

---

## Estructura del proyecto

```
OperacionBikini/
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker — cache first para assets, network first para JS
├── src/
│   ├── data/
│   │   └── week1.ts             # Datos semana 1 hardcodeados
│   ├── context/
│   │   └── AppContext.tsx       # Estado global + reducer + persistencia debounced
│   ├── hooks/
│   │   └── useDay.ts            # Lógica de resolución del día actual en el plan
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   └── Header.tsx
│   │   ├── blocks/
│   │   │   ├── WorkoutBlock.tsx
│   │   │   ├── MealBlock.tsx
│   │   │   ├── WaterBlock.tsx
│   │   │   └── WeighInBlock.tsx
│   │   └── shared/
│   │       └── Checkbox.tsx
│   ├── pages/
│   │   ├── Hoy.tsx
│   │   ├── Semana.tsx
│   │   ├── Compra.tsx
│   │   └── Progreso.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── storage.ts           # get/set localStorage, exportJSON, importJSON
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Modelo de datos

```ts
// Clave localStorage
const STORAGE_KEY = 'plan2meses:v1';

type AppState = {
  user: {
    startWeight: number;    // 79
    targetWeight: number;   // 72.5
    height: number;         // 1.72
    startDate: string;      // "2026-05-04"
  };
  weeks: Week[];
  weights: { date: string; kg: number }[];
  shoppingList: ShoppingList[];
  darkMode: boolean | null;  // null = seguir preferencia del sistema
};

type Week = {
  weekNumber: number;
  days: Day[];
};

type Day = {
  date: string;           // ISO date "2026-05-04"
  dayName: string;        // "Lunes"
  blocks: Block[];
  notes: string;
  waterGlasses: number;   // 0-15, objetivo 10
  closed: boolean;
};

type Block = {
  id: string;
  type: 'workout' | 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'weighIn';
  title: string;
  description: string;
  subItems?: { id: string; text: string; checked: boolean }[];
  checked: boolean;
};

type ShoppingList = {
  week: number;
  items: {
    id: string;
    category: 'proteinas' | 'verduras-frutas' | 'carbohidratos' | 'lacteos-huevos' | 'despensa';
    name: string;
    checked: boolean;
    custom?: boolean;
  }[];
};
```

---

## Estado global — Context API + useReducer

### Acciones del reducer

| Acción | Payload |
|--------|---------|
| `TOGGLE_BLOCK` | `{ date, blockId }` |
| `TOGGLE_SUBITEM` | `{ date, blockId, itemId }` |
| `SET_WATER` | `{ date, glasses }` |
| `SET_WEIGHT` | `{ date, kg }` |
| `SET_NOTES` | `{ date, notes }` |
| `CLOSE_DAY` | `{ date }` |
| `TOGGLE_SHOPPING_ITEM` | `{ week, itemId }` |
| `ADD_SHOPPING_ITEM` | `{ week, name, category }` |
| `RESET_SHOPPING` | `{ week }` |
| `SET_DARK_MODE` | `{ value: boolean \| null }` |
| `IMPORT_STATE` | `{ state: AppState }` |

### Persistencia

`useEffect` sobre el estado completo → `localStorage.setItem(STORAGE_KEY, JSON.stringify(state))`, debounced 300 ms. Al montar, se intenta leer de localStorage; si no existe, se inicializa con los datos de `week1.ts` y el perfil del usuario.

---

## Páginas

### Hoy

- Detecta el día actual comparando `new Date().toISOString().slice(0,10)` con las fechas del plan
- Si el día está fuera del plan (antes del inicio o semana sin datos) → pantalla de placeholder
- Orden de bloques: WeighIn (solo lunes y jueves) → Workout → Breakfast → Lunch → Snack (si existe) → Dinner → Water → Notes
- Cada `Block`: checkbox izquierdo tacha el bloque completo (título en `line-through`); los `subItems` tienen checkboxes propios
- Bloque Water: contador +/- con 10 vasos como objetivo, barra de progreso visual
- Notas: `<textarea>` guardado con debounce 500 ms
- Botón "Cerrar día" en el footer de la página: marca `closed: true` y muestra resumen del día

### Semana

- Grid de 7 cards (scroll vertical en móvil)
- Cada card: nombre del día, fecha, barra de progreso (% bloques checked / total), peso registrado si existe, badge de tipo de día (estricto / flexible / fuera / finde)
- Tap en card → sheet/drawer deslizante desde abajo con el detalle completo del día
- Si el día es pasado y cerrado: read-only. Si es hoy o futuro: editable

### Compra

- Lista generada desde `week1.ts` (campo `shoppingList`)
- Agrupada por categoría con headers colapsables
- Checkboxes para tachar items
- Input + botón "Añadir item" al final de cada categoría para items custom
- Botón "Reiniciar lista" en el header: desmarca todo y elimina items custom (pide confirmación)

### Progreso

- Tarjeta superior: peso actual (último registrado) vs objetivo, IMC calculado
- Gráfica de línea Recharts con todos los pesajes (eje X: fecha, eje Y: kg)
- Racha actual: días consecutivos cerrados hasta hoy
- % adherencia semana actual: días cerrados / días transcurridos de la semana × 100
- Lista colapsable de notas históricas (una entrada por día que tenga nota)
- Botones "Exportar JSON" e "Importar JSON" al fondo de esta sección

---

## Diseño visual

- **Móvil-first:** max-width 480px centrado en desktop
- **Tema:** Tailwind `darkMode: 'media'` + toggle manual (guarda en state)
- **Paleta:**
  - Fondo: `white` / `gray-950`
  - Acento completado: `green-500`
  - Alerta: `red-400`
  - Superficie tarjetas: `gray-50` / `gray-900`
  - Borde: `gray-200` / `gray-800`
- **Tipografía:** `font-family: 'Inter', system-ui` vía Google Fonts o Fontsource
- **Iconos:** `lucide-react`
- **Animaciones:** `transition-all duration-200` al tachar, `transition-opacity` en sheet drawer
- **Bottom nav:** fijo, `padding-bottom: env(safe-area-inset-bottom)` para iPhone notch

---

## PWA

- `public/manifest.json`: name, short_name, icons (192px y 512px), theme_color, background_color, display: standalone, start_url: "/"
- `public/sw.js`: estrategia network-first para JS/HTML, cache-first para assets estáticos (imágenes, iconos)
- Registro del SW en `main.tsx` con detección de soporte

---

## Requisitos no funcionales

- Funciona offline una vez cargada
- Persistencia automática debounced 300 ms en cada cambio de estado
- Cero llamadas a APIs externas
- `npm run dev` para desarrollo, `npm run build` para producción
- Desplegable en Vercel/Netlify sin configuración extra (SPA con `index.html` fallback)
