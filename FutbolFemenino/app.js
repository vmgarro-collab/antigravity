// FutbolFemenino/app.js — Madrid C.F. Femenino 'B'
'use strict';

// ─── Config ───────────────────────────────────────────────────────────────────
const COMPETICION_ID = '26737919';
const GRUPO_ID       = '26737922';
const TEMPORADA      = '22';
const TIPOJUEGO      = '2';

// Keywords para identificar el equipo propio en la tabla
const EQUIPO_KEYWORDS = ['MADRID'];

function esEquipoPropio(nombre) {
  const u = nombre.toUpperCase();
  return EQUIPO_KEYWORDS.every(kw => u.includes(kw));
}

// ─── Head-to-head modal ───────────────────────────────────────────────────────
let _todosPartidos = [];

function showH2H(equipo) {
  const partidos = _todosPartidos.filter(p => {
    const local = p.local.toUpperCase();
    const vis   = p.visitante.toUpperCase();
    const rivalUp = equipo.toUpperCase();
    const esPropio = name => EQUIPO_KEYWORDS.every(kw => name.includes(kw));
    return (esPropio(local) && vis.includes(rivalUp)) ||
           (vis.includes(rivalUp) === false && esPropio(vis) && local.includes(rivalUp)) ||
           (esPropio(local) && vis.includes(rivalUp)) ||
           (esPropio(vis)   && local.includes(rivalUp));
  });

  const rows = partidos.length
    ? partidos.map(p => {
        const esLocal = esEquipoPropio(p.local);
        const rival   = esLocal ? p.visitante : p.local;
        const marcador = p.jugado
          ? (esLocal ? `${p.resultado}` : p.resultado.split('-').reverse().join('-'))
          : '–';
        const ganó = p.jugado ? (() => {
          const [a, b] = p.resultado.split('-').map(Number);
          const gl = esLocal ? a : b, gr = esLocal ? b : a;
          return gl > gr ? 'win' : gl < gr ? 'loss' : 'draw';
        })() : '';
        return `<tr class="h2h-${ganó}">
          <td>${p.fecha ? p.fecha.slice(0,10) : '–'}</td>
          <td>${esLocal ? '🏠' : '✈️'} ${rival}</td>
          <td class="h2h-score">${marcador}</td>
          <td>${p.campo || '–'}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="color:var(--text-muted);padding:12px">Sin enfrentamientos registrados</td></tr>`;

  document.getElementById('h2h-title').textContent  = `Madrid C.F. Fem. 'B' vs ${equipo}`;
  document.getElementById('h2h-tbody').innerHTML    = rows;
  document.getElementById('h2h-modal').style.display = 'flex';
}

function closeH2H() {
  document.getElementById('h2h-modal').style.display = 'none';
}

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const DATA  = LOCAL ? '/api' : 'data';

// ─── Data fetchers ────────────────────────────────────────────────────────────
async function getClasificacion(jornada) {
  if (LOCAL) {
    const j = jornada ? `&jornada=${jornada}` : '';
    const res = await fetch(`/api/clasificacion?grupo=${GRUPO_ID}&competicion=${COMPETICION_ID}${j}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  const file = jornada ? `data/resultados_j${jornada}.json` : 'data/clasificacion.json';
  const res = await fetch(`${file}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${file})`);
  return res.json();
}

async function getResultados(jornada) {
  if (LOCAL) {
    const j = jornada ? `&jornada=${jornada}` : '';
    const res = await fetch(`/api/resultados?grupo=${GRUPO_ID}&competicion=${COMPETICION_ID}${j}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  const file = jornada ? `data/resultados_j${jornada}.json` : 'data/resultados.json';
  const res = await fetch(`${file}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${file})`);
  return res.json();
}

async function getGoleadores() {
  if (LOCAL) {
    const res = await fetch(`/api/goleadores?grupo=${GRUPO_ID}&competicion=${COMPETICION_ID}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.goleadores || [];
  }
  const res = await fetch(`data/goleadores.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (data/goleadores.json)`);
  const data = await res.json();
  return data.goleadores || [];
}

function parseFechaJornada(str) {
  // "DD-MM-YYYY"
  const [d, m, y] = str.split('-');
  return new Date(`${y}-${m}-${d}`);
}

// ─── State ────────────────────────────────────────────────────────────────────
let jornadas   = [];
let jornadaIdx = 0;

// ─── Refresh button ───────────────────────────────────────────────────────────
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
    const [clasif, result, goles, todosPartidos] = await Promise.all([
      getClasificacion(),
      getResultados(),
      getGoleadores(),
      LOCAL
        ? fetch(`/api/resultados?grupo=${GRUPO_ID}&competicion=${COMPETICION_ID}`).then(r => r.json()).then(d => d.partidos || [])
        : fetch(`data/todos_partidos.json?t=${Date.now()}`).then(r => r.ok ? r.json() : []),
    ]);
    renderClasificacion(clasif);
    jornadas = result.jornadas || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let bestIdx = 0;
    for (let i = 0; i < jornadas.length; i++) {
      const jFecha = jornadas[i].fecha ? parseFechaJornada(jornadas[i].fecha) : null;
      if (jFecha && jFecha <= today) bestIdx = i;
    }
    // Avanza a la siguiente jornada si han pasado más de 3 días desde la jornada actual
    const bestFecha = jornadas[bestIdx].fecha ? parseFechaJornada(jornadas[bestIdx].fecha) : null;
    if (bestFecha) {
      const diasDesde = (today - bestFecha) / 86400000;
      if (diasDesde > 3 && bestIdx < jornadas.length - 1) bestIdx++;
    }
    jornadaIdx = bestIdx;
    _todosPartidos = todosPartidos;
    await loadJornada();
    _goleadoresAll = goles;
    _goleadoresExpanded = false;
    renderGoleadores(goles, false);
    document.getElementById('panels').style.display = '';
    document.getElementById('panel-goleadores').style.display = '';
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
        <th title="Jugados">PJ</th><th title="Ganadas">PG</th>
        <th title="Empatados">PE</th><th title="Perdidos">PP</th>
        <th class="col-gf" title="Goles a favor">GF</th>
        <th class="col-gc" title="Goles en contra">GC</th>
        <th>Pts</th>
      </tr></thead>
      <tbody>${data.tabla.map(r => {
        const propio = esEquipoPropio(r.equipo);
        const click = propio ? '' : ` onclick="showH2H('${r.equipo.replace(/'/g, "\\'")}')" style="cursor:pointer" title="Ver enfrentamientos vs Madrid C.F. Femenino 'B'"`;
        return `<tr${propio ? ' class="propio-clasif"' : ''}${click}>
          <td>${r.pos}</td><td>${r.equipo}${propio ? '<span class="propio-badge">★</span>' : ''}</td>
          <td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td>
          <td class="col-gf">${r.gf}</td><td class="col-gc">${r.gc}</td>
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
    const localPropio = esEquipoPropio(p.local);
    const visPropio   = esEquipoPropio(p.visitante);
    return `
    <div class="partido-wrap${localPropio || visPropio ? ' partido-propio' : ''}">
      <div class="partido">
        <span class="equipo-local${localPropio ? ' nombre-propio' : ''}">${p.local}</span>
        <span class="resultado${p.jugado ? '' : ' pendiente'}">${p.resultado}</span>
        <span class="equipo-visitante${visPropio ? ' nombre-propio' : ''}">${p.visitante}</span>
      </div>
      ${p.hora || p.campo || p.fecha ? `<div class="partido-detalle">
        ${p.fecha ? `<span>📅 ${(() => { const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']; const f=parseFechaJornada(p.fecha); return DIAS[f.getDay()]+' '+p.fecha; })()}</span>` : ''}
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
  const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const fechaLabel = j.fecha ? (() => {
    const f = parseFechaJornada(j.fecha);
    return ` · ${DIAS[f.getDay()]} ${j.fecha}`;
  })() : '';
  lbl.textContent = `${j.label}${fechaLabel}`;
  prev.disabled = jornadaIdx <= 0;
  next.disabled = jornadaIdx >= jornadas.length - 1;
}

function abreviarNombre(str) {
  if (!str) return str;
  const [apellidos, nombre] = str.split(', ');
  if (!nombre) return str;
  const caps = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const iniciales = apellidos.split(' ').map(a => a.charAt(0).toUpperCase() + '.').join(' ');
  return caps(nombre) + ' ' + iniciales;
}
function renderGoleadores(goles, showAll = false) {
  const body = document.getElementById('goleadores-body');
  if (!goles?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin datos</p>'; return; }
  const TOP = 10;
  const visible = showAll ? goles : goles.slice(0, TOP);
  const rows = visible.map((g, i) => {
    const propio = esEquipoPropio(g.equipo);
    return `<tr${propio ? ' class="propio-row"' : ''}>
      <td>${i + 1}</td>
      <td>${abreviarNombre(g.jugador)}${propio ? '<span class="propio-badge">MCF</span>' : ''}</td>
      <td class="col-equipo">${g.equipo}</td>
      <td>${g.partidos}</td>
      <td class="goles-cell">${g.goles}</td>
      <td>${g.penaltis}</td>
    </tr>`;
  }).join('');
  const btn = goles.length > TOP
    ? `<button class="btn-ver-todos" onclick="toggleGoleadores()">${showAll ? '▲ Ver menos' : `▼ Ver todas (${goles.length})`}</button>`
    : '';
  body.innerHTML = `
    <table class="tabla-goleadores">
      <thead><tr>
        <th>#</th><th>Jugadora</th><th class="col-equipo">Equipo</th>
        <th title="Partidos">PJ</th><th title="Goles">G</th><th title="Penaltis">P</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>${btn}`;
}

let _goleadoresAll = [];
let _goleadoresExpanded = false;

function toggleGoleadores() {
  _goleadoresExpanded = !_goleadoresExpanded;
  renderGoleadores(_goleadoresAll, _goleadoresExpanded);
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
