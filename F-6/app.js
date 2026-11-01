// F-6/app.js — El Paraguas, Liga Veteranos
'use strict';

// ─── Service Worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  const _hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('/antigravity/F-6/sw.js').then(reg => { reg.update(); });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (_hadCtrl) window.location.reload(); });
}

// ─── H2H modal ────────────────────────────────────────────────────────────────
let _todosPartidos = [];

function showH2H(equipo) {
  const partidos = _todosPartidos.filter(p => {
    const l = (p.local || '').toUpperCase(), v = (p.visitante || '').toUpperCase();
    const rival = equipo.toUpperCase();
    return (l.includes('PARAGUAS') && v.includes(rival)) ||
           (v.includes('PARAGUAS') && l.includes(rival));
  });

  const rows = partidos.length
    ? partidos.map(p => {
        const esLocal = (p.local || '').toUpperCase().includes('PARAGUAS');
        const gl = esLocal ? p.golesLocal : p.golesVisitante;
        const gv = esLocal ? p.golesVisitante : p.golesLocal;
        const cls = gl > gv ? 'win' : gl < gv ? 'loss' : 'draw';
        return `<tr class="h2h-${cls}">
          <td>${p.fecha || '–'}</td>
          <td>${esLocal ? '🏠' : '✈️'} El Paraguas</td>
          <td class="h2h-score">${gl} – ${gv}</td>
          <td>${escHtml(esLocal ? p.visitante : p.local)}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="color:var(--text-muted);padding:12px;text-align:center">Sin enfrentamientos aún</td></tr>`;

  document.getElementById('h2h-title').textContent = `☂ El Paraguas vs ${equipo}`;
  document.getElementById('h2h-tbody').innerHTML = rows;
  document.getElementById('h2h-modal').style.display = 'flex';
  lucide.createIcons();
}

function closeH2H() {
  document.getElementById('h2h-modal').style.display = 'none';
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bust() { return `?t=${Date.now()}`; }

function parseFecha(str) {
  // "DD/MM/YYYY"
  if (!str) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
}

function formatFechaLabel(str) {
  const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const f = parseFecha(str);
  if (!f) return str || '';
  return `${DIAS[f.getDay()]} ${str}`;
}

// ─── State ────────────────────────────────────────────────────────────────────
let jornadas   = []; // [{num, fecha, partidos:[]}]
let jornadaIdx = 0;
let _goleadoresAll = [];
let _goleadoresExpanded = false;

// ─── Refresh ──────────────────────────────────────────────────────────────────
function setRefreshing(on) {
  const btn = document.getElementById('btn-refresh');
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('spinning', on);
}

async function refreshData() {
  setRefreshing(true);
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) reg.update();
  }
  await loadAll();
  setRefreshing(false);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function init() {
  lucide.createIcons();
  document.getElementById('jornada-prev').addEventListener('click', () => {
    jornadaIdx = Math.max(0, jornadaIdx - 1);
    renderJornada();
  });
  document.getElementById('jornada-next').addEventListener('click', () => {
    jornadaIdx = Math.min(jornadas.length - 1, jornadaIdx + 1);
    renderJornada();
  });
  await loadAll();
}

async function loadAll() {
  setLoading(true);
  hideError();
  try {
    const [clasificacion, resultados, calendario, goleadores] = await Promise.all([
      fetch('data/clasificacion.json' + bust()).then(r => r.json()),
      fetch('data/resultados.json' + bust()).then(r => r.json()).catch(() => []),
      fetch('data/calendario.json' + bust()).then(r => r.json()).catch(() => []),
      fetch('data/goleadores.json' + bust()).then(r => r.json()).catch(() => []),
    ]);

    // Build jornadas combining resultados + calendario
    _todosPartidos = resultados;
    const jornadaMap = {};

    for (const p of resultados) {
      const k = p.jornada;
      if (!jornadaMap[k]) jornadaMap[k] = { num: k, fecha: p.fecha, partidos: [] };
      jornadaMap[k].partidos.push({ ...p, jugado: true, resultado: `${p.golesLocal}-${p.golesVisitante}` });
    }
    for (const p of calendario) {
      const k = p.jornada;
      if (!jornadaMap[k]) jornadaMap[k] = { num: k, fecha: p.fecha, partidos: [] };
      else if (!jornadaMap[k].fecha && p.fecha) jornadaMap[k].fecha = p.fecha;
      // Only add if not already in resultados
      const yaJugado = jornadaMap[k].partidos.some(r =>
        r.local === p.local && r.visitante === p.visitante
      );
      if (!yaJugado) {
        jornadaMap[k].partidos.push({ ...p, jugado: false, resultado: p.hora || '' });
      }
    }

    jornadas = Object.values(jornadaMap).sort((a, b) => a.num - b.num);

    // Detect best jornada to show
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let bestIdx = 0;
    for (let i = 0; i < jornadas.length; i++) {
      const f = parseFecha(jornadas[i].fecha);
      if (f && f <= today) bestIdx = i;
    }
    // Advance if >3 days since last played jornada
    const bestFecha = parseFecha(jornadas[bestIdx]?.fecha);
    if (bestFecha) {
      const diasDesde = (today - bestFecha) / 86400000;
      if (diasDesde > 3 && bestIdx < jornadas.length - 1) bestIdx++;
    }
    jornadaIdx = bestIdx;

    renderClasificacion(clasificacion);
    renderJornada();
    _goleadoresAll = goleadores;
    _goleadoresExpanded = false;
    renderGoleadores(goleadores, false);

    document.getElementById('panels').style.display = '';
    document.getElementById('panel-goleadores').style.display = '';
    lucide.createIcons();
  } catch (e) {
    showError(`No se pudieron cargar los datos.<br><small>${e.message}</small>`);
  } finally {
    setLoading(false);
  }
}

// ─── Renders ──────────────────────────────────────────────────────────────────
function renderClasificacion(data) {
  const body = document.getElementById('clasificacion-body');
  if (!data?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin datos</p>'; return; }
  body.innerHTML = `
    <table class="tabla-clasificacion">
      <thead><tr>
        <th>#</th><th>Equipo</th>
        <th title="Jugados">PJ</th><th title="Ganados">G</th>
        <th title="Empatados">E</th><th title="Perdidos">P</th>
        <th class="col-gf" title="Goles a favor">GF</th>
        <th class="col-gc" title="Goles en contra">GC</th>
        <th>Pts</th>
      </tr></thead>
      <tbody>${data.map(r => {
        const esParaguas = (r.equipo || '').toLowerCase().includes('paraguas');
        const click = esParaguas ? '' : ` onclick="showH2H('${escHtml(r.equipo)}')" title="Ver enfrentamientos vs El Paraguas"`;
        return `<tr${esParaguas ? ' class="paraguas-clasif"' : ''}${click}>
          <td>${r.pos}</td>
          <td>${escHtml(r.equipo)}${esParaguas ? ' <span class="paraguas-badge">☂</span>' : ''}</td>
          <td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td>
          <td class="col-gf">${r.gf}</td><td class="col-gc">${r.gc}</td>
          <td class="pts">${r.pts}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

function renderJornada() {
  updateJornadaNav();
  const j = jornadas[jornadaIdx];
  const body = document.getElementById('partidos-body');
  if (!j) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin partidos</p>'; return; }

  body.innerHTML = j.partidos.map(p => {
    const esLocal = (p.local || '').toUpperCase().includes('PARAGUAS');
    const esVis   = (p.visitante || '').toUpperCase().includes('PARAGUAS');
    const res = p.jugado ? p.resultado : (p.hora || '–');
    let resCls = '';
    if (p.jugado && (esLocal || esVis)) {
      const gl = esLocal ? p.golesLocal : p.golesVisitante;
      const gv = esLocal ? p.golesVisitante : p.golesLocal;
      resCls = gl > gv ? ' resultado-win' : gl < gv ? ' resultado-loss' : '';
    }
    return `
    <div class="partido-wrap${esLocal || esVis ? ' partido-propio' : ''}">
      <div class="partido">
        <span class="equipo-local${esLocal ? ' nombre-propio' : ''}">${escHtml(p.local)}</span>
        <span class="resultado${p.jugado ? resCls : ' pendiente'}">${res}</span>
        <span class="equipo-visitante${esVis ? ' nombre-propio' : ''}">${escHtml(p.visitante)}</span>
      </div>
      ${p.fecha ? `<div class="partido-detalle"><span>📅 ${formatFechaLabel(p.fecha)}</span></div>` : ''}
    </div>`;
  }).join('');
}

function updateJornadaNav() {
  const j    = jornadas[jornadaIdx];
  const prev = document.getElementById('jornada-prev');
  const next = document.getElementById('jornada-next');
  const lbl  = document.getElementById('jornada-label');
  if (!j) { lbl.textContent = '—'; prev.disabled = true; next.disabled = true; return; }
  const fechaStr = j.fecha ? ` · ${formatFechaLabel(j.fecha)}` : '';
  lbl.textContent = `Jornada ${j.num}${fechaStr}`;
  prev.disabled = jornadaIdx <= 0;
  next.disabled = jornadaIdx >= jornadas.length - 1;
}

function renderGoleadores(goles, showAll = false) {
  const body = document.getElementById('goleadores-body');
  if (!goles?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin datos</p>'; return; }
  const TOP = 10;
  const visible = showAll ? goles : goles.slice(0, TOP);
  const rows = visible.map((g, i) => `
    <tr${g.paraguas ? ' class="paraguas-row"' : ''}>
      <td>${i + 1}</td>
      <td>${escHtml(g.jugador)}${g.paraguas ? ' <span class="paraguas-badge">☂</span>' : ''}</td>
      <td>${escHtml(g.equipo)}</td>
      <td>${g.partidos ?? '–'}</td>
      <td class="goles-cell">${g.goles}</td>
    </tr>`).join('');
  const btn = goles.length > TOP
    ? `<button class="btn-ver-todos" onclick="toggleGoleadores()">${showAll ? '▲ Ver menos' : `▼ Ver todos (${goles.length})`}</button>`
    : '';
  body.innerHTML = `
    <table class="tabla-goleadores">
      <thead><tr>
        <th>#</th><th>Jugador</th><th>Equipo</th>
        <th title="Partidos">PJ</th><th title="Goles">G</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>${btn}`;
}

function toggleGoleadores() {
  _goleadoresExpanded = !_goleadoresExpanded;
  renderGoleadores(_goleadoresAll, _goleadoresExpanded);
}

function skeletonPartidos() {
  return Array(4).fill(`
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
