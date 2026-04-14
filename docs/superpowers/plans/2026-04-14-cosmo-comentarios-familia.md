# Cosmo: Comentarios de ánimo familiares — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un feed de comentarios de ánimo en la pantalla principal de Cosmo, accesible para toda la familia, con identidad por dispositivo vía localStorage y dashboard sin PIN.

**Architecture:** Se añaden dos funciones a `firebase.js` para leer/escribir comentarios. `index.html` recibe el HTML del feed, modal de identificación y ajuste de miembros. `app.js` integra la lógica: elimina PIN, añade flujo de comentarios y configuración de miembros. `styles.css` recibe los estilos del feed y modal.

**Tech Stack:** Vanilla JS, Firebase Firestore v10 (CDN), localStorage para identidad por dispositivo.

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `Cosmo/firebase.js` | Añadir `obtenerComentarios`, `agregarComentario` |
| `Cosmo/index.html` | Feed + modal quién-eres + ajuste miembros; eliminar modales PIN |
| `Cosmo/app.js` | Eliminar PIN; añadir lógica comentarios + miembros |
| `Cosmo/styles.css` | Estilos feed de comentarios y modal identificación |
| `Cosmo/sw.js` | Bump versión caché |

---

## Task 1: Funciones Firebase para comentarios

**Files:**
- Modify: `Cosmo/firebase.js`

- [ ] **Paso 1: Añadir imports necesarios**

En `firebase.js`, añadir `limit` a los imports de Firestore (junto a los existentes):

```js
import {
  // ...imports existentes...
  limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
```

- [ ] **Paso 2: Añadir las dos funciones al final de firebase.js**

```js
// ── COMENTARIOS ──────────────────────────────────────────────────
export async function obtenerComentarios(uid) {
  const ref = collection(db, 'usuarios', uid, 'comentarios');
  const q = query(ref, orderBy('fecha', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function agregarComentario(uid, autor, texto) {
  const ref = collection(db, 'usuarios', uid, 'comentarios');
  await addDoc(ref, { autor, texto, fecha: serverTimestamp() });
}
```

- [ ] **Paso 3: Commit**

```bash
git add Cosmo/firebase.js
git commit -m "feat(cosmo): añadir obtenerComentarios y agregarComentario a Firebase"
```

---

## Task 2: HTML — feed de comentarios y modal identificación

**Files:**
- Modify: `Cosmo/index.html`

- [ ] **Paso 1: Eliminar modales PIN**

Eliminar completamente los dos bloques de modal PIN del HTML:

```html
<!-- BORRAR todo este bloque: -->
<!-- ===================== MODAL: PIN PADRES ===================== -->
<div id="modal-pin" ...> ... </div>

<!-- BORRAR todo este bloque: -->
<!-- ===================== MODAL: CAMBIAR PIN ===================== -->
<div id="modal-cambiar-pin" ...> ... </div>
```

- [ ] **Paso 2: Cambiar botón "Padres" a "Familia"**

Sustituir en `view-cosmo`:

```html
<!-- Antes: -->
<button id="btn-padres" class="btn-padres" aria-label="Acceso panel de padres">👨‍👩‍👧 Padres</button>

<!-- Después: -->
<button id="btn-padres" class="btn-padres" aria-label="Ver estadísticas familiares">👨‍👩‍👧 Familia</button>
```

- [ ] **Paso 3: Añadir sección feed de comentarios al final de view-cosmo**

Pegar justo antes del cierre `</div>` de `view-cosmo` (después del bloque `daily-summary` y antes de `modal-edit-name`):

```html
<!-- Feed de comentarios -->
<section class="comentarios-section">
  <div class="comentarios-input-wrap">
    <input type="text" id="input-comentario" class="comentario-input"
           placeholder="Escribe un ánimo..." maxlength="200" autocomplete="off">
    <button id="btn-enviar-comentario" class="btn-enviar-comentario">Enviar</button>
  </div>
  <div id="comentarios-lista" class="comentarios-lista">
    <!-- se rellena por app.js -->
  </div>
</section>
```

- [ ] **Paso 4: Añadir modal "¿Quién eres tú?"**

Pegar después del modal `modal-logro` y antes del banner PWA:

```html
<!-- ===================== MODAL: QUIÉN ERES ===================== -->
<div id="modal-quien-eres" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="modal-quien-title">
  <div class="modal-box">
    <h3 id="modal-quien-title">¿Quién eres tú? 👋</h3>
    <p class="modal-subtitle">Elige tu nombre para los comentarios</p>
    <div id="quien-eres-botones" class="quien-eres-botones">
      <!-- se rellena por app.js con los miembros -->
    </div>
  </div>
</div>
```

- [ ] **Paso 5: Añadir sección miembros en ajustes del dashboard**

En `view-padres`, dentro de `ajustes-lista`, añadir ANTES del botón `btn-guardar-ajustes`:

```html
<div class="ajuste-row ajuste-row-titulo">
  <label><strong>Miembros de la familia</strong></label>
</div>
<div class="ajuste-row">
  <label>Miembro 1</label>
  <input type="text" id="ajuste-miembro-0" maxlength="20" placeholder="Papá">
</div>
<div class="ajuste-row">
  <label>Miembro 2</label>
  <input type="text" id="ajuste-miembro-1" maxlength="20" placeholder="Mamá">
</div>
<div class="ajuste-row">
  <label>Miembro 3</label>
  <input type="text" id="ajuste-miembro-2" maxlength="20" placeholder="Sofía">
</div>
```

- [ ] **Paso 6: Eliminar fila "Cambiar PIN" de ajustes**

Borrar esta fila del bloque `ajustes-lista`:

```html
<!-- BORRAR: -->
<div class="ajuste-row">
  <label>Cambiar PIN de padres</label>
  <button id="btn-cambiar-pin" class="btn-secondary btn-sm">Cambiar PIN</button>
</div>
```

- [ ] **Paso 7: Commit**

```bash
git add Cosmo/index.html
git commit -m "feat(cosmo): HTML feed comentarios, modal identificación, ajuste miembros"
```

---

## Task 3: Estilos CSS para feed y modal

**Files:**
- Modify: `Cosmo/styles.css`

- [ ] **Paso 1: Añadir estilos al final de styles.css**

```css
/* ── COMENTARIOS ─────────────────────────────────────────────── */
.comentarios-section {
  margin: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comentarios-input-wrap {
  display: flex;
  gap: 8px;
}

.comentario-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--color-primary);
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  background: white;
  outline: none;
}

.comentario-input:focus {
  border-color: var(--color-secondary);
}

.btn-enviar-comentario {
  padding: 10px 18px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.btn-enviar-comentario:active {
  opacity: 0.8;
}

.comentarios-lista {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comentario-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: white;
  border-radius: 14px;
  padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.comentario-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comentario-body {
  flex: 1;
  min-width: 0;
}

.comentario-meta {
  display: flex;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 2px;
}

.comentario-autor {
  font-weight: 800;
  font-size: 13px;
  color: #374151;
}

.comentario-fecha {
  font-size: 11px;
  color: #9CA3AF;
}

.comentario-texto {
  font-size: 14px;
  color: #374151;
  word-break: break-word;
}

/* ── MODAL QUIÉN ERES ────────────────────────────────────────── */
.quien-eres-botones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.btn-quien {
  padding: 14px;
  border: 2px solid var(--color-primary);
  border-radius: 14px;
  background: white;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.btn-quien:active {
  background: var(--color-primary);
  color: white;
}

/* ── AJUSTE TÍTULO ───────────────────────────────────────────── */
.ajuste-row-titulo {
  margin-top: 8px;
  border-top: 1px solid #F3F4F6;
  padding-top: 12px;
}
```

- [ ] **Paso 2: Commit**

```bash
git add Cosmo/styles.css
git commit -m "feat(cosmo): estilos feed de comentarios y modal identificación"
```

---

## Task 4: Lógica JS — eliminar PIN, añadir comentarios y miembros

**Files:**
- Modify: `Cosmo/app.js`

- [ ] **Paso 1: Actualizar imports — añadir obtenerComentarios y agregarComentario**

Al inicio de `app.js`, en la línea de imports de firebase.js:

```js
import {
  obtenerPerfil, guardarPerfil, obtenerConfig, guardarConfig,
  abrirSesion, cerrarSesionCorse,
  obtenerSesiones, obtenerSesionAbierta,
  obtenerLogros, desbloquearLogro, marcarLogroVisto,
  obtenerComentarios, agregarComentario
} from './firebase.js';
```

- [ ] **Paso 2: Actualizar el estado global — añadir comentarios y perfil con miembros**

En la sección `// ── ESTADO GLOBAL`, actualizar:

```js
let perfil = {
  nombreCorse: 'Cosmo',
  objetivoHoras: 18,
  miembros: ['Papá', 'Mamá', 'Sofía'],
  fechaInicio: null
};
let comentarios = [];  // array de comentarios cargados
```

(Eliminar `pinPadres: null` del objeto perfil.)

- [ ] **Paso 3: Sustituir lógica del botón Padres — eliminar PIN, abrir directamente**

Eliminar todo el bloque entre `// ── HASH SHA-256 PARA PIN` y `// ── MODO PADRES` (inclusive las funciones `hashPin`, todos los event listeners de `btn-padres`, `btn-cancel-pin`, `btn-confirm-pin`, `input-pin`).

Sustituir por:

```js
// ── ACCESO FAMILIA ───────────────────────────────────────────────
document.getElementById('btn-padres').addEventListener('click', async function() {
  await abrirModoPadres();
});
```

- [ ] **Paso 4: Eliminar lógica de cambiar PIN**

Eliminar el bloque completo `// ── CAMBIAR PIN` con sus tres event listeners (`btn-cambiar-pin`, `btn-cancel-nuevo-pin`, `btn-save-nuevo-pin`).

- [ ] **Paso 5: Actualizar renderDashboardPadres — añadir miembros en ajustes**

Al final de `renderDashboardPadres()`, añadir después de la línea de `ajuste-notificaciones`:

```js
const miembros = perfil.miembros || ['Papá', 'Mamá', 'Sofía'];
for (let i = 0; i < 3; i++) {
  const el = document.getElementById(`ajuste-miembro-${i}`);
  if (el) el.value = miembros[i] || '';
}
```

- [ ] **Paso 6: Actualizar btn-guardar-ajustes — guardar miembros**

En el listener de `btn-guardar-ajustes`, añadir la lectura y guardado de miembros. Sustituir el bloque completo del listener por:

```js
document.getElementById('btn-guardar-ajustes').addEventListener('click', async function() {
  const nuevoNombre = document.getElementById('ajuste-nombre').value.trim() || 'Cosmo';
  const nuevoRecordatorio = parseInt(document.getElementById('ajuste-recordatorio').value) || 60;
  const nuevaHoraResumen = document.getElementById('ajuste-hora-resumen').value || '21:00';
  const nuevasNotif = document.getElementById('ajuste-notificaciones').checked;
  const nuevosMiembros = [0, 1, 2].map(i =>
    (document.getElementById(`ajuste-miembro-${i}`)?.value || '').trim()
  ).filter(Boolean);
  if (nuevosMiembros.length < 1) { alert('Añade al menos un miembro'); return; }

  perfil.nombreCorse = nuevoNombre;
  perfil.miembros = nuevosMiembros;
  config.recordatorioMinutos = nuevoRecordatorio;
  config.horaResumenDiario = nuevaHoraResumen;
  config.notificacionesActivas = nuevasNotif;

  try {
    await Promise.all([
      guardarPerfil(uid, { nombreCorse: nuevoNombre, miembros: nuevosMiembros }),
      guardarConfig(uid, {
        recordatorioMinutos: nuevoRecordatorio,
        horaResumenDiario: nuevaHoraResumen,
        notificacionesActivas: nuevasNotif
      })
    ]);
  } catch (err) {
    console.error('Error guardando ajustes:', err);
    alert('No se pudieron guardar los ajustes. Comprueba tu conexión.');
    return;
  }

  programarResumenDiario(
    nuevaHoraResumen,
    function() {
      const min = calcularMinutosHoy();
      return { horas: Math.floor(min / 60), minutos: min % 60 };
    },
    nuevoNombre
  );

  alert('✅ Ajustes guardados');
});
```

- [ ] **Paso 7: Añadir función formatearFechaRelativa**

Añadir justo antes del bloque `// ── COMENTARIOS`:

```js
function formatearFechaRelativa(fecha) {
  if (!fecha) return '';
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
```

- [ ] **Paso 8: Añadir funciones de comentarios**

Añadir antes del bloque `// ── INICIO`:

```js
// ── COMENTARIOS ──────────────────────────────────────────────────
function renderComentarios() {
  const lista = document.getElementById('comentarios-lista');
  lista.innerHTML = '';
  if (comentarios.length === 0) {
    lista.innerHTML = '<p style="text-align:center;color:#9CA3AF;font-size:13px;padding:16px">Sé el primero en dejar un ánimo 💜</p>';
    return;
  }
  for (const c of comentarios) {
    const inicial = (c.autor || '?')[0].toUpperCase();
    const card = document.createElement('div');
    card.className = 'comentario-card';
    card.innerHTML = `
      <div class="comentario-avatar">${inicial}</div>
      <div class="comentario-body">
        <div class="comentario-meta">
          <span class="comentario-autor">${c.autor}</span>
          <span class="comentario-fecha">${formatearFechaRelativa(c.fecha)}</span>
        </div>
        <p class="comentario-texto">${c.texto}</p>
      </div>
    `;
    lista.appendChild(card);
  }
}

function mostrarModalQuienEres(callback) {
  const miembros = perfil.miembros || ['Papá', 'Mamá', 'Sofía'];
  const botonesEl = document.getElementById('quien-eres-botones');
  botonesEl.innerHTML = '';
  for (const nombre of miembros) {
    const btn = document.createElement('button');
    btn.className = 'btn-quien';
    btn.textContent = nombre;
    btn.addEventListener('click', function() {
      localStorage.setItem('cosmo_autor', nombre);
      document.getElementById('modal-quien-eres').classList.add('hidden');
      callback(nombre);
    });
    botonesEl.appendChild(btn);
  }
  document.getElementById('modal-quien-eres').classList.remove('hidden');
}

async function enviarComentario() {
  const input = document.getElementById('input-comentario');
  const texto = input.value.trim();
  if (!texto) return;

  const autorGuardado = localStorage.getItem('cosmo_autor');

  const doEnvio = async (autor) => {
    input.value = '';
    try {
      await agregarComentario(uid, autor, texto);
      comentarios = await obtenerComentarios(uid);
      renderComentarios();
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('No se pudo enviar el comentario. Comprueba tu conexión.');
    }
  };

  if (autorGuardado) {
    await doEnvio(autorGuardado);
  } else {
    mostrarModalQuienEres(doEnvio);
  }
}

document.getElementById('btn-enviar-comentario').addEventListener('click', enviarComentario);
document.getElementById('input-comentario').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') enviarComentario();
});
```

- [ ] **Paso 9: Cargar comentarios en cargarDatos**

En `cargarDatos()`, añadir `obtenerComentarios(uid)` al `Promise.all`:

```js
async function cargarDatos() {
  const [p, c, sa, ses, lg, coms] = await Promise.all([
    obtenerPerfil(uid).then(p => p || perfil),
    obtenerConfig(uid),
    obtenerSesionAbierta(uid),
    obtenerSesiones(uid, 35),
    obtenerLogros(uid),
    obtenerComentarios(uid)
  ]);
  perfil = p;
  if (!perfil.miembros) perfil.miembros = ['Papá', 'Mamá', 'Sofía'];
  config = c;
  sesionActiva = sa;
  sesiones = ses;
  logros = lg;
  comentarios = coms;

  // Verificar que la sesión "activa" de caché no esté en realidad cerrada en Firestore
  if (sesionActiva && !sesiones.find(s => s.id === sesionActiva.id)) {
    sesiones.push(sesionActiva);
  }
  if (sesionActiva) {
    const enFirestore = sesiones.find(s => s.id === sesionActiva.id);
    if (enFirestore && enFirestore.fin != null) {
      sesionActiva = null;
    }
  }
}
```

- [ ] **Paso 10: Llamar renderComentarios en init**

En la función `init()`, añadir `renderComentarios()` justo después de `actualizarUICosmo()`:

```js
actualizarUICosmo();
renderComentarios();
```

- [ ] **Paso 11: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): lógica comentarios familiares, miembros configurables, sin PIN"
```

---

## Task 5: Bump caché SW y push final

**Files:**
- Modify: `Cosmo/sw.js`

- [ ] **Paso 1: Incrementar versión de caché**

En `sw.js`, cambiar:

```js
const CACHE_NAME = 'cosmo-v7';
```

- [ ] **Paso 2: Commit y push**

```bash
git add Cosmo/sw.js
git commit -m "feat(cosmo): bump cache v7 para activar comentarios familiares"
git push origin feat/cosmo-corset-tracker
```

---

## Notas de prueba manual

Tras desplegar, verificar en el iPhone:

1. **Primera vez en dispositivo nuevo:** al pulsar Enviar sin `cosmo_autor` en localStorage → aparece modal "¿Quién eres tú?" → al elegir, guarda y envía
2. **Veces siguientes:** al pulsar Enviar → envía directamente con el nombre guardado
3. **Feed:** los comentarios aparecen ordenados del más reciente al más antiguo
4. **Dashboard sin PIN:** pulsar "Familia" abre directamente sin pedir contraseña
5. **Ajuste de miembros:** cambiar nombres en dashboard → guardar → modal "¿Quién eres tú?" muestra los nuevos nombres
6. **Multi-dispositivo:** comentario enviado desde un dispositivo aparece en el otro al recargar
