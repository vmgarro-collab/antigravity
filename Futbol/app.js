// Futbol/app.js
'use strict';

const API = 'http://localhost:8080/api';

// Default group: Preferente Benjamin F7 Grupo 12
const DEFAULT_COMPETICION = '24037779';
const DEFAULT_GRUPO = '24037790';
// Libertad team identifier
const LIBERTAD_EQUIPO_ID = '851121';

// State
let grupos = [];
let jornadas = [];
let jornadaIdx = 0;

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

    // Auto-select default group
    const defaultVal = `${DEFAULT_GRUPO}|${DEFAULT_COMPETICION}`;
    const opt = sel.querySelector(`option[value="${defaultVal}"]`);
    if (opt) {
      sel.value = defaultVal;
      loadGrupoData(DEFAULT_GRUPO, DEFAULT_COMPETICION);
    }
    lucide.createIcons();
  } catch (e) {
    showError('No se pudo conectar con el servidor.<br>¿Está ejecutando <strong>start.bat</strong>?');
  }
}

function onGrupoChange(e) {
  const [grupoId, competicionId] = e.target.value.split('|');
  if (!grupoId) {
    document.getElementById('panels').style.display = 'none';
    document.getElementById('panel-goleadores').style.display = 'none';
    return;
  }
  loadGrupoData(grupoId, competicionId);
}

// ─── Load data ───────────────────────────────────────────────────────────────
async function loadGrupoData(grupoId, competicionId) {
  setLoading(true);
  hideError();
  showSkeleton();
  document.getElementById('panels').style.display = '';
  document.getElementById('panel-goleadores').style.display = 'none';

  try {
    const [clasifRes, resultRes, goleadoresRes] = await Promise.all([
      fetch(`${API}/clasificacion?grupo=${grupoId}&competicion=${competicionId}`),
      fetch(`${API}/resultados?grupo=${grupoId}&competicion=${competicionId}`),
      fetch(`${API}/goleadores?grupo=${grupoId}&competicion=${competicionId}`)
    ]);

    const clasif = await clasifRes.json();
    const result = await resultRes.json();
    const goles  = await goleadoresRes.json();

    if (clasif.error) throw new Error(clasif.error);

    renderClasificacion(clasif);

    jornadas = result.jornadas || [];
    const actualNum = result.jornada_actual;
    jornadaIdx = actualNum
      ? Math.max(0, jornadas.findIndex(j => j.num === actualNum))
      : Math.max(0, jornadas.length - 1);

    renderResultados(result);

    if (!goles.error) {
      renderGoleadores(goles);
      document.getElementById('panel-goleadores').style.display = '';
    }

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
    document.getElementById('resultados-body').innerHTML =
      `<p style="color:var(--text-muted);padding:16px">Error cargando jornada</p>`;
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
          <th>#</th><th>Equipo</th>
          <th title="Jugados">PJ</th><th title="Ganados">PG</th>
          <th title="Empatados">PE</th><th title="Perdidos">PP</th>
          <th title="Goles a favor">GF</th><th title="Goles en contra">GC</th>
          <th>Pts</th>
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
  if (data.jornadas && data.jornadas.length > 0) jornadas = data.jornadas;
  updateJornadaNav();

  const body = document.getElementById('resultados-body');
  if (!data.partidos || data.partidos.length === 0) {
    body.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:8px 0">Sin partidos en esta jornada</p>';
    return;
  }

  body.innerHTML = data.partidos.map(p => `
    <div class="partido-wrap">
      <div class="partido">
        <span class="equipo-local">${p.local}</span>
        <span class="resultado ${p.jugado ? '' : 'pendiente'}">${p.resultado}</span>
        <span class="equipo-visitante">${p.visitante}</span>
      </div>
      ${(p.campo || p.hora) ? `
      <div class="partido-detalle">
        ${p.hora ? `<span>🕐 ${p.hora}</span>` : ''}
        ${p.campo ? `<span>📍 ${p.campo}</span>` : ''}
      </div>` : ''}
    </div>`).join('');
}

function updateJornadaNav() {
  const jornada = jornadas[jornadaIdx];
  const label = document.getElementById('jornada-label');
  const prev  = document.getElementById('jornada-prev');
  const next  = document.getElementById('jornada-next');

  if (!jornadas.length || !jornada) {
    label.textContent = 'Sin jornadas';
    prev.disabled = true; next.disabled = true;
    return;
  }
  label.textContent = `${jornada.label}${jornada.fecha ? ' · ' + jornada.fecha : ''}`;
  prev.disabled = jornadaIdx <= 0;
  next.disabled = jornadaIdx >= jornadas.length - 1;
}

// ─── Render goleadores ───────────────────────────────────────────────────────
function renderGoleadores(data) {
  const body = document.getElementById('goleadores-body');
  if (!data.goleadores || data.goleadores.length === 0) {
    body.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:8px 0">Sin datos de goleadores</p>';
    return;
  }

  body.innerHTML = `
    <table class="tabla-goleadores">
      <thead>
        <tr>
          <th>#</th><th>Jugador</th><th>Equipo</th>
          <th title="Partidos jugados">PJ</th>
          <th title="Goles">G</th>
          <th title="Penaltis">P</th>
        </tr>
      </thead>
      <tbody>
        ${data.goleadores.map((g, i) => {
          const isLibertad = g.codigo_equipo === LIBERTAD_EQUIPO_ID;
          return `
          <tr class="${isLibertad ? 'libertad-row' : ''}">
            <td>${i + 1}</td>
            <td>${g.jugador}${isLibertad ? '<span class="libertad-badge">LIBERTAD</span>' : ''}</td>
            <td>${g.equipo}</td>
            <td>${g.partidos}</td>
            <td class="goles-cell">${g.goles}</td>
            <td>${g.penaltis || 0}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function skeletonPartidos() {
  return Array(5).fill(`
    <div class="partido-wrap">
      <div class="partido">
        <span class="equipo-local"><span class="skeleton" style="width:80%"></span></span>
        <span class="resultado"><span class="skeleton" style="width:40px;height:14px"></span></span>
        <span class="equipo-visitante"><span class="skeleton" style="width:80%"></span></span>
      </div>
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
