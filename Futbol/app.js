// Futbol/app.js
'use strict';

const API = 'http://localhost:8080/api';

// State
let grupos = [];       // [{competicion_id, competicion_nombre, grupo_id, nombre, ...}]
let jornadas = [];     // [{num, label, fecha}] — sorted oldest→newest
let jornadaIdx = 0;    // index into jornadas[] (0 = oldest, length-1 = newest)

// ─── Boot ────────────────────────────────────────────────────────────────────
async function init() {
  lucide.createIcons();
  await loadGrupos();
  document.getElementById('grupo-select').addEventListener('change', onGrupoChange);
  document.getElementById('jornada-prev').addEventListener('click', () => { jornadaIdx = Math.max(0, jornadaIdx - 1); loadJornada(); });
  document.getElementById('jornada-next').addEventListener('click', () => { jornadaIdx = Math.min(jornadas.length - 1, jornadaIdx + 1); loadJornada(); });
}

// ─── Grupos ──────────────────────────────────────────────────────────────────
async function loadGrupos() {
  try {
    const res = await fetch(`${API}/grupos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    grupos = await res.json();

    // Group by competition for optgroups
    const byComp = {};
    grupos.forEach(g => {
      if (!byComp[g.competicion_nombre]) byComp[g.competicion_nombre] = [];
      byComp[g.competicion_nombre].push(g);
    });

    const sel = document.getElementById('grupo-select');
    sel.innerHTML = '<option value="">— Elige un grupo —</option>' +
      Object.entries(byComp).map(([comp, gs]) =>
        `<optgroup label="${comp}">` +
        gs.map(g => `<option value="${g.grupo_id}|${g.competicion_id}">${g.grupo_nombre}</option>`).join('') +
        '</optgroup>'
      ).join('');
    sel.disabled = false;
    lucide.createIcons();
  } catch (e) {
    showError('No se pudo conectar con el servidor.<br>¿Está ejecutando <strong>start.bat</strong>?');
  }
}

function onGrupoChange(e) {
  const [grupoId, competicionId] = e.target.value.split('|');
  if (!grupoId) {
    document.getElementById('panels').style.display = 'none';
    return;
  }
  loadGrupoData(grupoId, competicionId);
}

// ─── Load data ───────────────────────────────────────────────────────────────
async function loadGrupoData(grupoId, competicionId) {
  setLoading(true);
  hideError();

  // Show skeleton immediately
  showSkeleton();
  document.getElementById('panels').style.display = '';

  try {
    // Load clasificacion and resultados in parallel
    const [clasifRes, resultRes] = await Promise.all([
      fetch(`${API}/clasificacion?grupo=${grupoId}&competicion=${competicionId}`),
      fetch(`${API}/resultados?grupo=${grupoId}&competicion=${competicionId}`)
    ]);

    const clasif = await clasifRes.json();
    const result = await resultRes.json();

    if (clasif.error) throw new Error(clasif.error);

    renderClasificacion(clasif);

    // Set up jornadas navigation
    jornadas = result.jornadas || [];
    // Start at current jornada
    const actualNum = result.jornada_actual;
    jornadaIdx = actualNum
      ? Math.max(0, jornadas.findIndex(j => j.num === actualNum))
      : Math.max(0, jornadas.length - 1);

    renderResultados(result);
    lucide.createIcons();
  } catch (e) {
    showError(`Error al cargar los datos: ${e.message}`);
    document.getElementById('panels').style.display = 'none';
  } finally {
    setLoading(false);
  }
}

async function loadJornada() {
  const jornada = jornadas[jornadaIdx];
  if (!jornada) return;

  const sel = document.getElementById('grupo-select');
  const [grupoId, competicionId] = sel.value.split('|');

  updateJornadaNav();
  document.getElementById('resultados-body').innerHTML = skeletonPartidos();

  try {
    const res = await fetch(`${API}/resultados?grupo=${grupoId}&competicion=${competicionId}&jornada=${jornada.num}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    renderResultados(result);
  } catch (e) {
    document.getElementById('resultados-body').innerHTML = `<p style="color:var(--text-muted);padding:16px">Error cargando jornada</p>`;
  }
}

// ─── Render clasificacion ────────────────────────────────────────────────────
function renderClasificacion(data) {
  const body = document.getElementById('clasificacion-body');
  if (!data.tabla || data.tabla.length === 0) {
    body.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:8px 0">Sin datos de clasificación</p>';
    return;
  }
  body.innerHTML = `
    <table class="tabla-clasificacion">
      <thead>
        <tr>
          <th>#</th><th>Equipo</th><th title="Jugados">PJ</th><th title="Ganados">PG</th>
          <th title="Empatados">PE</th><th title="Perdidos">PP</th>
          <th title="Goles a favor">GF</th><th title="Goles en contra">GC</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
        ${data.tabla.map(r => `
          <tr>
            <td>${r.pos}</td>
            <td>${r.equipo}</td>
            <td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td>
            <td>${r.gf}</td><td>${r.gc}</td>
            <td class="pts">${r.pts}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ─── Render resultados ───────────────────────────────────────────────────────
function renderResultados(data) {
  // Update jornadas if we have them
  if (data.jornadas && data.jornadas.length > 0) {
    jornadas = data.jornadas;
  }

  updateJornadaNav();
  const body = document.getElementById('resultados-body');

  if (!data.partidos || data.partidos.length === 0) {
    body.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:8px 0">Sin partidos en esta jornada</p>';
    return;
  }

  body.innerHTML = data.partidos.map(p => `
    <div class="partido">
      <span class="equipo-local">${p.local}</span>
      <span class="resultado ${p.jugado ? '' : 'pendiente'}">${p.resultado}</span>
      <span class="equipo-visitante">${p.visitante}</span>
    </div>`).join('');
}

function updateJornadaNav() {
  const jornada = jornadas[jornadaIdx];
  const label = document.getElementById('jornada-label');
  const prev = document.getElementById('jornada-prev');
  const next = document.getElementById('jornada-next');

  if (!jornadas.length || !jornada) {
    label.textContent = 'Sin jornadas';
    prev.disabled = true;
    next.disabled = true;
    return;
  }

  label.textContent = `${jornada.label}${jornada.fecha ? ' · ' + jornada.fecha : ''}`;
  prev.disabled = jornadaIdx <= 0;
  next.disabled = jornadaIdx >= jornadas.length - 1;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function skeletonPartidos() {
  return Array(5).fill(`
    <div class="partido">
      <span class="equipo-local"><span class="skeleton" style="width:80%"></span></span>
      <span class="resultado"><span class="skeleton" style="width:40px;height:14px"></span></span>
      <span class="equipo-visitante"><span class="skeleton" style="width:80%"></span></span>
    </div>`).join('');
}

function showSkeleton() {
  document.getElementById('clasificacion-body').innerHTML =
    '<table class="tabla-clasificacion"><tbody>' +
    Array(10).fill(`<tr>${Array(9).fill('<td><span class="skeleton" style="width:90%"></span></td>').join('')}</tr>`).join('') +
    '</tbody></table>';
  document.getElementById('resultados-body').innerHTML = skeletonPartidos();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setLoading(on) {
  const el = document.getElementById('loading');
  el.innerHTML = on ? '<span class="spinner"></span> Cargando datos de la RFFM...' : '';
  el.style.display = on ? '' : 'none';
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.innerHTML = msg;
  el.style.display = '';
}

function hideError() {
  document.getElementById('error-msg').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);
