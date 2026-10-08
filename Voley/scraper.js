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

// ─── Try direct API calls first (faster) ─────────────────────────────────────
const FASE_ID  = '14998';
const COMP_TEMP_ID = '23547';
const COMP_ID  = '1134';

async function tryFetchPartidos() {
  const candidateUrls = [
    `${API}/getPartidosGrupo?grupoId=${GRUPO_ID}`,
    `${API}/getPartidosGrupo?grupoId=${GRUPO_ID}&faseId=${FASE_ID}`,
    `${API}/getEncuentrosGrupo?grupoId=${GRUPO_ID}`,
    `${API}/getResultadosGrupo?grupoId=${GRUPO_ID}`,
    `${API}/getCalendarioGrupo?grupoId=${GRUPO_ID}`,
    `${API}/getJornadaPartidos?grupoId=${GRUPO_ID}`,
    `${API}/getPartidosFase?faseId=${FASE_ID}`,
    `${API}/getPartidos?grupoId=${GRUPO_ID}`,
    `${API}/getPartidos?faseId=${FASE_ID}&grupoId=${GRUPO_ID}`,
    `${API}/getPartidosCompeticion?competicionTemporadaId=${COMP_TEMP_ID}&grupoId=${GRUPO_ID}`,
    `${API}/getEncuentros?grupoId=${GRUPO_ID}`,
    `${API}/getCalendario?grupoId=${GRUPO_ID}`,
    `${API}/getResultados?grupoId=${GRUPO_ID}`,
  ];
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VoleyApp/1.0)' } });
      if (!res.ok) { console.log(`[api] ${res.status} ${url}`); continue; }
      const data = await res.json();
      const arr = data.content || data.partidos || data.encuentros || data.matches || data.calendario || [];
      if (Array.isArray(arr) && arr.length > 0) {
        console.log(`[api] ✓ FOUND partidos en: ${url} (${arr.length} registros)`);
        return arr;
      }
      console.log(`[api] 200 pero vacío: ${url}`, JSON.stringify(data).slice(0, 120));
    } catch (e) {
      console.log(`[api] Error ${url}: ${e.message}`);
    }
  }
  return null; // no luck, fall through to Playwright
}

async function tryFetchPartidosPorJornada(jornadas) {
  const all = [];
  // Try first jornada to find the right endpoint pattern
  const firstJornada = jornadas[0];
  const jornadaId = firstJornada.id || firstJornada.num || firstJornada.jornadaId;
  const patterns = [
    id => `${API}/getPartidosByJornada?jornadaId=${id}`,   // ← endpoint real descubierto
    id => `${API}/getPartidosJornada?jornadaId=${id}`,
    id => `${API}/getEncuentrosJornada?jornadaId=${id}`,
    id => `${API}/getPartidos?jornadaId=${id}`,
    id => `${API}/getResultadosJornada?jornadaId=${id}`,
    id => `${API}/getJornadaPartidos?jornadaId=${id}`,
  ];

  let workingPattern = null;
  for (const pat of patterns) {
    const url = pat(jornadaId);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.log(`[api-j] ${res.status} ${url}`); continue; }
      const data = await res.json();
      const arr = data.content || data.partidos || data.encuentros || [];
      if (Array.isArray(arr) && arr.length > 0) { workingPattern = pat; console.log(`[api-j] ✓ Patrón: ${url}`); break; }
      if (Array.isArray(arr)) console.log(`[api-j] Vacío: ${url}`);
    } catch (_) {}
  }
  if (!workingPattern) return null;

  // Fetch all jornadas using the working pattern
  for (const j of jornadas) {
    const jid = j.id || j.num || j.jornadaId;
    try {
      const res = await fetch(workingPattern(jid), { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      const arr = (data.content || data.partidos || data.encuentros || []).map(p => ({ ...p, jornadaId: jid }));
      all.push(...arr);
    } catch (_) {}
  }
  return all.length > 0 ? all : null;
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

  // Helper: select a value in a bootstrap-select or native select, wait for API call
  async function selectAndWait(id, value, waitMs = 2500) {
    await page.evaluate(([id, value]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = value;
      // bootstrap-select API
      if (window.$ && window.$(el).selectpicker) {
        window.$(el).selectpicker('val', value);
      }
      // fire both native and jQuery change events
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.$) window.$(el).trigger('change');
    }, [id, value]);
    await page.waitForTimeout(waitMs);
  }

  // Step-by-step selection with correct IDs
  console.log('[scraper] Seleccionando Federadas...');
  await selectAndWait('comboTipoCompeticion', '1', 2000);

  console.log('[scraper] Seleccionando Infantil Femenino...');
  await selectAndWait('comboCompeticiones', '1134', 2000);

  console.log('[scraper] Seleccionando 2ª Div. Aut. Zonal...');
  await selectAndWait('comboDivisiones', '23547', 2000);

  console.log('[scraper] Seleccionando Fase Liga...');
  await selectAndWait('comboFases', '14998', 2000);

  console.log('[scraper] Seleccionando Grupo A...');
  await selectAndWait('comboGrupos', '34097', 2000);

  // Click Buscar — handle both AJAX and full-page-reload cases
  try {
    // Get all "Buscar" buttons and click the last (real search one)
    const buscarBtns = await page.$$('button:has-text("Buscar"), input[type=submit][value="Buscar"]');
    console.log(`[scraper] Encontrados ${buscarBtns.length} botones Buscar`);
    const buscar = buscarBtns[buscarBtns.length - 1];
    if (buscar) {
      // Wait for either navigation or network idle
      await Promise.race([
        buscar.click().then(() => page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 })),
        buscar.click().then(() => page.waitForNetworkIdle({ timeout: 15000 })),
      ]).catch(() => {});
    }
  } catch (e) { console.warn('[scraper] Buscar:', e.message); }
  // Also try submitting the form directly
  try {
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  } catch (_) {}

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
  // Run clasificacion + jornadas in parallel; try direct API for partidos first
  const [clasifRaw, jornadasRaw] = await Promise.allSettled([
    getClasificacion(),
    getJornadas(),
  ]);

  console.log('[scraper] Intentando endpoints directos para partidos...');
  let partidos = await tryFetchPartidos();

  if (!partidos) {
    // Try fetching partidos per jornada (since we have jornadas)
    const jornadas = jornadasRaw.status === 'fulfilled' ? jornadasRaw.value : [];
    if (jornadas.length > 0) {
      console.log(`[scraper] Intentando partidos por jornada (${jornadas.length} jornadas)...`);
      partidos = await tryFetchPartidosPorJornada(jornadas);
    }
  }

  if (!partidos) {
    console.log('[scraper] Sin datos directos. Lanzando Playwright...');
    try { partidos = await getPartidosViaPlaywright(); } catch (e) { partidos = []; }
  }

  return {
    clasificacion: clasifRaw.status === 'fulfilled' ? clasifRaw.value : [],
    jornadas:      jornadasRaw.status === 'fulfilled' ? jornadasRaw.value : [],
    partidos:      partidos || [],
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
  const jornadas = (raw.jornadas || []).map((j, i) => ({
    num:   j.id    || j.num || '',
    label: `Jornada ${j.numero || j.num || (i + 1)}`,
    fecha: j.fecha || '',
  }));
  const partidos = (raw.partidos || []).map(p => {
    const sLocal = p.sets_local ?? p.setsLocal ?? p.setsEquipoLocal ?? null;
    const sVis   = p.sets_visitante ?? p.setsVisitante ?? p.setsEquipoVisitante ?? null;
    const jugado = p.finalizado === true || (sLocal !== null && sVis !== null && (Number(sLocal) + Number(sVis)) > 0);
    const resultado = jugado ? `${sLocal}-${sVis}` : (p.hora || '–');
    return {
      local:     p.equipo_local || p.equipoLocalNombre || p.nombreEquipoLocal || p.local || '',
      visitante: p.equipo_visitante || p.equipoVisitanteNombre || p.nombreEquipoVisitante || p.visitante || '',
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
