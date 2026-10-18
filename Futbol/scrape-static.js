// Futbol/scrape-static.js — run by GitHub Actions to generate static JSON
'use strict';

const fs   = require('fs');
const path = require('path');
const { getClasificacion, getResultados, getCalendario, getGoleadores } = require('./scraper.js');

const COMPETICION_ID = '26738141';
const GRUPO_ID       = '26738150';
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

  // resultados.json: jornada_actual (de resultados-y-jornadas)
  console.log('Fetching resultados...');
  const result = await retry(() => getResultados(GRUPO_ID, COMPETICION_ID), 'resultados');

  // calendario: todas las jornadas con partidos desde /competicion/calendario
  console.log('Fetching calendario (todas las jornadas)...');
  const calendario = await retry(() => getCalendario(GRUPO_ID, COMPETICION_ID), 'calendario');

  const jornadasConFecha = calendario.map(j => ({ num: j.num, label: j.label, fecha: j.fecha }));
  const resultadosBase = {
    competicion:    result.competicion,
    grupo:          result.grupo,
    jornada_actual: result.jornada_actual,
    jornadas:       jornadasConFecha,
    partidos:       [],
  };
  fs.writeFileSync(path.join(DATA_DIR, 'resultados.json'), JSON.stringify(resultadosBase));

  const todosPartidos = [];
  for (const j of calendario) {
    const jResult = {
      ...resultadosBase,
      jornadas: jornadasConFecha,
      partidos: j.partidos,
    };
    fs.writeFileSync(
      path.join(DATA_DIR, `resultados_j${j.num}.json`),
      JSON.stringify(jResult)
    );
    todosPartidos.push(...j.partidos);
    console.log(`  Jornada ${j.num} OK (${j.partidos.length} partidos)`);
  }
  fs.writeFileSync(path.join(DATA_DIR, 'todos_partidos.json'), JSON.stringify(todosPartidos));

  console.log('Fetching goleadores...');
  const goles = await retry(() => getGoleadores(GRUPO_ID, COMPETICION_ID), 'goleadores');
  if (goles.goleadores && goles.goleadores.length > 0) {
    fs.writeFileSync(path.join(DATA_DIR, 'goleadores.json'), JSON.stringify(goles));
  } else {
    console.log('Goleadores vacíos de la API — manteniendo datos anteriores');
  }

  console.log('Done. Files written to Futbol/data/');
}

main().catch(e => { console.error(e); process.exit(1); });
