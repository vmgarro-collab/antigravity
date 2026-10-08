// Voley/app.js — B. 2 de Mayo, Infantil Femenino 2ª Div. Aut. Zonal Liga A
'use strict';

const MAYO_KEYWORDS = ['2 DE MAYO', '2DE MAYO', 'DOS DE MAYO', 'B. M. 2', 'B.M. 2'];

let _todosPartidos = [];

function esMayo(nombre) {
  const upper = (nombre || '').toUpperCase();
  return MAYO_KEYWORDS.some(k => upper.includes(k));
}

// ─── Head-to-head modal ───────────────────────────────────────────────────────
function showH2H(equipo) {
  const partidos = _todosPartidos.filter(p => {
    const l = p.local.toUpperCase(), v = p.visitante.toUpperCase();
    const rivalUp = equipo.toUpperCase();
    return (MAYO_KEYWORDS.some(k => l.includes(k)) && v.includes(rivalUp)) ||
           (MAYO_KEYWORDS.some(k => v.includes(k)) && l.includes(rivalUp));
  });

  const rows = partidos.length
    ? partidos.map(p => {
        const esLocal = esMayo(p.local);
        const rival   = esLocal ? p.visitante : p.local;
        const marcador = p.jugado ? (esLocal ? p.resultado : p.resultado.split('-').reverse().join('-')) : '–';
        const cls = p.jugado ? (() => {
          const [a, b] = p.resultado.split('-').map(Number);
          return (esLocal ? a : b) > (esLocal ? b : a) ? 'win' : 'loss';
        })() : '';
        return `<tr class="h2h-${cls}">
          <td>${p.fecha ? p.fecha.slice(0,10) : '–'}</td>
          <td>${esLocal ? '🏠' : '✈️'} ${rival}</td>
          <td class="h2h-score">${marcador}</td>
          <td>${p.campo || '–'}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="color:var(--text-muted);padding:12px">Sin enfrentamientos registrados</td></tr>`;

  document.getElementById('h2h-title').textContent  = `2 de Mayo vs ${equipo}`;
  document.getElementById('h2h-tbody').innerHTML    = rows;
  document.getElementById('h2h-modal').style.display = 'flex';
}

function closeH2H() {
  document.getElementById('h2h-modal').style.display = 'none';
}

// ─── Data source ──────────────────────────────────────────────────────────────
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const DATA  = LOCAL ? '/api' : 'data';

async function getClasificacion() {
  const res = await fetch(`data/clasificacion.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (clasificacion.json)`);
  return res.json();
}

async function getResultados(jornada) {
  const file = jornada ? `data/resultados_j${jornada}.json` : 'data/resultados.json';
  const res = await fetch(`${file}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${file})`);
  return res.json();
}

async function getTodosPartidos() {
  const res = await fetch(`data/todos_partidos.json?t=${Date.now()}`);
  return res.ok ? res.json() : [];
}

// ─── State ────────────────────────────────────────────────────────────────────
let jornadas   = [];
let jornadaIdx = 0;

// ─── Refresh ──────────────────────────────────────────────────────────────────
function setRefreshing(on) {
  const btn = document.getElementById('btn-refresh');
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('spinning', on);
}

async function refreshData() {
  setRefreshing(true);
  await loadAll();
  setRefreshing(false);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function init() {
  lucide.createIcons();
  document.getElementById('jornada-prev').addEventListener('click', () => {
    jornadaIdx = Math.max(0, jornadaIdx - 1);
    loadJornada();
  });
  document.getElementById('jornada-next').addEventListener('click', () => {
    jornadaIdx = Math.min(jornadas.length - 1, jornadaIdx + 1);
    loadJornada();
  });
  await loadAll();
}

async function loadAll() {
  setLoading(true);
  hideError();
  try {
    const [clasif, result, todos] = await Promise.all([
      getClasificacion(),
      getResultados(),
      getTodosPartidos(),
    ]);
    renderClasificacion(clasif);
    jornadas = result.jornadas || [];
    jornadaIdx = result.jornada_actual
      ? Math.max(0, jornadas.findIndex(j => j.num === result.jornada_actual))
      : Math.max(0, jornadas.length - 1);
    _todosPartidos = todos;
    renderResultados(result);
    document.getElementById('panels').style.display = '';
    lucide.createIcons();
  } catch (e) {
    showError(`No se pudieron cargar los datos.<br><small>${e.message}</small>`);
  } finally {
    setLoading(false);
  }
}

async function loadJornada() {
  updateJornadaNav();
  const jornada = jornadas[jornadaIdx];
  if (!jornada) return;
  document.getElementById('resultados-body').innerHTML = skeletonPartidos();
  try {
    const result = await getResultados(jornada.num);
    renderResultados(result);
  } catch (e) {
    document.getElementById('resultados-body').innerHTML =
      `<p style="color:var(--text-muted);padding:12px">Error cargando jornada</p>`;
  }
}

// ─── Renders ──────────────────────────────────────────────────────────────────
function renderClasificacion(data) {
  const body = document.getElementById('clasificacion-body');
  if (!data.tabla?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin datos</p>'; return; }
  body.innerHTML = `
    <table class="tabla-clasificacion">
      <thead><tr>
        <th>#</th><th>Equipo</th>
        <th title="Partidos jugados">PJ</th>
        <th title="Partidos ganados">PG</th>
        <th title="Partidos perdidos">PP</th>
        <th title="Sets ganados">SG</th>
        <th title="Sets perdidos">SP</th>
        <th class="col-pf" title="Puntos a favor">PF</th>
        <th class="col-pc" title="Puntos en contra">PC</th>
        <th>Pts</th>
      </tr></thead>
      <tbody>${data.tabla.map(r => {
        const mayo = esMayo(r.equipo);
        const click = mayo ? '' : ` onclick="showH2H('${r.equipo.replace(/'/g, "\\'")}')" title="Ver enfrentamientos vs 2 de Mayo"`;
        return `<tr${mayo ? ' class="mayo-clasif"' : ''}${click}>
          <td>${r.pos}</td>
          <td>${r.equipo}${mayo ? '<span class="mayo-badge">★</span>' : ''}</td>
          <td>${r.pj}</td><td>${r.pg}</td><td>${r.pp}</td>
          <td>${r.sg ?? '–'}</td><td>${r.sp ?? '–'}</td>
          <td class="col-pf">${r.pf ?? '–'}</td>
          <td class="col-pc">${r.pc ?? '–'}</td>
          <td class="pts">${r.pts}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

function renderResultados(data) {
  if (data.jornadas?.length) jornadas = data.jornadas;
  updateJornadaNav();
  const body = document.getElementById('resultados-body');
  if (!data.partidos?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin partidos</p>'; return; }
  body.innerHTML = data.partidos.map(p => {
    let resCls = '';
    if (p.jugado) {
      const mayoLocal = esMayo(p.local), mayoVis = esMayo(p.visitante);
      if (mayoLocal || mayoVis) {
        const [a, b] = p.resultado.split('-').map(Number);
        const mayoGana = (mayoLocal && a > b) || (mayoVis && b > a);
        resCls = mayoGana ? ' resultado-win' : ' resultado-loss';
      }
    }
    return `<div class="partido-wrap">
      <div class="partido">
        <span class="equipo-local">${p.local}</span>
        <span class="resultado${p.jugado ? resCls : ' pendiente'}">${p.resultado}</span>
        <span class="equipo-visitante">${p.visitante}</span>
      </div>
      ${p.hora || p.campo ? `<div class="partido-detalle">
        ${p.hora ? `<span>🕐 ${p.hora}</span>` : ''}
        ${p.campo ? `<span>📍 ${p.campo}</span>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');
}

function updateJornadaNav() {
  const j    = jornadas[jornadaIdx];
  const prev = document.getElementById('jornada-prev');
  const next = document.getElementById('jornada-next');
  const lbl  = document.getElementById('jornada-label');
  if (!j) { lbl.textContent = '—'; prev.disabled = true; next.disabled = true; return; }
  lbl.textContent = `${j.label}${j.fecha ? ' · ' + j.fecha : ''}`;
  prev.disabled = jornadaIdx <= 0;
  next.disabled = jornadaIdx >= jornadas.length - 1;
}

function skeletonPartidos() {
  return Array(5).fill(`
    <div class="partido-wrap"><div class="partido">
      <span class="equipo-local"><span class="skeleton" style="width:75%"></span></span>
      <span class="resultado"><span class="skeleton" style="width:38px;height:13px"></span></span>
      <span class="equipo-visitante"><span class="skeleton" style="width:75%"></span></span>
    </div></div>`).join('');
}

function setLoading(on) { document.getElementById('loading').style.display = on ? '' : 'none'; }
function showError(html) { const el = document.getElementById('error-msg'); el.innerHTML = html; el.style.display = 'block'; }
function hideError() { document.getElementById('error-msg').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', init);
