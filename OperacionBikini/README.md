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
