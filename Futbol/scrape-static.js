// Futbol/scrape-static.js — run by GitHub Actions to generate static JSON
'use strict';

const fs   = require('fs');
const path = require('path');
const { getClasificacion, getResultados, getGoleadores } = require('./scraper.js');

const COMPETICION_ID = '24037779';
const GRUPO_ID       = '24037790';
const DATA_DIR       = path.join(__dirname, 'data');

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Fetching clasificacion...');
  const clasif = await getClasificacion(GRUPO_ID, COMPETICION_ID);
  fs.writeFileSync(path.join(DATA_DIR, 'clasificacion.json'), JSON.stringify(clasif));

  console.log('Fetching resultados (all jornadas)...');
  const result = await getResultados(GRUPO_ID, COMPETICION_ID);
  fs.writeFileSync(path.join(DATA_DIR, 'resultados.json'), JSON.stringify(result));

  // Also fetch each individual jornada
  for (const j of result.jornadas || []) {
    const jResult = await getResultados(GRUPO_ID, COMPETICION_ID, j.num);
    fs.writeFileSync(
      path.join(DATA_DIR, `resultados_j${j.num}.json`),
      JSON.stringify(jResult)
    );
    console.log(`  Jornada ${j.num} OK`);
  }

  console.log('Fetching goleadores...');
  const goles = await getGoleadores(GRUPO_ID, COMPETICION_ID);
  fs.writeFileSync(path.join(DATA_DIR, 'goleadores.json'), JSON.stringify(goles));

  console.log('Done. Files written to Futbol/data/');
}

main().catch(e => { console.error(e); process.exit(1); });
