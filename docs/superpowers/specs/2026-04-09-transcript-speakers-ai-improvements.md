# Transcript Speakers, Date Header & AI Prompt Improvements

## Goal

Mejorar la experiencia post-grabación añadiendo: (1) cabecera de fecha/duración en el transcript, (2) diarización automática de hablantes vía LLaMA, (3) prompts de IA reescritos con estructura fija, contexto de reunión y formato visual mejorado.

## Scope

Un solo archivo JS tocado: `Recorder/app.js`. Sin cambios de estructura, sin nuevas dependencias.

---

## 1. Cabecera de fecha en el transcript

Al renderizar el transcript (en `performRealTranscription` y en `preloadRecording`), se inyecta una cabecera HTML antes del texto:

```html
<div class="transcript-header">
  <span class="th-date">9 de abril de 2026 · 14:32</span>
  <span class="th-meta">00:24 min · 2 hablantes</span>
</div>
```

- Fecha y hora: `new Date(rec.id)` formateado en español
- Duración: `formatTime(rec.duration)` — ya existe
- Hablantes: campo `rec.speakers` (número entero, 0 si no se detectaron)
- Los estilos usan variables CSS existentes (`--text-secondary`, `--accent-color`, `--border-subtle`)
- Se añaden ~8 líneas de CSS en `styles.css`

---

## 2. Diarización con LLaMA (paso nuevo entre Whisper y resultados)

Después de recibir el transcript de Whisper y antes de guardar en IndexedDB, se lanza una llamada adicional a LLaMA:

**Prompt del sistema:**
```
Eres un experto en análisis de conversaciones. Analiza el siguiente transcript e identifica cambios de hablante basándote en cambios de tema, tono y contexto conversacional. Reformatea el texto añadiendo "Hablante N:" al inicio de cada intervención. Mantén el texto original exacto, solo añade las etiquetas. Responde ÚNICAMENTE con el transcript reformateado, sin explicaciones.
```

**Flujo:**
1. Whisper devuelve texto plano → `rawTranscriptText`
2. LLaMA reformatea con speakers → `rawTranscriptText` se actualiza
3. LLaMA detecta cuántos hablantes distintos hay → se guarda en `rec.speakers`
4. Si la llamada falla (error de red, API key inválida, etc.) → se usa el transcript original sin speakers, `rec.speakers = 0`
5. IndexedDB persiste el transcript ya con speakers

**Separación de hablantes en el render:**
`"Hablante 1: texto"` se convierte en `<span class="speaker">Hablante 1</span>texto`. La clase `.speaker` ya existe en `styles.css` con color `--accent-color`.

---

## 3. Prompts de IA reescritos

Todos los prompts reciben un bloque de contexto al inicio del mensaje del usuario:

```
[Reunión: {fecha larga} · {duración} · {N} hablante(s)]
Transcripción: {rawTranscriptText}
```

### Resumen Ejecutivo

**System prompt:**
```
Eres un asistente de reuniones ejecutivo. Genera un resumen estructurado en HTML usando exactamente estas secciones con <h4>: "Contexto", "Puntos Clave" (lista <ul>), "Decisiones Tomadas" (lista <ul>), "Próximos Pasos" (lista <ul>). Si una sección no tiene contenido relevante, escribe "<p>No identificado</p>". Responde SOLO el HTML, en español.
```

### Tareas Extraídas

**System prompt:**
```
Eres un gestor de proyectos. Extrae todas las tareas mencionadas (explícitas o implícitas) del transcript. Genera una tabla HTML: <table> con cabecera <thead> (Tarea | Responsable | Prioridad) y filas <tbody>. Infiere el responsable del contexto si no se nombra explícitamente; usa "Sin asignar" si no hay pistas. Prioridad: "Alta" (urgente/bloqueante), "Media" (esta semana), "Baja" (cuando se pueda). Si no hay tareas, escribe "<p>No se identificaron tareas.</p>". Responde SOLO el HTML, en español.
```

### Mapa Mental

**System prompt:**
```
Eres un analista de contenido. Identifica el tema central de la reunión y los 4-6 conceptos principales. Genera un mapa mental en HTML usando listas anidadas: un <ul class="mindmap-root"> con el tema central como primer <li class="mindmap-center">, y sublistas <ul> para cada rama con sus sub-conceptos. Responde SOLO el HTML, en español.
```

Se añaden ~12 líneas de CSS para `.mindmap-root`, `.mindmap-center` y niveles de indentación con colores de la paleta existente.

---

## 4. Cambios en IndexedDB

El objeto `rec` añade un campo:
```js
speakers: 0  // número de hablantes detectados, se actualiza tras diarización
```

Compatible con grabaciones antiguas (si `rec.speakers` es undefined, la cabecera muestra "— hablantes").

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `Recorder/app.js` | Función de diarización, prompts reescritos, render de cabecera y speakers |
| `Recorder/styles.css` | ~20 líneas: `.transcript-header`, `.mindmap-root`, `.mindmap-center` |

---

## Flujo completo post-grabación

```
Whisper → transcript plano
    ↓
LLaMA diarización → transcript con "Hablante N:" + rec.speakers
    ↓
Persistir en IndexedDB (transcript + speakers)
    ↓
Render: cabecera fecha/duración/hablantes + transcript formateado
    ↓
[Botones IA] → prompts con contexto fecha+duración+hablantes
```
