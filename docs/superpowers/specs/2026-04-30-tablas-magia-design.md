# TablasMagia — Spec de Diseño

**Fecha:** 2026-04-30  
**Carpeta de destino:** `TablasMagia/`  
**Stack:** Vanilla JS, sin build system, CDN, compatible con `file://`

---

## Objetivo

App web PWA instalable en móvil para que una chica de 13 años aprenda y consolide las tablas de multiplicar del 1 al 10. Énfasis especial en las tablas 6, 7, 8 y 9. Mecánica de juego con quiz cronometrado, progresión por niveles y entrenamiento adaptativo basado en errores.

---

## Estructura de archivos

```
TablasMagia/
  index.html       — shell HTML, carga scripts al final del body
  app.js           — toda la lógica (estado, modos, algoritmo, PWA)
  styles.css       — diseño glassmorphism + variables CSS
  manifest.json    — configuración PWA
  sw.js            — service worker (cache offline)
```

---

## Pantallas y navegación

```
Home
  ├── Quiz Rápido
  ├── Aventura (mapa de tablas)
  └── Entrena Débiles
```

- Navegación: botón "←" siempre visible para volver a Home
- Sin menú lateral, sin scroll — todo en pantalla de móvil
- Transición suave entre pantallas (fade + slide)
- Estado gestionado con variable global `currentScreen`

---

## Modo Quiz Rápido

- 20 preguntas aleatorias de todas las tablas (1×1 a 10×10)
- Temporizador de 10 segundos por pregunta (barra visual regresiva)
- Teclado numérico en pantalla (4×3, botones grandes táctiles) + teclas físicas
- Puntuación:
  - +10 pts por acierto
  - +5 pts bonus si responde en menos de 4 segundos
  - 0 pts por fallo (sin penalización)
- Feedback inmediato: flash verde (correcto) o shake rojo + respuesta correcta (incorrecto)
- Pantalla de resultados: puntuación total, % de acierto, tiempo medio por pregunta
- Los errores y tiempos se registran en el algoritmo adaptativo

---

## Modo Aventura

- Mapa visual con 10 "islas" (una por tabla del 1 al 10)
- Desbloqueo progresivo: tabla N se desbloquea al conseguir ≥1 estrella en tabla N-1 (tabla 1 siempre disponible)
- Cada isla: 15 preguntas solo de esa tabla
- Sistema de 3 estrellas por isla:
  - ⭐ Completar la isla
  - ⭐⭐ >80% de acierto
  - ⭐⭐⭐ >80% de acierto Y tiempo medio <6s por pregunta
- Las tablas 6, 7, 8 y 9 tienen "Reto Final": 5 preguntas extra cronometradas a 6s. Solo aparece tras completar la isla normal.
- Progreso guardado en `localStorage`

---

## Modo Entrena Débiles

- El algoritmo mantiene un objeto `weakness` en `localStorage`:
  ```js
  { "7x8": { attempts: 5, errors: 3 }, "6x9": { attempts: 4, errors: 4 }, ... }
  ```
- Tasa de error = `errors / attempts`. Se registra cada respuesta en Quiz y Aventura.
- Sesión de 15 preguntas priorizadas por tasa de error descendente
- Si hay menos de 5 multiplicaciones con historial, rellena con las tablas 6-9 aleatorias
- Pantalla final: lista de multiplicaciones trabajadas con indicador de mejora (comparado con tasa anterior)
- Si no hay historial suficiente, muestra mensaje animado invitando a jugar primero

---

## Sistema de recompensas

| Recompensa | Criterio |
|------------|----------|
| Estrellas (0–30) | 3 por isla en Aventura. Barra de progreso en Home. |
| Racha diaria 🔥 | Días consecutivos jugando. Guardada en `localStorage` con fecha UTC. |
| Trofeo Principiante | ≥5 estrellas totales |
| Trofeo Maestra | ≥15 estrellas totales |
| Trofeo Leyenda | 30 estrellas (todas las islas al máximo) |

- Trofeos desbloqueados muestran pantalla de celebración (3s, partículas, sonido opcional)
- Trofeos guardados en `localStorage`

---

## Algoritmo adaptativo

```js
// Al registrar respuesta:
function recordAnswer(a, b, correct, timeMs) {
  const key = `${a}x${b}`
  const entry = weakness[key] || { attempts: 0, errors: 0 }
  entry.attempts++
  if (!correct) entry.errors++
  weakness[key] = entry
  localStorage.setItem('weakness', JSON.stringify(weakness))
}

// Para Entrena Débiles — ordenar por tasa de error:
const sorted = Object.entries(weakness)
  .filter(([_, v]) => v.attempts >= 2)
  .sort((a, b) => (b[1].errors / b[1].attempts) - (a[1].errors / a[1].attempts))
```

---

## Visual y animaciones

**Paleta de colores:**
```css
--bg-base:        #0a0a0f
--bg-surface:     rgba(25, 25, 35, 0.6)
--accent-magenta: #ff2d78   /* acento principal */
--accent-cyan:    #00dfd8   /* acento secundario */
--accent-gold:    #ffd700   /* estrellas y trofeos */
--text-primary:   #ffffff
--text-secondary: #9494a0
```

**Animaciones:**
- Respuesta correcta: fondo flash verde 300ms + partículas CSS (keyframes)
- Respuesta incorrecta: shake horizontal 400ms + color rojo + muestra respuesta
- Desbloqueo de isla: "reveal" con glow neon 1s
- Trofeo: pantalla overlay de celebración 3s con partículas y fade-out automático
- Transiciones entre pantallas: fade 200ms

**Layout móvil:**
- `max-width: 480px`, centrado, padding lateral 16px
- Teclado numérico: grid 4×3, botones mínimo 64×64px
- Fuente Inter (CDN Google Fonts), números en `font-weight: 700`

---

## PWA

**manifest.json:**
```json
{
  "name": "TablasMagia",
  "short_name": "TablasMagia",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#ff2d78",
  "icons": [{ "src": "icon.png", "sizes": "192x192", "type": "image/png" }]
}
```

**Service worker (sw.js):**
- Cache-first para todos los assets locales
- Funciona offline tras primera carga
- Registrado en `index.html` con `navigator.serviceWorker.register('./sw.js')`

**Icono:** SVG inline con símbolo ✖️ en magenta sobre fondo oscuro, exportado como PNG 192×192

---

## Persistencia (localStorage)

| Clave | Contenido |
|-------|-----------|
| `tm_stars` | `{ "1": 3, "6": 2, ... }` — estrellas por tabla |
| `tm_trophies` | `["principiante", "maestra"]` — trofeos desbloqueados |
| `tm_streak` | `{ date: "2026-04-30", count: 5 }` — racha diaria |
| `tm_weakness` | `{ "7x8": { attempts, errors }, ... }` — algoritmo adaptativo |

---

## Fuera de alcance

- Multijugador o modo duelo online
- Backend, login o sincronización en la nube
- Soporte para tablas más allá del 10×10
- Sonido (puede añadirse después con Web Audio API sin cambiar arquitectura)
