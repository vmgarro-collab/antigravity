// Futbol/scrape-static.js — run by GitHub Actions to generate static JSON
'use strict';

const fs   = require('fs');
const path = require('path');
const { getClasificacion, getResultados, getGoleadores } = require('./scraper.js');

const COMPETICION_ID = '24037779';
const GRUPO_ID       = '24037790';
const DATA_DIR       = path.join(__dirname, 'data');

async function retry(fn, label, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      console.warn(`  ${label} intento ${i} fallido: ${e.message}`);
      if (i < attempts) await new Promise(r => setTimeout(r, 3000));
      else throw e;
    }
  }
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Fetching clasificacion...');
  const clasif = await retry(() => getClasificacion(GRUPO_ID, COMPETICION_ID), 'clasificacion');
  fs.writeFileSync(path.join(DATA_DIR, 'clasificacion.json'), JSON.stringify(clasif));

  console.log('Fetching resultados (all jornadas)...');
  const result = await retry(() => getResultados(GRUPO_ID, COMPETICION_ID), 'resultados');
  fs.writeFileSync(path.join(DATA_DIR, 'resultados.json'), JSON.stringify(result));

  // Fetch each individual jornada — skip on error, keep existing file
  for (const j of result.jornadas || []) {
    const filePath = path.join(DATA_DIR, `resultados_j${j.num}.json`);
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const jResult = await getResultados(GRUPO_ID, COMPETICION_ID, j.num);
        fs.writeFileSync(filePath, JSON.stringify(jResult));
        console.log(`  Jornada ${j.num} OK`);
        ok = true;
      } catch (e) {
        console.warn(`  Jornada ${j.num} intento ${attempt} fallido: ${e.message}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 3000));
      }
    }
    if (!ok) console.warn(`  Jornada ${j.num} omitida (se mantiene fichero anterior si existe)`);
  }

  console.log('Fetching goleadores...');
  const goles = await retry(() => getGoleadores(GRUPO_ID, COMPETICION_ID), 'goleadores');
  fs.writeFileSync(path.join(DATA_DIR, 'goleadores.json'), JSON.stringify(goles));

  console.log('Done. Files written to Futbol/data/');
}

main().catch(e => { console.error(e); process.exit(1); });
