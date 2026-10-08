// Voley/scraper.js — fmvoley.com scraper
// All IDs discovered via network inspection:
//   tipoCompeticion=1 (Federadas)
//   competicionId=1134 (Infantil Femenino)
//   competicionTemporadaId=23547 (2ª Div. Aut. Zonal)
//   faseId=14998 (Liga)
//   grupoId=34097 (Grupo A = Liga A)
'use strict';

const fs   = require('fs');
const path = require('path');

const API      = 'https://intranet.fmvoley.com/api/competiciones';
const GRUPO_ID = '34097';
const DATA_DIR = path.join(__dirname, 'data');
const TIMEOUT  = 45_000;

// ─── Direct API fetch (no browser needed for clasificacion + jornadas) ────────
async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VoleyApp/1.0)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getClasificacion() {
  const data = await fetchJson(`${API}/getClasificacionGrupo?grupoId=${GRUPO_ID}`);
  return data.content || [];
}

async function getJornadas() {
  const data = await fetchJson(`${API}/getJornadasGrupo?grupoId=${GRUPO_ID}`);
  return data.content || [];
}

// ─── Playwright: discover partidos endpoint by interacting with the page ──────
async function getBrowser() {
  const { chromium } = require('playwright');
  return chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

async function getPartidosViaPlaywright() {
  const browser = await getBrowser();
  const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  const partidosData = [];
  const allJsonUrls  = [];

  page.on('response', async (res) => {
    const ct = res.headers()['content-type'] || '';
    if (!ct.includes('json')) return;
    const url = res.url();
    allJsonUrls.push(url);
    try {
      const data = await res.json();
      const arr = data.content || data.partidos || data.encuentros || data.matches || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        // Detect partido: has equipoLocal / local / nombre_equipo_local etc.
        const isPartido = first.equipoLocal !== undefined || first.equipoLocalId !== undefined
          || first.local !== undefined || first.nombre_equipo_local !== undefined
          || first.equipoLocalNombre !== undefined || first.nombreEquipoLocal !== undefined
          || (first.sets_local !== undefined && first.equipoId === undefined);
        if (isPartido) {
          console.log(`[scraper] ✓ Partidos en: ${url}`);
          partidosData.push(...arr);
        }
      }
    } catch (_) {}
  });

  console.log('[scraper] Navegando con IDs correctos...');
  await page.goto('https://fmvoley.com/clasificaciones-y-resultados', {
    waitUntil: 'networkidle', timeout: TIMEOUT,
  });

  // Accept cookies
  try {
    const btn = await page.$('button:has-text("Aceptar")');
    if (btn) { await btn.click(); await page.waitForTimeout(600); }
  } catch (_) {}

  // Select Federadas (tipoCompeticionId=1)
  await page.evaluate(() => {
    const el = document.getElementById('comboTipoCompeticion');
    if (el) { el.value = '1'; if (window.$) window.$(el).trigger('change'); }
  });
  await page.waitForTimeout(2000);

  // Select Infantil Femenino (competicionId=1134)
  await page.evaluate(() => {
    const el = document.getElementById('comboCompeticiones');
    if (el) { el.value = '1134'; if (window.$) window.$(el).trigger('change'); }
  });
  await page.waitForTimeout(2000);

  // Select 2ª Div. Aut. Zonal (competicionTemporadaId=23547)
  await page.evaluate(() => {
    const el = document.getElementById('comboDivisiones');
    if (el) { el.value = '23547'; if (window.$) window.$(el).trigger('change'); }
  });
  await page.waitForTimeout(2000);

  // Select Fase Liga (faseId=14998)
  await page.evaluate(() => {
    const el = document.getElementById('comboFases');
    if (el) { el.value = '14998'; if (window.$) window.$(el).trigger('change'); }
  });
  await page.waitForTimeout(2000);

  // Select Grupo A (grupoId=34097)
  await page.evaluate(() => {
    const el = document.getElementById('comboGrupos');
    if (el) { el.value = '34097'; if (window.$) window.$(el).trigger('change'); }
  });
  await page.waitForTimeout(1000);

  // Click Buscar
  try {
    const buscar = await page.$('button:has-text("Buscar"), input[value="Buscar"], .btn-buscar, #btn-buscar');
    if (buscar) {
      await buscar.click();
      await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {});
    }
  } catch (e) { console.warn('[scraper] Buscar:', e.message); }

  await page.waitForTimeout(3000);

  // Try clicking "Resultados" radio/tab/button to show match results
  try {
    const resultadosBtn = await page.$(
      'input[type=radio][value*="result" i], input[type=radio][value*="partido" i], ' +
      'button:has-text("Resultados"), a:has-text("Resultados"), ' +
      'label:has-text("Resultados"), [data-tab*="result" i]'
    );
    if (resultadosBtn) {
      console.log('[scraper] Encontrado botón Resultados, haciendo click...');
      await resultadosBtn.click();
      await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Also try radio buttons (the page has 2 radio inputs)
    const radios = await page.$$('input[type=radio]');
    for (const radio of radios) {
      const val   = await radio.getAttribute('value') || '';
      const label = await page.evaluate(el => {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        return lbl ? lbl.textContent.trim() : '';
      }, radio);
      console.log(`[scraper] Radio: value="${val}" label="${label}"`);
      if (/result|partido|calend/i.test(val + label)) {
        await radio.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
  } catch (e) { console.warn('[scraper] Resultados tab:', e.message); }

  await page.waitForTimeout(2000);

  // Extract partidos from DOM tables
  const domPartidos = await page.evaluate(() => {
    const partidos = [];
    // Look for match/result rows
    document.querySelectorAll('table').forEach(table => {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim());
        // A partido row typically has: fecha, local, resultado (X-X), visitante, pabellon
        if (cells.length >= 3) {
          const scoreCell = cells.find(c => /^\d-\d$|^\d\s*-\s*\d$/.test(c.trim()));
          if (scoreCell) {
            const scoreIdx = cells.indexOf(scoreCell);
            partidos.push({
              local:     cells[scoreIdx - 1] || '',
              resultado: scoreCell.replace(/\s/g, ''),
              visitante: cells[scoreIdx + 1] || '',
              jugado:    true,
              fecha:     cells[0] || '',
            });
          }
        }
      });
    });
    // Also try div-based layouts
    document.querySelectorAll('.partido, .match, .encuentro, .resultado-row, [class*="partido"], [class*="encuentro"]').forEach(el => {
      const teams = el.querySelectorAll('.equipo, .team, [class*="equipo"], [class*="local"], [class*="visitante"]');
      const score = el.querySelector('.resultado, .score, [class*="resultado"], [class*="score"]');
      if (teams.length >= 2 && score) {
        partidos.push({
          local:     teams[0].textContent.trim(),
          resultado: score.textContent.trim().replace(/\s/g, ''),
          visitante: teams[teams.length - 1].textContent.trim(),
          jugado:    /\d-\d/.test(score.textContent),
        });
      }
    });
    return partidos;
  });

  if (domPartidos.length > 0) {
    console.log(`[scraper] ✓ ${domPartidos.length} partidos extraídos del DOM`);
    partidosData.push(...domPartidos);
  }

  // Save all JSON URLs for debug
  fs.writeFileSync(path.join(DATA_DIR, 'debug_api_log.json'), JSON.stringify(allJsonUrls, null, 2));
  console.log('[scraper] URLs JSON capturadas:', allJsonUrls.join('\n'));
  console.log('[scraper] Partidos capturados vía API:', partidosData.filter(p => !p._fromDOM).length);
  console.log('[scraper] Partidos capturados vía DOM:', domPartidos.length);

  // Screenshot
  await page.screenshot({ path: path.join(DATA_DIR, 'debug_screenshot_after.png'), fullPage: true });

  await browser.close();
  return partidosData;
}

// ─── Main export ──────────────────────────────────────────────────────────────
async function captureCompetitionData() {
  const [clasifRaw, jornadasRaw, partidos] = await Promise.allSettled([
    getClasificacion(),
    getJornadas(),
    getPartidosViaPlaywright(),
  ]);

  return {
    clasificacion: clasifRaw.status === 'fulfilled' ? clasifRaw.value : [],
    jornadas:      jornadasRaw.status === 'fulfilled' ? jornadasRaw.value : [],
    partidos:      partidos.status === 'fulfilled' ? partidos.value : [],
  };
}

// ─── Normalise ────────────────────────────────────────────────────────────────
function normalizeClasificacion(raw) {
  const src = Array.isArray(raw.clasificacion) ? raw.clasificacion : (raw.tabla ? raw.tabla : []);
  return {
    tabla: src.map((r, i) => ({
      pos:    parseInt(r.posicion || r.pos) || (i + 1),
      equipo: r.nombre || r.equipo || '',
      pj:     parseInt(r.jugados  || r.pj)  || 0,
      pg:     parseInt(r.ganados  || r.pg)  || 0,
      pp:     parseInt(r.perdidos || r.pp)  || 0,
      sg:     parseInt(r.sets_a_favor   || r.sg) || null,
      sp:     parseInt(r.sets_en_contra || r.sp) || null,
      pf:     parseInt(r.puntos_a_favor   || r.pf) || null,
      pc:     parseInt(r.puntos_en_contra || r.pc) || null,
      pts:    parseInt(r.puntos  || r.pts) || 0,
    })),
  };
}

function normalizeResultados(raw) {
  const jornadas = (raw.jornadas || []).map(j => ({
    num:   j.id    || j.num || '',
    label: `Jornada ${j.numero || j.num || ''}`,
    fecha: j.fecha || '',
  }));
  const partidos = (raw.partidos || []).map(p => {
    const sLocal = p.sets_local ?? p.setsLocal ?? p.setsEquipoLocal ?? null;
    const sVis   = p.sets_visitante ?? p.setsVisitante ?? p.setsEquipoVisitante ?? null;
    const jugado = sLocal !== null && sVis !== null;
    const resultado = jugado ? `${sLocal}-${sVis}` : (p.hora || '–');
    return {
      local:     p.equipoLocalNombre || p.nombreEquipoLocal || p.equipo_local || p.local || '',
      visitante: p.equipoVisitanteNombre || p.nombreEquipoVisitante || p.equipo_visitante || p.visitante || '',
      resultado,
      jugado,
      fecha: p.fecha || '',
      hora:  p.hora  || '',
      campo: p.pabellon || p.campo || '',
      jornada: p.jornadaId || p.jornada_id || '',
    };
  });
  return { partidos, jornadas, jornada_actual: null };
}

module.exports = { captureCompetitionData, normalizeClasificacion, normalizeResultados };
