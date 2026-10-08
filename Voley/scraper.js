// Voley/scraper.js — Playwright scraper for fmvoley.com
'use strict';

const fs   = require('fs');
const path = require('path');

const TIMEOUT  = 45_000;
const DATA_DIR = path.join(__dirname, 'data');

// Known IDs from API discovery
const TIPO_FEDERADAS     = '1';
const COMP_INF_FEM       = '1134';
const MAYO_KEYWORDS      = ['2 DE MAYO', '2DE MAYO', 'DOS DE MAYO'];

async function getBrowser() {
  const { chromium } = require('playwright');
  return chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

// Wait until a <select> has more than one real option
async function waitForOptions(page, selector, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const count = await page.$$eval(`${selector} option`, opts =>
      opts.filter(o => o.value && o.value !== '').length
    ).catch(() => 0);
    if (count > 0) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function captureCompetitionData() {
  const browser = await getBrowser();
  const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  const captured  = { clasificacion: null, resultados: null, partidos: [] };
  const apiLog    = [];

  page.on('response', async (res) => {
    const url = res.url();
    const ct  = res.headers()['content-type'] || '';
    if (!ct.includes('json')) return;
    try {
      const data = await res.json();
      apiLog.push({ url, keys: Object.keys(data).slice(0, 8) });
      console.log(`[net] ${url.replace('https://intranet.fmvoley.com','').slice(0,100)}`);

      // Clasificacion: array of teams with puntos
      if (data?.clasificacion || (data?.content && Array.isArray(data.content) && data.content[0]?.puntos !== undefined)) {
        captured.clasificacion = data;
        console.log('[scraper] ✓ clasificacion');
      }
      // Resultados: has partidos or jornadas
      if (data?.partidos || data?.jornadas || (data?.content && Array.isArray(data.content) && data.content[0]?.local !== undefined)) {
        captured.resultados = data;
        if (Array.isArray(data?.partidos)) captured.partidos.push(...data.partidos);
        if (Array.isArray(data?.content)) captured.partidos.push(...data.content);
        console.log('[scraper] ✓ resultados');
      }
    } catch (_) {}
  });

  console.log('[scraper] Navegando...');
  await page.goto('https://fmvoley.com/clasificaciones-y-resultados', {
    waitUntil: 'networkidle',
    timeout: TIMEOUT,
  });

  // Accept cookies if banner present
  try {
    const acceptBtn = await page.$('button:has-text("Aceptar"), button:has-text("Accept"), #accept-cookies, .accept-cookies');
    if (acceptBtn) { await acceptBtn.click(); await page.waitForTimeout(800); }
  } catch (_) {}

  // ── Step 1: Select "Federadas" in comboTipoCompeticion ───────────────────
  console.log('[scraper] Step 1: Seleccionando tipo Federadas...');
  try {
    await page.selectOption('#comboTipoCompeticion', TIPO_FEDERADAS);
    // Also trigger change via jQuery for bootstrap-select
    await page.evaluate(() => {
      const el = document.getElementById('comboTipoCompeticion');
      if (el && window.$) window.$(el).trigger('change');
    });
    await page.waitForTimeout(1500);
  } catch (e) { console.warn('[scraper] Step 1 error:', e.message); }

  // ── Step 2: Wait for comboCompeticiones and select INFANTIL FEMENINO ────
  console.log('[scraper] Step 2: Esperando competiciones...');
  await waitForOptions(page, '#comboCompeticiones');
  try {
    // Try by value (the competition ID)
    const options = await page.$$eval('#comboCompeticiones option', opts =>
      opts.map(o => ({ v: o.value, t: o.textContent.trim() }))
    );
    console.log('[scraper] Competiciones:', options.map(o => `${o.v}:${o.t}`).join(', '));

    const infantilOpt = options.find(o =>
      /infantil.*fem/i.test(o.t) && !o.t.includes('undefined')
    );
    if (infantilOpt) {
      await page.selectOption('#comboCompeticiones', infantilOpt.v);
      await page.evaluate((v) => {
        const el = document.getElementById('comboCompeticiones');
        if (el) { el.value = v; if (window.$) window.$(el).trigger('change'); }
      }, infantilOpt.v);
      console.log('[scraper] ✓ Seleccionado:', infantilOpt.t);
    } else {
      // Fallback: use known ID
      await page.selectOption('#comboCompeticiones', COMP_INF_FEM).catch(() => {});
      await page.evaluate(() => {
        const el = document.getElementById('comboCompeticiones');
        if (el && window.$) window.$(el).trigger('change');
      });
    }
    await page.waitForTimeout(2000);
  } catch (e) { console.warn('[scraper] Step 2 error:', e.message); }

  // ── Step 3: Select division (2ª / Zonal) ─────────────────────────────────
  console.log('[scraper] Step 3: División...');
  await waitForOptions(page, '#comboDivisiones');
  try {
    const options = await page.$$eval('#comboDivisiones option', opts =>
      opts.map(o => ({ v: o.value, t: o.textContent.trim() }))
    );
    console.log('[scraper] Divisiones:', options.map(o => `${o.v}:${o.t}`).join(', '));
    const divOpt = options.find(o => /2.*div|zonal|auton/i.test(o.t)) || options.find(o => o.v && o.v !== '');
    if (divOpt) {
      await page.selectOption('#comboDivisiones', divOpt.v);
      await page.evaluate((v) => {
        const el = document.getElementById('comboDivisiones');
        if (el) { el.value = v; if (window.$) window.$(el).trigger('change'); }
      }, divOpt.v);
      console.log('[scraper] ✓ División:', divOpt.t);
      await page.waitForTimeout(2000);
    }
  } catch (e) { console.warn('[scraper] Step 3 error:', e.message); }

  // ── Step 4: Select fase ───────────────────────────────────────────────────
  console.log('[scraper] Step 4: Fase...');
  const hasFase = await waitForOptions(page, '#comboFases', 5000);
  if (hasFase) {
    try {
      const options = await page.$$eval('#comboFases option', opts =>
        opts.map(o => ({ v: o.value, t: o.textContent.trim() }))
      );
      console.log('[scraper] Fases:', options.map(o => `${o.v}:${o.t}`).join(', '));
      const faseOpt = options.find(o => o.v && o.v !== '');
      if (faseOpt) {
        await page.selectOption('#comboFases', faseOpt.v);
        await page.evaluate((v) => {
          const el = document.getElementById('comboFases');
          if (el) { el.value = v; if (window.$) window.$(el).trigger('change'); }
        }, faseOpt.v);
        console.log('[scraper] ✓ Fase:', faseOpt.t);
        await page.waitForTimeout(2000);
      }
    } catch (e) { console.warn('[scraper] Step 4 error:', e.message); }
  }

  // ── Step 5: Select grupo "Liga A" ─────────────────────────────────────────
  console.log('[scraper] Step 5: Grupo Liga A...');
  await waitForOptions(page, '#comboGrupos');
  try {
    const options = await page.$$eval('#comboGrupos option', opts =>
      opts.map(o => ({ v: o.value, t: o.textContent.trim() }))
    );
    console.log('[scraper] Grupos:', options.map(o => `${o.v}:${o.t}`).join(', '));
    const grupoOpt = options.find(o => /liga\s*a\b/i.test(o.t))
                  || options.find(o => /liga/i.test(o.t))
                  || options.find(o => o.v && o.v !== '');
    if (grupoOpt) {
      await page.selectOption('#comboGrupos', grupoOpt.v);
      await page.evaluate((v) => {
        const el = document.getElementById('comboGrupos');
        if (el) { el.value = v; if (window.$) window.$(el).trigger('change'); }
      }, grupoOpt.v);
      console.log('[scraper] ✓ Grupo:', grupoOpt.t);
      await page.waitForTimeout(1000);
    }
  } catch (e) { console.warn('[scraper] Step 5 error:', e.message); }

  // ── Step 6: Click "Buscar" ────────────────────────────────────────────────
  console.log('[scraper] Step 6: Buscar...');
  try {
    const btn = await page.$('button:has-text("Buscar"), input[value="Buscar"], .btn-buscar');
    if (btn) {
      await btn.click();
      await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {});
    }
  } catch (e) { console.warn('[scraper] Step 6 error:', e.message); }

  await page.waitForTimeout(4000);

  // Save debug info
  const ss = path.join(DATA_DIR, 'debug_screenshot_after.png');
  await page.screenshot({ path: ss, fullPage: true });
  fs.writeFileSync(path.join(DATA_DIR, 'debug_api_log.json'), JSON.stringify(apiLog, null, 2));
  console.log('[scraper] API calls:', JSON.stringify(apiLog, null, 2));

  // DOM fallback if needed
  if (!captured.clasificacion) {
    captured.clasificacion = await extractClasificacionFromDOM(page);
    if (captured.clasificacion) console.log('[scraper] ✓ clasificacion (DOM)');
  }
  if (!captured.resultados) {
    captured.resultados = await extractResultadosFromDOM(page);
    if (captured.resultados) console.log('[scraper] ✓ resultados (DOM)');
  }

  await browser.close();
  return captured;
}

async function extractClasificacionFromDOM(page) {
  return page.evaluate(() => {
    for (const t of document.querySelectorAll('table')) {
      const rows = t.querySelectorAll('tbody tr');
      if (rows.length < 2) continue;
      const headers = [...t.querySelectorAll('thead th,thead td')].map(h => h.textContent.trim().toUpperCase());
      if (!headers.some(h => /PTS|PUNTOS/i.test(h))) continue;
      const tabla = [];
      rows.forEach((row, i) => {
        const cells = [...row.querySelectorAll('td')];
        if (cells.length < 4) return;
        const t2 = cells.map(c => c.textContent.trim());
        tabla.push({ pos: i+1, equipo: t2[1]||t2[0]||'',
          pj: parseInt(t2[2])||0, pg: parseInt(t2[3])||0, pp: parseInt(t2[4])||0,
          sg: parseInt(t2[5])||null, sp: parseInt(t2[6])||null,
          pf: parseInt(t2[7])||null, pc: parseInt(t2[8])||null,
          pts: parseInt(t2[t2.length-1])||0 });
      });
      if (tabla.length) return { tabla };
    }
    return null;
  });
}

async function extractResultadosFromDOM(page) {
  return page.evaluate(() => {
    const partidos = [];
    document.querySelectorAll('.partido,.match,[class*="partido"],[class*="match"]').forEach(row => {
      const teams = row.querySelectorAll('.equipo,.team,[class*="equipo"],[class*="team"]');
      const score = row.querySelector('.resultado,.score,[class*="score"]');
      if (teams.length >= 2) {
        const resultado = score ? score.textContent.trim() : '';
        partidos.push({ local: teams[0].textContent.trim(), visitante: teams[1].textContent.trim(),
          resultado, jugado: /\d-\d/.test(resultado) });
      }
    });
    return partidos.length ? { partidos, jornadas: [] } : null;
  });
}

// ─── Normalise ────────────────────────────────────────────────────────────────
function normalizeClasificacion(raw) {
  if (!raw) return { tabla: [] };
  if (raw.tabla) return raw;
  const src = raw.clasificacion || raw.content || raw.standings || raw.data || [];
  return {
    tabla: (Array.isArray(src) ? src : []).map((r, i) => ({
      pos:    r.pos || r.posicion || r.position || (i+1),
      equipo: r.equipo || r.nombre || r.club || r.nombre_club || r.team || '',
      pj:     parseInt(r.pj || r.jugados || r.played || 0),
      pg:     parseInt(r.pg || r.ganados || r.won || 0),
      pp:     parseInt(r.pp || r.perdidos || r.lost || 0),
      sg:     parseInt(r.sg || r.sets_favor || r.sets_a_favor || 0) || null,
      sp:     parseInt(r.sp || r.sets_contra || r.sets_en_contra || 0) || null,
      pf:     parseInt(r.pf || r.puntos_favor || r.puntos_a_favor || 0) || null,
      pc:     parseInt(r.pc || r.puntos_contra || r.puntos_en_contra || 0) || null,
      pts:    parseInt(r.pts || r.puntos || r.points || 0),
    })),
  };
}

function normalizeResultados(raw) {
  if (!raw) return { partidos: [], jornadas: [], jornada_actual: null };
  if (raw.partidos) return raw;
  const src = raw.partidos || raw.content || raw.matches || raw.results || [];
  const jornadas = (raw.jornadas || raw.rounds || []).map(j => ({
    num: j.num || j.id || '', label: j.label || `Jornada ${j.num||''}`, fecha: j.fecha || '',
  }));
  return {
    partidos: (Array.isArray(src) ? src : []).map(p => {
      const resultado = p.resultado || (p.jugado ? `${p.sets_local||p.sets_casa||0}-${p.sets_visitante||0}` : (p.hora||'–'));
      return {
        local:     p.local || p.equipo_local || p.home || p.nombre_equipo_local || '',
        visitante: p.visitante || p.equipo_visitante || p.away || p.nombre_equipo_visitante || '',
        resultado,
        jugado: p.jugado ?? /^\d-\d$/.test(resultado),
        fecha:  p.fecha || '',
        hora:   p.hora || '',
        campo:  p.campo || p.pabellon || '',
      };
    }),
    jornadas,
    jornada_actual: raw.jornada_actual || null,
  };
}

module.exports = { captureCompetitionData, normalizeClasificacion, normalizeResultados };
