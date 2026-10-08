// Voley/scraper.js — Playwright scraper for fmvoley.com
// Uses network interception to capture API responses as the page loads
'use strict';

const MAYO_KEYWORDS  = ['2 DE MAYO', '2DE MAYO', 'DOS DE MAYO'];
const COMP_KEYWORDS  = ['INFANTIL FEMENINO', '2.*DIVIS', 'ZONAL'];
const GRUPO_KEYWORDS = ['LIGA A', 'LIGA_A'];

const TIMEOUT = 30_000;

async function getBrowser() {
  const { chromium } = require('playwright');
  return chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

// Intercept all JSON responses and return those matching a predicate
async function interceptJson(page, predicate, action) {
  const results = [];
  page.on('response', async (res) => {
    try {
      const ct = res.headers()['content-type'] || '';
      if (!ct.includes('json')) return;
      const data = await res.json();
      if (predicate(res.url(), data)) results.push({ url: res.url(), data });
    } catch (_) {}
  });
  await action();
  return results;
}

// Navigate to the search page and select the competition+group, then return the captured data
async function captureCompetitionData() {
  const browser = await getBrowser();
  const context = await browser.newContext({ locale: 'es-ES' });
  const page    = await context.newPage();

  const captured = { clasificacion: null, resultados: null, partidos: [] };

  page.on('response', async (res) => {
    try {
      const ct  = res.headers()['content-type'] || '';
      const url = res.url();
      if (!ct.includes('json')) return;
      const data = await res.json();

      // Detect clasificacion response (has standings/clasificacion array)
      if (data?.clasificacion || data?.standings) {
        captured.clasificacion = data;
        console.log('[scraper] Captured clasificacion from', url);
      }
      // Detect resultados response (has partidos or results array)
      if (data?.partidos || data?.jornadas || data?.results) {
        captured.resultados = data;
        if (Array.isArray(data?.partidos)) captured.partidos.push(...data.partidos);
        console.log('[scraper] Captured resultados from', url);
      }
    } catch (_) {}
  });

  console.log('[scraper] Navigating to fmvoley.com...');
  await page.goto('https://fmvoley.com/clasificaciones-y-resultados', {
    waitUntil: 'networkidle',
    timeout: TIMEOUT,
  });

  // Try to find and interact with competition selector dropdowns
  try {
    // Look for select elements or custom dropdowns and pick the right competition
    const selects = await page.$$('select');
    console.log(`[scraper] Found ${selects.length} select elements`);

    // Try each select looking for tipo/competicion/grupo selectors
    for (const sel of selects) {
      const options = await sel.$$eval('option', opts => opts.map(o => ({ v: o.value, t: o.textContent.trim() })));
      console.log('[scraper] Select options:', options.map(o => o.t).join(', '));

      // Look for the competition type (Liga, Competición Regular, etc.)
      const tipoOpt = options.find(o =>
        /liga|compet|regular/i.test(o.t) && !/cup|copa/i.test(o.t)
      );
      if (tipoOpt) {
        await sel.selectOption(tipoOpt.v);
        await page.waitForTimeout(1500);
        break;
      }
    }

    // After selecting tipo, look for competition dropdown with Infantil Femenino
    await page.waitForTimeout(2000);
    const selects2 = await page.$$('select');
    for (const sel of selects2) {
      const options = await sel.$$eval('option', opts => opts.map(o => ({ v: o.value, t: o.textContent.trim() })));
      const compOpt = options.find(o => /infantil.*fem|fem.*infantil/i.test(o.t));
      if (compOpt) {
        console.log('[scraper] Selecting competition:', compOpt.t);
        await sel.selectOption(compOpt.v);
        await page.waitForTimeout(2000);
        break;
      }
    }

    // After selecting competition, look for group dropdown with Liga A
    const selects3 = await page.$$('select');
    for (const sel of selects3) {
      const options = await sel.$$eval('option', opts => opts.map(o => ({ v: o.value, t: o.textContent.trim() })));
      const grupoOpt = options.find(o => /liga\s*a\b/i.test(o.t));
      if (grupoOpt) {
        console.log('[scraper] Selecting group:', grupoOpt.t);
        await sel.selectOption(grupoOpt.v);
        await page.waitForNetworkIdle({ timeout: TIMEOUT });
        break;
      }
    }
  } catch (e) {
    console.warn('[scraper] Dropdown interaction failed:', e.message);
  }

  // Wait a bit more for data to load
  await page.waitForTimeout(3000);

  // If we still have no data, try to extract directly from the DOM
  if (!captured.clasificacion) {
    captured.clasificacion = await extractClasificacionFromDOM(page);
  }
  if (!captured.resultados) {
    captured.resultados = await extractResultadosFromDOM(page);
  }

  await browser.close();
  return captured;
}

async function extractClasificacionFromDOM(page) {
  return page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    for (const t of tables) {
      const rows = t.querySelectorAll('tbody tr');
      if (rows.length < 2) continue;
      const headers = [...t.querySelectorAll('thead th, thead td')].map(h => h.textContent.trim().toUpperCase());
      const hasPts = headers.some(h => /PTS|PUNTOS/i.test(h));
      if (!hasPts) continue;

      const tabla = [];
      rows.forEach((row, i) => {
        const cells = [...row.querySelectorAll('td')];
        if (cells.length < 4) return;
        const texts = cells.map(c => c.textContent.trim());
        tabla.push({
          pos: i + 1,
          equipo: texts[1] || texts[0] || '',
          pj:  parseInt(texts[2]) || 0,
          pg:  parseInt(texts[3]) || 0,
          pp:  parseInt(texts[4]) || 0,
          sg:  parseInt(texts[5]) || null,
          sp:  parseInt(texts[6]) || null,
          pf:  parseInt(texts[7]) || null,
          pc:  parseInt(texts[8]) || null,
          pts: parseInt(texts[texts.length - 1]) || 0,
        });
      });
      if (tabla.length) return { tabla };
    }
    return null;
  });
}

async function extractResultadosFromDOM(page) {
  return page.evaluate(() => {
    const partidos = [];
    // Look for match rows
    const rows = document.querySelectorAll('.partido, .match, .resultado, [class*="partido"], [class*="match"]');
    rows.forEach(row => {
      const teams = row.querySelectorAll('.equipo, .team, [class*="equipo"], [class*="team"]');
      const score = row.querySelector('.resultado, .score, [class*="resultado"], [class*="score"]');
      if (teams.length >= 2) {
        const resultado = score ? score.textContent.trim() : '';
        const jugado = /\d-\d/.test(resultado);
        partidos.push({
          local:     teams[0].textContent.trim(),
          visitante: teams[1].textContent.trim(),
          resultado: jugado ? resultado : resultado || '–',
          jugado,
        });
      }
    });
    return partidos.length ? { partidos, jornadas: [] } : null;
  });
}

// ─── Normalise raw scraped data into app JSON format ─────────────────────────
function normalizeClasificacion(raw) {
  if (!raw) return { tabla: [] };
  if (raw.tabla) return raw;
  // Try various shapes
  const src = raw.clasificacion || raw.standings || raw.data || [];
  const tabla = (Array.isArray(src) ? src : []).map((r, i) => ({
    pos:    r.pos || r.posicion || r.position || (i + 1),
    equipo: r.equipo || r.nombre || r.team || r.name || '',
    pj:     parseInt(r.pj || r.jugados || r.played || 0),
    pg:     parseInt(r.pg || r.ganados || r.won || 0),
    pp:     parseInt(r.pp || r.perdidos || r.lost || 0),
    sg:     parseInt(r.sg || r.sets_favor || r.sets_ganados || 0) || null,
    sp:     parseInt(r.sp || r.sets_contra || r.sets_perdidos || 0) || null,
    pf:     parseInt(r.pf || r.puntos_favor || r.points_for || 0) || null,
    pc:     parseInt(r.pc || r.puntos_contra || r.points_against || 0) || null,
    pts:    parseInt(r.pts || r.puntos || r.points || 0),
  }));
  return { tabla };
}

function normalizeResultados(raw) {
  if (!raw) return { partidos: [], jornadas: [], jornada_actual: null };
  if (raw.partidos) return raw;
  const jornadas = (raw.jornadas || raw.rounds || []).map(j => ({
    num:   j.num || j.codjornada || j.id || '',
    label: j.label || `Jornada ${j.nombre || j.num || ''}`,
    fecha: j.fecha || j.fecha_jornada || '',
  }));
  const partidos = (raw.partidos || raw.matches || raw.results || []).map(p => {
    const resultado = p.resultado || (p.jugado ? `${p.sets_local || 0}-${p.sets_visitante || 0}` : (p.hora || '–'));
    return {
      local:     p.local || p.home || p.equipo_local || '',
      visitante: p.visitante || p.away || p.equipo_visitante || '',
      resultado,
      jugado: p.jugado ?? /^\d-\d$/.test(resultado),
      fecha:  p.fecha || '',
      hora:   p.hora || '',
      campo:  p.campo || p.venue || '',
    };
  });
  return { partidos, jornadas, jornada_actual: raw.jornada_actual || null };
}

module.exports = { captureCompetitionData, normalizeClasificacion, normalizeResultados };
