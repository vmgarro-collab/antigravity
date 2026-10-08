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
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2));
  console.log(`  ✓ ${name}`);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const raw = await retry(() => captureCompetitionData(), 'scrape');

  const clasif     = normalizeClasificacion(raw);
  const resultados = normalizeResultados(raw);

  write('clasificacion.json', clasif);
  write('resultados.json', resultados);
  write('todos_partidos.json', resultados.partidos || []);

  // Per-jornada files
  for (const j of resultados.jornadas || []) {
    const filePath = path.join(DATA_DIR, `resultados_j${j.num}.json`);
    const jornadaPartidos = resultados.partidos.filter(p =>
      String(p.jornada) === String(j.num) || String(p.jornadaId) === String(j.num)
    );
    // Only write if we have data or the file doesn't exist yet
    if (jornadaPartidos.length > 0 || !fs.existsSync(filePath)) {
      write(`resultados_j${j.num}.json`, { ...resultados, partidos: jornadaPartidos });
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
