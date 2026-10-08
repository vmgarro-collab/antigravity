// Voley/scraper.js — Playwright scraper for fmvoley.com
'use strict';

const fs   = require('fs');
const path = require('path');

const TIMEOUT    = 40_000;
const DATA_DIR   = path.join(__dirname, 'data');

async function getBrowser() {
  const { chromium } = require('playwright');
  return chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

async function captureCompetitionData() {
  const browser = await getBrowser();
  const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  const captured   = { clasificacion: null, resultados: null, partidos: [] };
  const allRequests = [];

  // Log EVERY response for debug
  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    const ct = res.headers()['content-type'] || '';
    allRequests.push({ url, status, ct });

    if (!ct.includes('json')) return;
    try {
      const data = await res.json();
      console.log(`[net] JSON ${status} ${url.slice(0, 120)}`);

      if (data?.clasificacion || data?.standings || data?.tabla) {
        captured.clasificacion = data;
        console.log('[scraper] ✓ clasificacion capturada');
      }
      if (data?.partidos || data?.jornadas || data?.results || data?.matches) {
        captured.resultados = data;
        if (Array.isArray(data?.partidos)) captured.partidos.push(...data.partidos);
        console.log('[scraper] ✓ resultados capturados');
      }
    } catch (_) {}
  });

  console.log('[scraper] Navegando a fmvoley.com...');
  await page.goto('https://fmvoley.com/clasificaciones-y-resultados', {
    waitUntil: 'networkidle',
    timeout: TIMEOUT,
  });

  // Screenshot for debug
  const ssPath = path.join(DATA_DIR, 'debug_screenshot.png');
  await page.screenshot({ path: ssPath, fullPage: true });
  console.log('[scraper] Screenshot guardado en data/debug_screenshot.png');

  // Dump page structure for debug
  const structure = await page.evaluate(() => {
    const selects  = [...document.querySelectorAll('select')].map(s => ({
      tag: 'select', id: s.id, name: s.name, options: [...s.options].map(o => o.text).slice(0, 10)
    }));
    const buttons  = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 20);
    const divRoles = [...document.querySelectorAll('[role=listbox],[role=combobox],[role=option]')].map(e => ({
      role: e.getAttribute('role'), text: e.textContent.trim().slice(0, 60)
    })).slice(0, 20);
    const inputs   = [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder })).slice(0, 10);
    return { selects, buttons, divRoles, inputs };
  });
  const debugPath = path.join(DATA_DIR, 'debug_structure.json');
  fs.writeFileSync(debugPath, JSON.stringify({ structure, allRequests }, null, 2));
  console.log('[scraper] Estructura del DOM:', JSON.stringify(structure, null, 2));

  // Try to interact with custom dropdowns if no standard selects
  if (!structure.selects.length) {
    console.log('[scraper] No hay <select> nativos, probando dropdowns personalizados...');
    await tryCustomDropdowns(page, captured);
  } else {
    await tryNativeSelects(page, structure.selects, captured);
  }

  await page.waitForTimeout(4000);

  // DOM fallback
  if (!captured.clasificacion) {
    captured.clasificacion = await extractClasificacionFromDOM(page);
    if (captured.clasificacion) console.log('[scraper] ✓ clasificacion extraída del DOM');
  }
  if (!captured.resultados) {
    captured.resultados = await extractResultadosFromDOM(page);
    if (captured.resultados) console.log('[scraper] ✓ resultados extraídos del DOM');
  }

  // Final screenshot
  const ss2Path = path.join(DATA_DIR, 'debug_screenshot_after.png');
  await page.screenshot({ path: ss2Path, fullPage: true });

  await browser.close();
  return captured;
}

async function tryNativeSelects(page, selects, captured) {
  for (const sel of selects) {
    const tipoOpt = sel.options.find(o => /liga|compet|regular/i.test(o) && !/cup|copa/i.test(o));
    if (tipoOpt) {
      await page.selectOption(`select[id="${sel.id}"], select[name="${sel.name}"]`, { label: tipoOpt });
      await page.waitForTimeout(2000);
      break;
    }
  }
  await page.waitForTimeout(1000);
  const selects2 = await page.$$('select');
  for (const s of selects2) {
    const opts = await s.$$eval('option', os => os.map(o => o.textContent.trim()));
    const compOpt = opts.find(o => /infantil.*fem|fem.*infantil/i.test(o));
    if (compOpt) {
      await s.selectOption({ label: compOpt });
      await page.waitForTimeout(2000);
      break;
    }
  }
  await page.waitForTimeout(1000);
  const selects3 = await page.$$('select');
  for (const s of selects3) {
    const opts = await s.$$eval('option', os => os.map(o => o.textContent.trim()));
    const grupoOpt = opts.find(o => /liga\s*a\b/i.test(o));
    if (grupoOpt) {
      await s.selectOption({ label: grupoOpt });
      await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {});
      break;
    }
  }
}

async function tryCustomDropdowns(page, captured) {
  // Try clicking on elements that look like competition selectors
  try {
    // Look for "Tipo de competición" or similar labels and click the associated control
    const clickables = await page.$$('[class*="select"],[class*="dropdown"],[class*="combo"],[class*="picker"]');
    console.log(`[scraper] Encontrados ${clickables.length} elementos tipo dropdown`);

    for (const el of clickables.slice(0, 5)) {
      const txt = await el.textContent();
      console.log(`[scraper] Dropdown: "${txt?.trim().slice(0, 60)}"`);
    }

    // Try clicking the first custom dropdown
    if (clickables.length > 0) {
      await clickables[0].click();
      await page.waitForTimeout(1000);

      // Look for "Liga" option
      const ligaOpt = await page.$('text=/liga/i');
      if (ligaOpt) {
        await ligaOpt.click();
        await page.waitForTimeout(2000);
      }
    }
  } catch (e) {
    console.warn('[scraper] tryCustomDropdowns error:', e.message);
  }
}

async function extractClasificacionFromDOM(page) {
  return page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    for (const t of tables) {
      const rows    = t.querySelectorAll('tbody tr');
      if (rows.length < 2) continue;
      const headers = [...t.querySelectorAll('thead th, thead td')].map(h => h.textContent.trim().toUpperCase());
      if (!headers.some(h => /PTS|PUNTOS/i.test(h))) continue;
      const tabla = [];
      rows.forEach((row, i) => {
        const cells = [...row.querySelectorAll('td')];
        if (cells.length < 4) return;
        const t = cells.map(c => c.textContent.trim());
        tabla.push({
          pos: i + 1, equipo: t[1] || t[0] || '',
          pj: parseInt(t[2])||0, pg: parseInt(t[3])||0, pp: parseInt(t[4])||0,
          sg: parseInt(t[5])||null, sp: parseInt(t[6])||null,
          pf: parseInt(t[7])||null, pc: parseInt(t[8])||null,
          pts: parseInt(t[t.length-1])||0,
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
    document.querySelectorAll('.partido,.match,.resultado,[class*="partido"],[class*="match"]').forEach(row => {
      const teams = row.querySelectorAll('.equipo,.team,[class*="equipo"],[class*="team"]');
      const score = row.querySelector('.resultado,.score,[class*="resultado"],[class*="score"]');
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
  const src = raw.clasificacion || raw.standings || raw.data || [];
  const tabla = (Array.isArray(src) ? src : []).map((r, i) => ({
    pos: r.pos || r.posicion || r.position || (i+1),
    equipo: r.equipo || r.nombre || r.team || r.name || '',
    pj: parseInt(r.pj || r.jugados || r.played || 0),
    pg: parseInt(r.pg || r.ganados || r.won || 0),
    pp: parseInt(r.pp || r.perdidos || r.lost || 0),
    sg: parseInt(r.sg || r.sets_favor || 0) || null,
    sp: parseInt(r.sp || r.sets_contra || 0) || null,
    pf: parseInt(r.pf || r.puntos_favor || 0) || null,
    pc: parseInt(r.pc || r.puntos_contra || 0) || null,
    pts: parseInt(r.pts || r.puntos || r.points || 0),
  }));
  return { tabla };
}

function normalizeResultados(raw) {
  if (!raw) return { partidos: [], jornadas: [], jornada_actual: null };
  if (raw.partidos) return raw;
  const jornadas = (raw.jornadas || raw.rounds || []).map(j => ({
    num: j.num || j.id || '', label: j.label || `Jornada ${j.num||''}`, fecha: j.fecha || '',
  }));
  const partidos = (raw.partidos || raw.matches || raw.results || []).map(p => {
    const resultado = p.resultado || (p.jugado ? `${p.sets_local||0}-${p.sets_visitante||0}` : (p.hora||'–'));
    return {
      local: p.local || p.home || '', visitante: p.visitante || p.away || '',
      resultado, jugado: p.jugado ?? /^\d-\d$/.test(resultado),
      fecha: p.fecha||'', hora: p.hora||'', campo: p.campo||'',
    };
  });
  return { partidos, jornadas, jornada_actual: raw.jornada_actual || null };
}

module.exports = { captureCompetitionData, normalizeClasificacion, normalizeResultados };
