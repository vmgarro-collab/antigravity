# Family Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/Family` — PWA de planificador familiar con calendario mensual, lista de pendientes, sincronización Firebase en tiempo real, e instalable en móvil y escritorio.

**Architecture:** Nueva carpeta `/Family` con vanilla JS + CDN, siguiendo los patrones del proyecto. Firebase Firestore para sync en tiempo real. FullCalendar v6 para la vista mensual. Un modal único para crear/editar tanto eventos como pendientes.

**Tech Stack:** Vanilla JS, FullCalendar v6.1.11, Firebase v10 (Firestore), CSS glassmorphism, PWA (manifest + service worker), GitHub Pages.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `Family/index.html` | Shell HTML: CDNs, estructura DOM, modal |
| `Family/styles.css` | Estilos glassmorphism mobile-first, layout portrait/landscape |
| `Family/firebase.js` | Init Firebase, funciones CRUD: `addEvent`, `updateEvent`, `deleteEvent`, `addPending`, `updatePending`, `deletePending`, listeners `onEvents`, `onPending` |
| `Family/app.js` | Init FullCalendar, gestión del modal, render lista pendientes, wiring de eventos DOM |
| `Family/manifest.json` | PWA manifest |
| `Family/sw.js` | Service worker: cache de assets estáticos |
| `Family/icon.png` | Icono PWA 192x192 (SVG incrustado como PNG base64) |

---

## Task 1: Estructura base HTML + CSS esqueleto

**Files:**
- Create: `Family/index.html`
- Create: `Family/styles.css`

- [ ] **Step 1: Crear `Family/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Familia Garro</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0a0a0f">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

  <!-- FullCalendar -->
  <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js"></script>

  <!-- Firebase v10 modular (compat layer for simplicity) -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>

  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <header class="app-header">
    <span class="app-logo">🏠 Familia Garro</span>
  </header>

  <div class="app-layout">
    <!-- Calendario -->
    <section class="calendar-section">
      <div id="calendar"></div>
    </section>

    <!-- Pendientes -->
    <section class="pending-section">
      <div class="pending-header">
        <span class="section-title">Pendientes</span>
        <button class="btn-add-pending" id="btnAddPending" title="Añadir pendiente">+</button>
      </div>
      <ul class="pending-list" id="pendingList"></ul>
    </section>
  </div>

  <!-- Modal crear/editar -->
  <div class="modal-overlay" id="modalOverlay" style="display:none">
    <div class="modal-card">
      <h2 class="modal-title" id="modalTitle">Nueva tarea</h2>
      <input type="text" class="modal-input" id="modalInputTitle" placeholder="Título" autocomplete="off">
      <label class="modal-label">Fecha (vacío = pendiente sin fecha)</label>
      <input type="date" class="modal-input" id="modalInputDate">
      <label class="modal-label">Asignado a</label>
      <div class="assignee-toggles" id="assigneeToggles">
        <button class="assignee-btn" data-name="Victor"  data-color="#3b82f6">Víctor</button>
        <button class="assignee-btn" data-name="Johanna" data-color="#ec4899">Johanna</button>
        <button class="assignee-btn" data-name="Sofia"   data-color="#22c55e">Sofía</button>
        <button class="assignee-btn" data-name="Martin"  data-color="#f97316">Martín</button>
      </div>
      <div class="modal-actions">
        <button class="btn-save"   id="btnSave">Guardar</button>
        <button class="btn-cancel" id="btnCancel">Cancelar</button>
        <button class="btn-delete" id="btnDelete" style="display:none">Eliminar</button>
      </div>
    </div>
  </div>

  <script src="firebase.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crear `Family/styles.css`**

```css
:root {
  --bg: #0a0a0f;
  --surface: rgba(255,255,255,0.05);
  --border: rgba(255,255,255,0.1);
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --accent: #6366f1;
  --header-h: 52px;
  --color-victor:  #3b82f6;
  --color-johanna: #ec4899;
  --color-sofia:   #22c55e;
  --color-martin:  #f97316;
  --color-none:    #6b7280;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  overflow-x: hidden;
}

/* ── Header ── */
.app-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--header-h);
  display: flex; align-items: center; padding: 0 1rem;
  background: rgba(10,10,15,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.app-logo { font-weight: 700; font-size: 1.05rem; letter-spacing: 0.01em; }

/* ── Layout portrait (default) ── */
.app-layout {
  margin-top: var(--header-h);
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - var(--header-h));
}

.calendar-section {
  padding: 0.75rem;
  flex-shrink: 0;
}

.pending-section {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}

/* ── Layout landscape ── */
@media (orientation: landscape) and (max-height: 600px) {
  .app-layout {
    flex-direction: row;
    height: calc(100dvh - var(--header-h));
    overflow: hidden;
  }
  .calendar-section {
    width: 60%;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    border-top: none;
  }
  .pending-section {
    width: 40%;
    overflow-y: auto;
    border-top: none;
  }
}

/* ── FullCalendar overrides ── */
.fc {
  --fc-border-color: var(--border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: var(--surface);
  --fc-today-bg-color: rgba(99,102,241,0.15);
  --fc-event-border-color: transparent;
  --fc-button-bg-color: var(--accent);
  --fc-button-border-color: transparent;
  --fc-button-hover-bg-color: #4f46e5;
  --fc-button-active-bg-color: #4338ca;
}
.fc .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: var(--text); }
.fc .fc-col-header-cell { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
.fc .fc-daygrid-day-number { font-size: 0.75rem; color: var(--text-muted); }
.fc .fc-event { border-radius: 4px; font-size: 0.7rem; padding: 1px 3px; }
.fc .fc-daygrid-day:hover { background: rgba(255,255,255,0.03); cursor: pointer; }
.fc .fc-day-today .fc-daygrid-day-number { color: var(--accent); font-weight: 800; }

/* ── Pendientes ── */
.pending-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.75rem;
}
.section-title { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }

.btn-add-pending {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--accent); border: none; color: white;
  font-size: 1.3rem; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.btn-add-pending:hover { background: #4f46e5; }

.pending-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }

.pending-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.pending-item:hover { background: rgba(255,255,255,0.08); }
.pending-item.done .pending-title { text-decoration: line-through; color: var(--text-muted); }

.pending-check {
  width: 18px; height: 18px; flex-shrink: 0;
  border-radius: 50%; border: 2px solid var(--border);
  background: transparent; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pending-item.done .pending-check { background: var(--accent); border-color: var(--accent); }

.pending-title { flex: 1; font-size: 0.88rem; }

.assignee-pills { display: flex; gap: 3px; flex-wrap: wrap; }
.assignee-pill {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 700; color: white;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-card {
  background: #13131a;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.modal-title { font-size: 1.1rem; font-weight: 700; }
.modal-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.25rem; }
.modal-input {
  width: 100%; padding: 0.65rem 0.85rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; color: var(--text); font-family: inherit; font-size: 0.95rem;
  outline: none;
}
.modal-input:focus { border-color: var(--accent); }
.modal-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }

.assignee-toggles { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.assignee-btn {
  padding: 0.35rem 0.85rem; border-radius: 20px;
  border: 2px solid var(--border);
  background: transparent; color: var(--text-muted);
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.assignee-btn.active { color: white; border-color: transparent; }

.modal-actions { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
.btn-save {
  flex: 1; padding: 0.7rem; border-radius: 10px;
  background: var(--accent); border: none; color: white;
  font-weight: 700; font-size: 0.9rem; cursor: pointer;
}
.btn-save:hover { background: #4f46e5; }
.btn-cancel {
  flex: 1; padding: 0.7rem; border-radius: 10px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text);
  font-weight: 600; font-size: 0.9rem; cursor: pointer;
}
.btn-delete {
  padding: 0.7rem 1rem; border-radius: 10px;
  background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444;
  font-weight: 600; font-size: 0.9rem; cursor: pointer;
}
.btn-delete:hover { background: rgba(239,68,68,0.25); }
```

- [ ] **Step 3: Verificar en navegador (file://)**

Abrir `Family/index.html` directamente en Chrome. Deben verse: header fijo, área de calendario en blanco, sección pendientes vacía, sin errores en consola salvo los de Firebase (aún no configurado).

- [ ] **Step 4: Commit**

```bash
git add Family/index.html Family/styles.css
git commit -m "feat(family): estructura base HTML y estilos glassmorphism"
```

---

## Task 2: Firebase — init y funciones CRUD

**Files:**
- Create: `Family/firebase.js`

> **Antes de este task:** El desarrollador debe crear un proyecto Firebase en https://console.firebase.google.com, activar Firestore en modo producción, y copiar la config del proyecto web.

- [ ] **Step 1: Crear `Family/firebase.js`**

```js
// Family/firebase.js
// Sustituir los valores de firebaseConfig con los del proyecto Firebase real.

const firebaseConfig = {
  apiKey:            "REEMPLAZAR",
  authDomain:        "REEMPLAZAR",
  projectId:         "REEMPLAZAR",
  storageBucket:     "REEMPLAZAR",
  messagingSenderId: "REEMPLAZAR",
  appId:             "REEMPLAZAR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── Colección events ──

function addEvent(data) {
  // data: { title, start, end?, assignees[] }
  return db.collection('events').add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function updateEvent(id, data) {
  return db.collection('events').doc(id).update(data);
}

function deleteEvent(id) {
  return db.collection('events').doc(id).delete();
}

function onEvents(callback) {
  // callback recibe array de { id, title, start, end, assignees }
  return db.collection('events').onSnapshot(snap => {
    const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
}

// ── Colección pending ──

function addPending(data) {
  // data: { title, assignees[] }
  return db.collection('pending').add({
    ...data,
    done: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function updatePending(id, data) {
  return db.collection('pending').doc(id).update(data);
}

function deletePending(id) {
  return db.collection('pending').doc(id).delete();
}

function onPending(callback) {
  // callback recibe array de { id, title, assignees, done }
  return db.collection('pending')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snap => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
}
```

- [ ] **Step 2: Configurar reglas Firestore**

En Firebase Console → Firestore → Reglas, pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Nota: reglas abiertas — adecuado para uso familiar privado donde la URL no se comparte públicamente. Si en el futuro se quiere restringir, añadir autenticación.

- [ ] **Step 3: Verificar conexión**

Abrir `Family/index.html` en Chrome. En consola no deben aparecer errores de Firebase. Para verificar la conexión manualmente, en la consola del navegador ejecutar:

```js
addEvent({ title: 'Test', start: '2026-04-10', assignees: ['Victor'] })
  .then(ref => console.log('OK:', ref.id))
  .catch(e => console.error(e));
```

Debe aparecer el documento en Firebase Console → Firestore → colección `events`.

- [ ] **Step 4: Commit**

```bash
git add Family/firebase.js
git commit -m "feat(family): Firebase Firestore init y funciones CRUD"
```

---

## Task 3: FullCalendar + listeners en tiempo real

**Files:**
- Create: `Family/app.js`

- [ ] **Step 1: Crear `Family/app.js` — init FullCalendar y listener events**

```js
// Family/app.js

const MEMBERS = [
  { name: 'Victor',  label: 'Víctor',  color: '#3b82f6' },
  { name: 'Johanna', label: 'Johanna', color: '#ec4899' },
  { name: 'Sofia',   label: 'Sofía',   color: '#22c55e' },
  { name: 'Martin',  label: 'Martín',  color: '#f97316' },
];
const COLOR_MAP = Object.fromEntries(MEMBERS.map(m => [m.name, m.color]));
const COLOR_NONE = '#6b7280';

function eventColor(assignees) {
  if (!assignees || assignees.length === 0) return COLOR_NONE;
  return COLOR_MAP[assignees[0]] || COLOR_NONE;
}

// ── FullCalendar ──

let calendar;

function initCalendar() {
  const el = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    height: 'auto',
    editable: true,
    eventStartEditable: true,
    eventDrop: onEventDrop,
    dateClick: onDateClick,
    eventClick: onEventClick,
    events: []
  });
  calendar.render();
}

function onEventDrop(info) {
  const newStart = info.event.startStr; // "2026-04-15"
  updateEvent(info.event.id, { start: newStart }).catch(() => info.revert());
}

function onDateClick(info) {
  openModal({ mode: 'create-event', date: info.dateStr });
}

function onEventClick(info) {
  const ev = info.event;
  openModal({
    mode: 'edit-event',
    id: ev.id,
    title: ev.title,
    date: ev.startStr,
    assignees: ev.extendedProps.assignees || []
  });
}

// ── Listener en tiempo real: events ──

function startEventsListener() {
  onEvents(events => {
    calendar.removeAllEvents();
    events.forEach(ev => {
      calendar.addEvent({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end || undefined,
        backgroundColor: eventColor(ev.assignees),
        extendedProps: { assignees: ev.assignees || [] }
      });
    });
  });
}

// ── Listener en tiempo real: pending ──

function startPendingListener() {
  onPending(items => renderPendingList(items));
}

// ── Render lista pendientes ──

function renderPendingList(items) {
  const list = document.getElementById('pendingList');
  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'pending-item' + (item.done ? ' done' : '');
    li.innerHTML = `
      <div class="pending-check" data-id="${item.id}"></div>
      <span class="pending-title">${escapeHtml(item.title)}</span>
      <div class="assignee-pills">
        ${(item.assignees || []).map(a => pillHtml(a)).join('')}
      </div>
    `;
    // Checkbox toggle done
    li.querySelector('.pending-check').addEventListener('click', e => {
      e.stopPropagation();
      updatePending(item.id, { done: !item.done });
    });
    // Click en el item → editar
    li.addEventListener('click', () => {
      openModal({
        mode: 'edit-pending',
        id: item.id,
        title: item.title,
        assignees: item.assignees || []
      });
    });
    list.appendChild(li);
  });
}

function pillHtml(memberName) {
  const color = COLOR_MAP[memberName] || COLOR_NONE;
  const initial = memberName.charAt(0).toUpperCase();
  return `<div class="assignee-pill" style="background:${color}" title="${memberName}">${initial}</div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Inicialización ──

document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  startEventsListener();
  startPendingListener();
  initModal();

  document.getElementById('btnAddPending').addEventListener('click', () => {
    openModal({ mode: 'create-pending' });
  });
});
```

- [ ] **Step 2: Verificar en navegador**

Recargar `Family/index.html`. El calendario debe renderizarse correctamente. Al añadir un evento manualmente en Firestore Console, debe aparecer en el calendario sin recargar la página.

- [ ] **Step 3: Commit**

```bash
git add Family/app.js
git commit -m "feat(family): FullCalendar mensual con listener Firestore en tiempo real"
```

---

## Task 4: Modal crear/editar

**Files:**
- Modify: `Family/app.js` — añadir funciones `initModal`, `openModal`, `closeModal`, `saveModal`

- [ ] **Step 1: Añadir al final de `Family/app.js` las funciones del modal**

```js
// ── Modal ──

let modalState = {}; // { mode, id?, date?, title?, assignees? }

function initModal() {
  document.getElementById('btnSave').addEventListener('click', saveModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnDelete').addEventListener('click', deleteFromModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Assignee toggles
  document.querySelectorAll('.assignee-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
    // Aplicar color cuando activo
    const color = btn.dataset.color;
    btn.addEventListener('mouseenter', () => {});
    btn.style.setProperty('--btn-color', color);
  });

  // Estilo dinámico para assignee-btn.active
  const style = document.createElement('style');
  MEMBERS.forEach(m => {
    style.textContent += `.assignee-btn[data-name="${m.name}"].active { background: ${m.color}; border-color: ${m.color}; }`;
  });
  document.head.appendChild(style);
}

function openModal({ mode, id, title = '', date = '', assignees = [] }) {
  modalState = { mode, id, title, date, assignees };

  const isEdit = mode === 'edit-event' || mode === 'edit-pending';
  document.getElementById('modalTitle').textContent = isEdit ? 'Editar tarea' : 'Nueva tarea';
  document.getElementById('modalInputTitle').value = title;
  document.getElementById('modalInputDate').value = date;
  document.getElementById('btnDelete').style.display = isEdit ? '' : 'none';

  // Reset + activar assignees
  document.querySelectorAll('.assignee-btn').forEach(btn => {
    btn.classList.toggle('active', assignees.includes(btn.dataset.name));
  });

  // Ocultar date picker si es crear pendiente
  const dateInput = document.getElementById('modalInputDate');
  const dateLabel = dateInput.previousElementSibling;
  if (mode === 'create-pending' || mode === 'edit-pending') {
    dateInput.style.display = 'none';
    dateLabel.style.display = 'none';
  } else {
    dateInput.style.display = '';
    dateLabel.style.display = '';
  }

  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('modalInputTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  modalState = {};
}

function getSelectedAssignees() {
  return Array.from(document.querySelectorAll('.assignee-btn.active'))
    .map(btn => btn.dataset.name);
}

function saveModal() {
  const title = document.getElementById('modalInputTitle').value.trim();
  if (!title) {
    document.getElementById('modalInputTitle').focus();
    return;
  }
  const date = document.getElementById('modalInputDate').value;
  const assignees = getSelectedAssignees();
  const { mode, id } = modalState;

  if (mode === 'create-event' || (mode === 'create-pending' && date)) {
    // Si tiene fecha → evento en calendario
    addEvent({ title, start: date, assignees });
  } else if (mode === 'create-pending') {
    addPending({ title, assignees });
  } else if (mode === 'edit-event') {
    updateEvent(id, { title, start: date, assignees });
  } else if (mode === 'edit-pending') {
    updatePending(id, { title, assignees });
  }

  closeModal();
}

function deleteFromModal() {
  const { mode, id } = modalState;
  if (mode === 'edit-event') deleteEvent(id);
  else if (mode === 'edit-pending') deletePending(id);
  closeModal();
}
```

- [ ] **Step 2: Verificar flujos del modal**

Probar en el navegador:
1. Tocar un día → se abre modal con fecha rellena → guardar → aparece en calendario
2. Tocar el evento creado → se abre en modo edición → cambiar título → guardar → calendario actualiza
3. Editar evento → Eliminar → desaparece del calendario
4. Botón `+` pendientes → modal sin fecha → guardar → aparece en lista
5. Tocar pendiente → editar → guardar → lista actualiza
6. Checkbox → tarea se tacha

- [ ] **Step 3: Commit**

```bash
git add Family/app.js
git commit -m "feat(family): modal crear/editar eventos y pendientes"
```

---

## Task 5: PWA — manifest + service worker + icono

**Files:**
- Create: `Family/manifest.json`
- Create: `Family/sw.js`
- Create: `Family/icon.png` (SVG→base64)

- [ ] **Step 1: Crear `Family/manifest.json`**

```json
{
  "name": "Familia Garro",
  "short_name": "Familia",
  "description": "Planificador familiar compartido",
  "display": "standalone",
  "orientation": "any",
  "start_url": "/Family/",
  "scope": "/Family/",
  "background_color": "#0a0a0f",
  "theme_color": "#0a0a0f",
  "icons": [
    {
      "src": "icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Crear `Family/sw.js`**

```js
// Family/sw.js
const CACHE = 'familia-v1';
const ASSETS = [
  '/Family/',
  '/Family/index.html',
  '/Family/styles.css',
  '/Family/firebase.js',
  '/Family/app.js',
  '/Family/manifest.json',
  '/Family/icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo cachear assets propios, dejar pasar Firebase y CDNs
  if (!e.request.url.includes('/Family/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

- [ ] **Step 3: Registrar service worker en `Family/index.html`**

Añadir justo antes de `</body>` (después de los scripts existentes):

```html
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/Family/sw.js');
    }
  </script>
```

- [ ] **Step 4: Crear icono**

Generar un icono simple 192×192. Opción rápida: abrir la consola del navegador y ejecutar este script para generar `icon.png` como data URL, luego descargarlo:

```js
const c = document.createElement('canvas');
c.width = c.height = 192;
const ctx = c.getContext('2d');
ctx.fillStyle = '#0a0a0f';
ctx.fillRect(0,0,192,192);
ctx.fillStyle = '#6366f1';
ctx.font = 'bold 100px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🏠', 96, 96);
const a = document.createElement('a');
a.download = 'icon.png';
a.href = c.toDataURL();
a.click();
```

Guardar el archivo descargado como `Family/icon.png`.

- [ ] **Step 5: Verificar PWA**

Servir con `python -m http.server 8000` desde la raíz del proyecto. Abrir `http://localhost:8000/Family/` en Chrome. En DevTools → Application → Manifest: deben aparecer nombre, icono y `display: standalone`. En Application → Service Workers: debe aparecer registrado y activo. Chrome debe mostrar botón "Instalar" en la barra de dirección.

- [ ] **Step 6: Commit**

```bash
git add Family/manifest.json Family/sw.js Family/icon.png Family/index.html
git commit -m "feat(family): PWA manifest y service worker instalable"
```

---

## Task 6: Deploy en GitHub Pages

**Files:**
- Modify: `.github/workflows/` — verificar que Pages está configurado para servir desde `main`

- [ ] **Step 1: Verificar configuración de GitHub Pages**

En el repositorio GitHub → Settings → Pages → Source: debe estar en `Deploy from branch` → `main` → `/ (root)`.

Si no está configurado, activarlo. GitHub Pages servirá todos los archivos desde la raíz, incluyendo `/Family/`.

- [ ] **Step 2: Actualizar `start_url` en manifest si el repo tiene nombre**

Si el repo se llama `AntiGravity` y la URL de Pages es `https://usuario.github.io/AntiGravity/`, actualizar `Family/manifest.json`:

```json
{
  "start_url": "/AntiGravity/Family/",
  "scope": "/AntiGravity/Family/"
}
```

Y actualizar el registro del service worker en `index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/AntiGravity/Family/sw.js');
  }
</script>
```

Y en `sw.js`, actualizar los ASSETS con el path correcto:

```js
const ASSETS = [
  '/AntiGravity/Family/',
  '/AntiGravity/Family/index.html',
  '/AntiGravity/Family/styles.css',
  '/AntiGravity/Family/firebase.js',
  '/AntiGravity/Family/app.js',
  '/AntiGravity/Family/manifest.json',
  '/AntiGravity/Family/icon.png'
];
```

- [ ] **Step 3: Push y verificar deploy**

```bash
git push origin main
```

Esperar ~2 minutos. Abrir `https://<usuario>.github.io/AntiGravity/Family/` en el móvil. Chrome en Android mostrará "Añadir a pantalla de inicio". Safari en iOS: compartir → "Añadir a pantalla de inicio".

- [ ] **Step 4: Commit final si se modificaron paths**

```bash
git add Family/manifest.json Family/sw.js Family/index.html
git commit -m "feat(family): ajustar paths PWA para GitHub Pages"
git push origin main
```

---

## Task 7: Alimentar datos iniciales desde la imagen

> Introducir los eventos de la imagen del calendario familiar (abril–mayo 2026) directamente en Firestore o mediante la propia app ya desplegada.

- [ ] **Step 1: Abrir la app desplegada en el navegador**

Ir a `https://<usuario>.github.io/AntiGravity/Family/`

- [ ] **Step 2: Introducir eventos recurrentes de lunes**

Cada lunes: "Sofia atletismo", "Martin karate y futbol 18h" — asignados a Sofía y Martín respectivamente. Introducir los de abril y mayo 2026 (13, 20, 27 abril; 4, 11, 18 mayo).

- [ ] **Step 3: Introducir resto de eventos de la imagen**

Siguiendo la imagen proporcionada, introducir:
- Martes 14 abr: "Pruebas Martin" (Martín), "Martin padel 17:30" (Martín), "Victor va Barcelona" (Víctor)
- Miércoles 15 abr: "Pruebas Martin" (Martín), "Sofia atletismo 17:30" (Sofía), "Martin futbol 17" (Martín)
- Viernes 10 abr: "Sofia baile" (Sofía), "Martin karate" (Martín)
- Sábado 11 abr: "Futbol Martin 09h" (Martín)
- Domingo 19 abr: "GUARDIA" (Víctor)
- … (continuar con los eventos visibles en la imagen)

Estos se guardan directamente en Firestore y quedan sincronizados en todos los dispositivos.
