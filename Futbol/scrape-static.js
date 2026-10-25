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
  if (clasif.tabla && clasif.tabla.length > 0) {
    fs.writeFileSync(path.join(DATA_DIR, 'clasificacion.json'), JSON.stringify(clasif));
  } else {
    console.log('Clasificacion vacía de la API — manteniendo datos anteriores');
  }

  // resultados.json: jornada_actual (de resultados-y-jornadas)
  console.log('Fetching resultados...');
  const result = await retry(() => getResultados(GRUPO_ID, COMPETICION_ID), 'resultados');
  const jornadaActual = parseInt(result.jornada_actual) || 0;

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
    let partidos = j.partidos;

    // Para jornadas ya jugadas, obtener resultados reales del endpoint de resultados
    if (parseInt(j.num) <= jornadaActual) {
      try {
        const jRes = await retry(() => getResultados(GRUPO_ID, COMPETICION_ID, j.num), `resultados_j${j.num}`);
        if (jRes.partidos && jRes.partidos.length > 0) {
          // Combinar por nombre de equipo (no por índice — el orden puede diferir)
          const norm = s => (s || '').toUpperCase().trim();
          partidos = partidos.map(cp => {
            const rp = jRes.partidos.find(r =>
              norm(r.local) === norm(cp.local) && norm(r.visitante) === norm(cp.visitante)
            );
            if (rp && rp.jugado) return { ...cp, resultado: rp.resultado, jugado: true };
            return cp;
          });
          console.log(`  Jornada ${j.num} OK con resultados (${partidos.filter(p => p.jugado).length} jugados)`);
        }
      } catch (e) {
        console.warn(`  Jornada ${j.num}: no se pudieron obtener resultados, usando calendario`);
      }
    } else {
      console.log(`  Jornada ${j.num} OK (${partidos.length} partidos)`);
    }

    const jResult = { ...resultadosBase, jornadas: jornadasConFecha, partidos };
    fs.writeFileSync(path.join(DATA_DIR, `resultados_j${j.num}.json`), JSON.stringify(jResult));
    todosPartidos.push(...partidos);
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
