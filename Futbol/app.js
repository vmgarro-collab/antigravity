// Futbol/app.js — Preferente Benjamín F7, Grupo 12
'use strict';

// ─── Config ───────────────────────────────────────────────────────────────────
const COMPETICION_ID  = '24037779';
const GRUPO_ID        = '24037790';
const LIBERTAD_ID     = '851121';
const TEMPORADA       = '21';
const TIPOJUEGO       = '2';

const CORS_PROXY = 'https://corsproxy.io/?url=';
const RFFM       = 'https://www.rffm.es';

// ─── RFFM fetch helpers ───────────────────────────────────────────────────────
async function fetchNextData(path) {
  const url  = RFFM + path;
  const res  = await fetch(CORS_PROXY + encodeURIComponent(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html  = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
  if (!match) throw new Error('Sin datos de la RFFM');
  return JSON.parse(match[1]).props.pageProps;
}

async function getClasificacion(jornada) {
  const j = jornada ? `&jornada=${jornada}` : '';
  const props = await fetchNextData(
    `/competicion/clasificaciones?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${COMPETICION_ID}&grupo=${GRUPO_ID}${j}`
  );
  const s = props.standings || {};
  return {
    tabla: (s.clasificacion || []).map(r => ({
      pos:    parseInt(r.posicion) || 0,
      equipo: r.nombre || '',
      pj:     parseInt(r.jugados) || 0,
      pg:     parseInt(r.ganados) || 0,
      pe:     parseInt(r.empatados) || 0,
      pp:     parseInt(r.perdidos) || 0,
      gf:     parseInt(r.goles_a_favor) || 0,
      gc:     parseInt(r.goles_en_contra) || 0,
      pts:    parseInt(r.puntos) || 0,
    })),
  };
}

async function getResultados(jornada) {
  const j = jornada ? `&jornada=${jornada}` : '';
  const props = await fetchNextData(
    `/competicion/resultados-y-jornadas?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${COMPETICION_ID}&grupo=${GRUPO_ID}${j}`
  );
  const r = props.results || {};
  return {
    jornada_actual: r.jornada || null,
    jornadas: (r.listado_jornadas?.[0]?.jornadas || []).map(j => ({
      num:   j.codjornada,
      label: `Jornada ${j.nombre}`,
      fecha: j.fecha_jornada,
    })),
    partidos: (r.partidos || []).map(p => ({
      local:     p.Nombre_equipo_local || '',
      visitante: p.Nombre_equipo_visitante || '',
      resultado: p.situacion_juego === '1' ? `${p.Goles_casa}-${p.Goles_visitante}` : p.hora || '-',
      jugado:    p.situacion_juego === '1',
      campo:     p.campojuego || '',
      hora:      p.hora || '',
    })),
  };
}

async function getGoleadores() {
  const props = await fetchNextData(
    `/competicion/goleadores?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${COMPETICION_ID}&grupo=${GRUPO_ID}`
  );
  return (props.scorers?.goles || []).map(g => ({
    jugador:       g.jugador || '',
    equipo:        g.nombre_equipo || '',
    codigo_equipo: g.codigo_equipo || '',
    partidos:      parseInt(g.partidos_jugados) || 0,
    goles:         parseInt(g.goles) || 0,
    penaltis:      parseInt(g.goles_penalti) || 0,
  }));
}

// ─── State ────────────────────────────────────────────────────────────────────
let jornadas   = [];
let jornadaIdx = 0;

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
    const [clasif, result, goles] = await Promise.all([
      getClasificacion(),
      getResultados(),
      getGoleadores(),
    ]);
    renderClasificacion(clasif);
    jornadas = result.jornadas || [];
    jornadaIdx = result.jornada_actual
      ? Math.max(0, jornadas.findIndex(j => j.num === result.jornada_actual))
      : Math.max(0, jornadas.length - 1);
    renderResultados(result);
    renderGoleadores(goles);
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
        <th title="Jugados">PJ</th><th title="Ganados">PG</th>
        <th title="Empatados">PE</th><th title="Perdidos">PP</th>
        <th class="col-gf" title="Goles a favor">GF</th>
        <th class="col-gc" title="Goles en contra">GC</th>
        <th>Pts</th>
      </tr></thead>
      <tbody>${data.tabla.map(r => `<tr>
        <td>${r.pos}</td><td>${r.equipo}</td>
        <td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td>
        <td class="col-gf">${r.gf}</td><td class="col-gc">${r.gc}</td>
        <td class="pts">${r.pts}</td>
      </tr>`).join('')}</tbody>
    </table>`;
}

function renderResultados(data) {
  if (data.jornadas?.length) jornadas = data.jornadas;
  updateJornadaNav();
  const body = document.getElementById('resultados-body');
  if (!data.partidos?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin partidos</p>'; return; }
  body.innerHTML = data.partidos.map(p => `
    <div class="partido-wrap">
      <div class="partido">
        <span class="equipo-local">${p.local}</span>
        <span class="resultado${p.jugado ? '' : ' pendiente'}">${p.resultado}</span>
        <span class="equipo-visitante">${p.visitante}</span>
      </div>
      ${p.hora || p.campo ? `<div class="partido-detalle">
        ${p.hora ? `<span>🕐 ${p.hora}</span>` : ''}
        ${p.campo ? `<span>📍 ${p.campo}</span>` : ''}
      </div>` : ''}
    </div>`).join('');
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

function renderGoleadores(goles) {
  const body = document.getElementById('goleadores-body');
  if (!goles?.length) { body.innerHTML = '<p style="color:var(--text-muted);padding:8px">Sin datos</p>'; return; }
  body.innerHTML = `
    <table class="tabla-goleadores">
      <thead><tr>
        <th>#</th><th>Jugador</th><th class="col-equipo">Equipo</th>
        <th title="Partidos">PJ</th><th title="Goles">G</th><th title="Penaltis">P</th>
      </tr></thead>
      <tbody>${goles.map((g, i) => {
        const lib = g.codigo_equipo === LIBERTAD_ID;
        return `<tr${lib ? ' class="libertad-row"' : ''}>
          <td>${i + 1}</td>
          <td>${g.jugador}${lib ? '<span class="libertad-badge">LIBERTAD</span>' : ''}</td>
          <td class="col-equipo">${g.equipo}</td>
          <td>${g.partidos}</td>
          <td class="goles-cell">${g.goles}</td>
          <td>${g.penaltis}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
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
function showError(html) { const el = document.getElementById('error-msg'); el.innerHTML = html; el.style.display = ''; }
function hideError() { document.getElementById('error-msg').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', init);
