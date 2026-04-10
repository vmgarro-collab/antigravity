# Family Planner — Diseño

**Fecha:** 2026-04-10  
**App:** `/Family` — Planificador Familiar Garro

---

## Resumen

App web PWA instalable en móvil y escritorio. Agenda familiar compartida con vista mensual y lista de pendientes sin fecha. Datos sincronizados en tiempo real vía Firebase Firestore. Cualquier miembro de la familia puede añadir, editar o borrar eventos y tareas, con etiquetas de asignado por persona.

---

## Estructura de archivos

```
/Family
  index.html      — shell HTML, carga CDNs
  styles.css      — glassmorphism, mobile-first
  firebase.js     — init Firebase + funciones CRUD (add, update, delete)
  app.js          — lógica principal, FullCalendar, UI, modales
  manifest.json   — PWA (nombre "Familia", icono, display: standalone)
  sw.js           — service worker (cache básico para instalación offline)
```

**Dependencias vía CDN:**
- FullCalendar v6.1.11 (vista mensual, drag-drop nativo)
- Firebase v10 modular (solo Firestore)

**Deploy:** GitHub Pages sirviendo `/Family`. Credenciales Firebase incluidas en `firebase.js` como config pública (seguridad gestionada por reglas de Firestore).

---

## Modelo de datos (Firestore)

### Colección `events` — tareas con fecha

```js
{
  id: string,          // auto-generado por Firestore
  title: string,
  start: string,       // ISO8601: "2026-04-10"
  end: string,         // opcional, para eventos multi-día
  assignees: string[], // ej: ["Victor", "Sofia"]
  createdAt: timestamp
}
```

### Colección `pending` — tareas sin fecha

```js
{
  id: string,
  title: string,
  assignees: string[],
  done: boolean,
  createdAt: timestamp
}
```

### Miembros y colores

| Miembro | Color    | Valor hex  |
|---------|----------|------------|
| Víctor  | Azul     | `#3b82f6`  |
| Johanna | Rosa     | `#ec4899`  |
| Sofía   | Verde    | `#22c55e`  |
| Martín  | Naranja  | `#f97316`  |

Los eventos en el calendario muestran el color del primer asignado. Sin asignado: gris `#6b7280`.

---

## UI y layout

### Layout móvil (una sola pantalla, scroll vertical)

```
┌─────────────────────────┐
│  🏠 Familia Garro        │  ← header fijo
├─────────────────────────┤
│                         │
│   CALENDARIO MENSUAL    │  ← FullCalendar vista mes
│   (tocar día → añadir)  │     eventos con color del asignado
│                         │
├─────────────────────────┤
│  PENDIENTES         [+] │  ← botón + para añadir pendiente
│  ☐ Comprar leche  V J   │     píldoras de colores por asignado
│  ☐ Llamar dentista  S   │
│  ✓ Pagar luz       M    │  ← tachado cuando done=true
└─────────────────────────┘
```

### Formulario (modal)

Se abre al:
- Tocar un día en el calendario → fecha pre-rellenada
- Tocar un evento existente → modo edición
- Tocar `[+]` en pendientes → sin fecha

Campos:
- Título (input texto, obligatorio)
- Fecha (date picker, vacío = tarea pendiente)
- Asignados: 4 botones toggle con color — Víctor / Johanna / Sofía / Martín (multi-selección)
- Acciones: **Guardar** / **Cancelar** / **Eliminar** (solo en edición)

### Interacciones

| Acción | Resultado |
|--------|-----------|
| Tocar día vacío en calendario | Abre modal con fecha pre-rellenada |
| Tocar evento en calendario | Abre modal en modo edición |
| Drag evento a otro día | Actualiza `start` en Firestore |
| Tocar `[+]` en pendientes | Abre modal sin fecha |
| Tocar tarea pendiente | Abre modal en modo edición |
| Tocar checkbox de pendiente | Alterna `done`, tacha visualmente |

---

## PWA

`manifest.json`:
```json
{
  "name": "Familia Garro",
  "short_name": "Familia",
  "display": "standalone",
  "start_url": "/Family/",
  "background_color": "#0a0a0f",
  "theme_color": "#0a0a0f",
  "icons": [{ "src": "icon.png", "sizes": "192x192", "type": "image/png" }]
}
```

`sw.js`: service worker básico que cachea los assets estáticos para permitir instalación. No requiere funcionalidad offline completa (Firestore maneja su propia cache).

---

## Sincronización

Firebase Firestore con `onSnapshot()` — escucha en tiempo real ambas colecciones. Cualquier cambio desde otro dispositivo se refleja inmediatamente sin recargar.

Flujo:
1. Al cargar: `onSnapshot(events)` → renderiza FullCalendar
2. Al cargar: `onSnapshot(pending)` → renderiza lista
3. Al guardar formulario: `addDoc` o `updateDoc` → Firestore notifica a todos los clientes
4. Al borrar: `deleteDoc`
5. Al arrastrar evento: `updateDoc` con nuevo `start`

---

## Estilo visual

Glassmorphism consistente con el resto del proyecto:
- Fondo base: `#0a0a0f`
- Tarjetas: `backdrop-filter: blur()` con fondo semitransparente
- Tipografía: Inter (CDN Google Fonts)
- Totalmente responsive, diseñado mobile-first
- Misma paleta de neon accents del proyecto
