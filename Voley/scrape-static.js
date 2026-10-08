// Voley/scrape-static.js — run by GitHub Actions to generate static JSON
'use strict';

const fs   = require('fs');
const path = require('path');
const { captureCompetitionData, normalizeClasificacion, normalizeResultados } = require('./scraper.js');

const DATA_DIR = path.join(__dirname, 'data');

async function retry(fn, label, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      console.warn(`  ${label} intento ${i} fallido: ${e.message}`);
      if (i < attempts) await new Promise(r => setTimeout(r, 4000));
      else throw e;
    }
  }
}

function write(name, data) {
  const file = path.join(DATA_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${name}`);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Scraping fmvoley.com con Playwright...');
  const raw = await retry(() => captureCompetitionData(), 'scrape');

  const clasif    = normalizeClasificacion(raw.clasificacion);
  const resultados = normalizeResultados(raw.resultados);

  write('clasificacion.json', clasif);
  write('resultados.json', resultados);

  // Per-jornada files (best effort from what we captured)
  const todosPartidos = resultados.partidos || [];
  const jornadaMap = new Map();
  for (const j of resultados.jornadas || []) {
    jornadaMap.set(j.num, { ...resultados, partidos: [], jornadas: resultados.jornadas });
  }
  // Write all-parties file for H2H
  write('todos_partidos.json', todosPartidos);

  // Per-jornada stubs (empty placeholder files that will be filled when scraper runs next)
  for (const j of resultados.jornadas || []) {
    const file = `resultados_j${j.num}.json`;
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      write(file, { ...resultados, partidos: [] });
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
