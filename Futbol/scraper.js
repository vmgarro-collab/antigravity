// Futbol/scraper.js
'use strict';

const BASE_URL = 'https://www.rffm.es';
const TEMPORADA = '21';   // 2025-2026 season
const TIPOJUEGO = '2';    // Fútbol-7

// Names to match from /api/competitions list (case-insensitive substring match)
const BENJAMIN_KEYWORDS = ['BENJAM'];

const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cached(key, fn) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return Promise.resolve(entry.value);
  return fn().then(value => {
    _cache.set(key, { value, ts: Date.now() });
    return value;
  });
}

async function fetchJson(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BenjaminesApp/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchNextData(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BenjaminesApp/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
  if (!match) throw new Error(`No __NEXT_DATA__ found at ${url}`);
  return JSON.parse(match[1]).props.pageProps;
}

// Returns all Benjamin F7 grupos across all competitions
async function getGrupos() {
  return cached('grupos', async () => {
    // 1. Fetch all F7 competitions
    const allComps = await fetchJson(
      `/api/competitions?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}`
    );

    // 2. Filter to Benjamin competitions only (excluding Prebenjamin)
    const benjComps = allComps.filter(c => {
      const upper = c.nombre.toUpperCase();
      return BENJAMIN_KEYWORDS.some(kw => upper.includes(kw)) && !upper.includes('PREBENJAM');
    });

    // 3. For each competition, fetch its groups
    const results = await Promise.all(
      benjComps.map(async (comp) => {
        try {
          const groups = await fetchJson(
            `/api/groups?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${comp.codigo}`
          );
          return (groups || []).map(g => ({
            competicion_id:     comp.codigo,
            competicion_nombre: comp.nombre,
            grupo_id:           g.codigo,
            grupo_nombre:       g.nombre,
            total_jornadas:     parseInt(g.total_jornadas) || 0,
            nombre:             `${comp.nombre} — ${g.nombre}`,
          }));
        } catch (e) {
          console.error(`[scraper] Error fetching grupos for ${comp.nombre}:`, e.message);
          return [];
        }
      })
    );

    return results.flat();
  });
}

async function getClasificacion(grupoId, competicionId, jornada) {
  const key = `clasif_${grupoId}_${competicionId}_${jornada || ''}`;
  return cached(key, async () => {
    const jornadaParam = jornada ? `&jornada=${jornada}` : '';
    const props = await fetchNextData(
      `/competicion/clasificaciones?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${competicionId}&grupo=${grupoId}${jornadaParam}`
    );
    const s = props.standings || {};
    return {
      competicion:    s.competicion || '',
      grupo:          s.grupo || '',
      jornada:        s.jornada || null,
      fecha_jornada:  s.fecha_jornada || '',
      total_jornadas: (props.groups || []).find(g => g.codigo === grupoId)?.total_jornadas || null,
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
  });
}

async function getResultados(grupoId, competicionId, jornada) {
  const key = `result_${grupoId}_${competicionId}_${jornada || ''}`;
  return cached(key, async () => {
    const jornadaParam = jornada ? `&jornada=${jornada}` : '';
    const props = await fetchNextData(
      `/competicion/resultados-y-jornadas?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${competicionId}&grupo=${grupoId}${jornadaParam}`
    );
    const r = props.results || {};
    const allJornadas = (r.listado_jornadas?.[0]?.jornadas || []).map(j => ({
      num:   j.codjornada,
      label: `Jornada ${j.nombre}`,
      fecha: j.fecha_jornada,
    }));
    return {
      competicion:    r.nombre_competicion || '',
      grupo:          r.nombre_grupo || '',
      jornada_actual: r.jornada || null,
      jornadas:       allJornadas,
      partidos: (r.partidos || []).map(p => ({
        local:     p.Nombre_equipo_local || '',
        visitante: p.Nombre_equipo_visitante || '',
        resultado: p.situacion_juego === '1'
                     ? `${p.Goles_casa}-${p.Goles_visitante}`
                     : `${p.hora || ''}`,
        jugado:    p.situacion_juego === '1',
        fecha:     p.fecha || '',
        hora:      p.hora || '',
        campo:     p.campojuego || '',
      })),
    };
  });
}

async function getGoleadores(grupoId, competicionId) {
  const key = `goleadores_${grupoId}_${competicionId}`;
  return cached(key, async () => {
    const props = await fetchNextData(
      `/competicion/goleadores?temporada=${TEMPORADA}&tipojuego=${TIPOJUEGO}&competicion=${competicionId}&grupo=${grupoId}`
    );
    const goles = props.scorers?.goles || [];
    return {
      competicion: props.scorers?.competicion || '',
      grupo: props.scorers?.grupo || '',
      goleadores: goles.map(g => ({
        jugador:        g.jugador || '',
        equipo:         g.nombre_equipo || '',
        codigo_equipo:  g.codigo_equipo || '',
        partidos:       parseInt(g.partidos_jugados) || 0,
        goles:          parseInt(g.goles) || 0,
        penaltis:       parseInt(g.goles_penalti) || 0,
        media:          parseFloat(g.goles_por_partidos) || 0,
      }))
    };
  });
}

module.exports = { getGrupos, getClasificacion, getResultados, getGoleadores };
