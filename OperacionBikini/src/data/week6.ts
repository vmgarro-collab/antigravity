import type { Week, ShoppingList } from '../types'

// SEMANA 6 — 8-18 JUNIO 2026
// Tren superior S2 al 85% (press militar suave si AC OK)
// TEST 10K jueves 11
// Semana 3 pre-Roquetas (15-18):
//   Lun 15: tren superior + Z2 corto 30 min (verse seco inicio)
//   Mar 16: tren inferior ligero + core (verse seco día 2)
//   Mié 17: tren superior LIGERO congestión + cero sal (verse seco día 3)
//   Jue 18: ROQUETAS

export const week6: Week = {
  weekNumber: 6,
  days: [

    // LUNES 8 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-08',
      dayName: 'Lunes',
      estimatedDailyKcal: 1500,
      alcoholQuota: 0,
      specialNote: 'Semana 2 al 85%. Introducir press militar suave si AC responde bien esta semana.',
      blocks: [
        {
          id: 'workout-lun-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Subir intensidad. Press militar: solo si AC sin molestias, poco peso, rango corto.',
          checked: false,
          subItems: [
            { id: 'w-lun-6-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-lun-6-2', text: 'Dominadas: 4 series máx reps (mejorar vs semana 1)', checked: false },
            { id: 'w-lun-6-3', text: 'Press pecho mancuernas 4 kg: 4 × 20 (tempo 3s bajada)', checked: false },
            { id: 'w-lun-6-4', text: 'Aperturas mancuernas 4 kg: 3 × 15-20', checked: false },
            { id: 'w-lun-6-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-lun-6-6', text: 'Elevaciones laterales 4 kg: 3 × 15-20', checked: false },
            { id: 'w-lun-6-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-lun-6-8', text: 'Face pulls: 3 × 20', checked: false },
            { id: 'w-lun-6-9', text: 'Press militar mancuernas (SOLO si AC OK): 3 × 12, poco peso', checked: false },
            { id: 'w-lun-6-10', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado + crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-lun-6', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-lun-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-lun-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-lun-6-3', text: '1 fruta', checked: false },
            { id: 'des-lun-6-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-lun-6', type: 'lunch',
          title: 'Pollo plancha con patata y verdura',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-lun-6-1', text: '160 g pechuga pollo plancha', checked: false },
            { id: 'lun-lun-6-2', text: '1 patata mediana', checked: false },
            { id: 'lun-lun-6-3', text: 'Espárragos + cebolla + tomate salteados', checked: false },
            { id: 'lun-lun-6-4', text: '1 cda aceite oliva + ajo + limón', checked: false },
            { id: 'lun-lun-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-lun-6', type: 'dinner',
          title: 'Merluza al vapor con brócoli',
          cookingMethod: 'vapor',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-lun-6-1', text: '200 g merluza al vapor', checked: false },
            { id: 'din-lun-6-2', text: 'Brócoli + judías verdes al vapor', checked: false },
            { id: 'din-lun-6-3', text: '1 patata pequeña', checked: false },
            { id: 'din-lun-6-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-lun-6-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MARTES 9 JUNIO — Z2 45 min
    {
      date: '2026-06-09',
      dayName: 'Martes',
      estimatedDailyKcal: 1300,
      alcoholQuota: 0,
      blocks: [
        {
          id: 'workout-mar-6', type: 'workout',
          title: 'Carrera Z2 — 45 min',
          description: 'FC < 145 ppm, ritmo libre ~5:40/km. 5 min más que semana 1.',
          checked: false,
          subItems: [
            { id: 'w-mar-6-1', text: '5 min calentamiento trote suave', checked: false },
            { id: 'w-mar-6-2', text: '35 min Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-mar-6-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
          ],
        },
        {
          id: 'breakfast-mar-6', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café (ayuno hasta la comida).',
          checked: false,
        },
        {
          id: 'lunch-mar-6', type: 'lunch',
          title: 'Bowl de pollo y arroz',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-mar-6-1', text: '150 g pechuga pollo plancha', checked: false },
            { id: 'lun-mar-6-2', text: '50 g arroz integral en seco', checked: false },
            { id: 'lun-mar-6-3', text: 'Mix hojas verdes + tomate + pepino + cebolla', checked: false },
            { id: 'lun-mar-6-4', text: '4-5 aceitunas verdes', checked: false },
            { id: 'lun-mar-6-5', text: '1 cda aceite oliva + vinagre + orégano', checked: false },
            { id: 'lun-mar-6-6', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mar-6', type: 'dinner',
          title: 'Pavo asado con verdura y arroz',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-mar-6-1', text: '200 g pechuga pavo plancha', checked: false },
            { id: 'din-mar-6-2', text: 'Verdura asada (calabacín, pimiento)', checked: false },
            { id: 'din-mar-6-3', text: '50 g arroz integral', checked: false },
            { id: 'din-mar-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'din-mar-6-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 10 JUNIO — Fuerza tren inferior
    {
      date: '2026-06-10',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1500,
      alcoholQuota: 0,
      specialNote: 'Mañana test 10K. No agotar las piernas hoy.',
      blocks: [
        {
          id: 'workout-mie-6', type: 'workout',
          title: 'Fuerza tren inferior + core (45 min)',
          description: 'Mañana test 10K: sin agotarte hoy.',
          checked: false,
          subItems: [
            { id: 'w-mie-6-1', text: 'Calentamiento caderas 5 min', checked: false },
            { id: 'w-mie-6-2', text: 'Sentadilla mancuernas 4 kg a los lados: 4 × 20', checked: false },
            { id: 'w-mie-6-3', text: 'Zancadas alternas: 4 × 14 por pierna', checked: false },
            { id: 'w-mie-6-4', text: 'Sentadilla búlgara: 4 × 12 por pierna', checked: false },
            { id: 'w-mie-6-5', text: 'Puente glúteos a una pierna: 3 × 12 por pierna', checked: false },
            { id: 'w-mie-6-6', text: 'Elevaciones gemelos: 4 × 25', checked: false },
            { id: 'w-mie-6-7', text: 'Russian twists 3 × 20 + plancha lateral 3 × 40s (flotadores)', checked: false },
            { id: 'w-mie-6-8', text: 'Crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-mie-6', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-mie-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-mie-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-mie-6-3', text: '1 fruta', checked: false },
            { id: 'des-mie-6-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-mie-6', type: 'lunch',
          title: 'Ternera magra con patata y verdura',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-mie-6-1', text: '180 g ternera magra plancha', checked: false },
            { id: 'lun-mie-6-2', text: '1 patata mediana', checked: false },
            { id: 'lun-mie-6-3', text: 'Verdura abundante salteada', checked: false },
            { id: 'lun-mie-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-mie-6-5', text: '1 fruta + 1 yogur 0% de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mie-6', type: 'dinner',
          title: 'Tortilla de espinacas y champiñones',
          cookingMethod: 'plancha',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-mie-6-1', text: '3 huevos + 2 claras', checked: false },
            { id: 'din-mie-6-2', text: 'Espinacas + champiñones + cebolla + ajo', checked: false },
            { id: 'din-mie-6-3', text: '2 rebanadas pan integral', checked: false },
            { id: 'din-mie-6-4', text: '1 cda aceite oliva + nuez moscada', checked: false },
            { id: 'din-mie-6-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 11 JUNIO — TEST 10K CRONOMETRADO
    {
      date: '2026-06-11',
      dayName: 'Jueves',
      estimatedDailyKcal: 1600,
      alcoholQuota: 0,
      specialNote: '🎯 DÍA DEL TEST 10K. Sal fresco (déficit calórico limita velocidad punta — no buscar récord, es para calibrar). Desayuno 2-2,5h antes.',
      blocks: [
        {
          id: 'weighin-jue-6', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'pre-match-jue-6', type: 'pre_match',
          title: 'Protocolo pre-test 10K',
          checked: false,
          subItems: [
            { id: 'pre-jue-6-1', text: '2-2,5h antes: desayuno (ver abajo)', checked: false },
            { id: 'pre-jue-6-2', text: '30 min antes: 300-400 ml agua a sorbos', checked: false },
            { id: 'pre-jue-6-3', text: 'Calentamiento: 10 min trote suave + 4-5 acelerones 20s', checked: false },
            { id: 'pre-jue-6-4', text: 'Referencia: 4:30/km = sub-45 · 4:35/km ≈ 45:50 · 4:40/km ≈ 46:40', checked: false },
          ],
        },
        {
          id: 'breakfast-jue-6', type: 'breakfast',
          title: 'Desayuno pre-test (2-2,5h antes)',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-jue-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-jue-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-jue-6-3', text: '1 plátano', checked: false },
            { id: 'des-jue-6-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'workout-jue-6', type: 'workout',
          title: '🏃 TEST 10K CRONOMETRADO',
          description: 'A tope. Ritmo constante desde el km 1. Anotar tiempo + ritmo por km.',
          checked: false,
          subItems: [
            { id: 'w-jue-6-1', text: '10 min calentamiento trote + acelerones', checked: false },
            { id: 'w-jue-6-2', text: 'TEST 10K a tope — anotar tiempo final', checked: false },
            { id: 'w-jue-6-3', text: '10 min trote suave + estiramientos completos', checked: false },
            { id: 'w-jue-6-4', text: '→ Anotar el tiempo en las notas del día', checked: false },
          ],
        },
        {
          id: 'post-match-jue-6', type: 'post_match_strategy',
          title: 'Post-test — Ventana de recuperación',
          description: 'Comer dentro de 60 min post-test.',
          checked: false,
          do: [
            '500 ml agua en los próximos 30 min',
            'Comer dentro de 60 min del test',
          ],
        },
        {
          id: 'lunch-jue-6', type: 'lunch',
          title: 'Comida post-test — Recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-jue-6-1', text: '180 g pollo o ternera', checked: false },
            { id: 'lun-jue-6-2', text: '70 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-jue-6-3', text: 'Verdura abundante', checked: false },
            { id: 'lun-jue-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-jue-6-5', text: '1 fruta + 1 yogur 0%', checked: false },
          ],
        },
        {
          id: 'dinner-jue-6', type: 'dinner',
          title: 'Cena ligera post-esfuerzo',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-jue-6-1', text: '200 g salmón al horno o merluza plancha', checked: false },
            { id: 'din-jue-6-2', text: 'Ensalada + pepino + apio', checked: false },
            { id: 'din-jue-6-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // VIERNES 12 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-12',
      dayName: 'Viernes',
      estimatedDailyKcal: 1500,
      alcoholQuota: 1,
      specialNote: 'Segunda sesión tren superior S2. Si comida fuera: proteína + verdura, máx 1 copa.',
      blocks: [
        {
          id: 'workout-vie-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Segunda sesión S2. Misma rutina del lunes.',
          checked: false,
          subItems: [
            { id: 'w-vie-6-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-vie-6-2', text: 'Dominadas: 4 series máx reps', checked: false },
            { id: 'w-vie-6-3', text: 'Press pecho mancuernas 4 kg: 4 × 20 (tempo 3s)', checked: false },
            { id: 'w-vie-6-4', text: 'Aperturas mancuernas 4 kg: 3 × 15-20', checked: false },
            { id: 'w-vie-6-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-vie-6-6', text: 'Elevaciones laterales 4 kg: 3 × 15-20', checked: false },
            { id: 'w-vie-6-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15', checked: false },
            { id: 'w-vie-6-8', text: 'Face pulls: 3 × 20', checked: false },
            { id: 'w-vie-6-9', text: 'Press militar (si AC OK): 3 × 12', checked: false },
            { id: 'w-vie-6-10', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado + crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-vie-6', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-vie-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-vie-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-vie-6-3', text: '1 fruta', checked: false },
            { id: 'des-vie-6-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-vie-6', type: 'lunch',
          title: 'Comida (fuera o en casa)',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-vie-6-1', text: 'Proteína magra plancha (pescado o carne)', checked: false },
            { id: 'lun-vie-6-2', text: 'Verdura o ensalada abundante', checked: false },
            { id: 'lun-vie-6-3', text: '1 patata o 50 g arroz', checked: false },
            { id: 'lun-vie-6-4', text: 'Si fuera: máx 1 copa vino · sin pan abundante', checked: false },
          ],
        },
        {
          id: 'dinner-vie-6', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vie-6-1', text: '200 g merluza o lubina plancha', checked: false },
            { id: 'din-vie-6-2', text: 'Ensalada o verdura al vapor', checked: false },
            { id: 'din-vie-6-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vie-6-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 13 JUNIO — Rodaje largo Z2 suave
    {
      date: '2026-06-13',
      dayName: 'Sábado',
      estimatedDailyKcal: 1600,
      alcoholQuota: 2,
      specialNote: 'Rodaje largo semana 2. Suave por recuperación del test del jueves.',
      blocks: [
        {
          id: 'workout-sab-6', type: 'workout',
          title: 'Rodaje largo Z2 suave — 55 min (post-test)',
          description: 'Suave. FC < 145 ppm, ritmo cómodo.',
          checked: false,
          subItems: [
            { id: 'w-sab-6-1', text: 'Pre: 1 plátano + 500 ml agua', checked: false },
            { id: 'w-sab-6-2', text: '55 min Z2 suave (FC < 145 ppm, ritmo cómodo)', checked: false },
            { id: 'w-sab-6-3', text: 'Post: estiramientos completos', checked: false },
          ],
        },
        {
          id: 'breakfast-sab-6', type: 'breakfast',
          title: 'Desayuno pre-largo',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'des-sab-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-sab-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-sab-6-3', text: '15 g frutos secos', checked: false },
            { id: 'des-sab-6-4', text: '1 plátano', checked: false },
            { id: 'des-sab-6-5', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-sab-6', type: 'lunch',
          title: 'Comida post-largo — recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-sab-6-1', text: '200 g proteína (pollo o pescado)', checked: false },
            { id: 'lun-sab-6-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-sab-6-3', text: '80 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-sab-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-sab-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-sab-6', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-sab-6-1', text: '200 g pescado blanco plancha o crema de verduras', checked: false },
            { id: 'din-sab-6-2', text: 'Ensalada', checked: false },
            { id: 'din-sab-6-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // DOMINGO 14 JUNIO — Descanso / fútbol
    {
      date: '2026-06-14',
      dayName: 'Domingo',
      estimatedDailyKcal: 1350,
      alcoholQuota: 1,
      specialNote: 'Descanso. Mañana empieza el protocolo verse seco (lunes 15).',
      blocks: [
        {
          id: 'workout-dom-6', type: 'workout',
          title: 'Fútbol o descanso activo',
          description: 'Sin entreno estructurado.',
          checked: false,
          subItems: [
            { id: 'w-dom-6-1', text: 'Opción A: fútbol (si hay partido)', checked: false },
            { id: 'w-dom-6-2', text: 'Opción B: paseo 45-60 min ritmo cómodo', checked: false },
            { id: 'w-dom-6-3', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-dom-6', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café o huevos + fruta.',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-dom-6-1', text: '2 huevos + 1 reb pan + fruta + café', checked: false },
            { id: 'des-dom-6-2', text: 'O: yogur + muesli + fruta + café', checked: false },
          ],
        },
        {
          id: 'lunch-dom-6', type: 'lunch',
          title: 'Comida equilibrada',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-dom-6-1', text: '180 g proteína', checked: false },
            { id: 'lun-dom-6-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-dom-6-3', text: '60 g arroz integral o 1 patata', checked: false },
            { id: 'lun-dom-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-dom-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-dom-6', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 450,
          checked: false,
          subItems: [
            { id: 'din-dom-6-1', text: 'Tortilla 2 huevos + 2 claras con verdura', checked: false },
            { id: 'din-dom-6-2', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // LUNES 15 JUNIO — VERSE SECO día 1 + tren superior + Z2 corto
    {
      date: '2026-06-15',
      dayName: 'Lunes',
      estimatedDailyKcal: 1400,
      alcoholQuota: 0,
      waterTarget: 14,
      specialNote: '🧂 INICIO VERSE SECO. Sin sal añadida, sin embutidos. Hidratación 3-3,5 L. Cero alcohol hasta Roquetas. HOY: tren superior + Z2 corto 30 min.',
      blocks: [
        {
          id: 'workout-vs1', type: 'workout',
          title: 'Fuerza tren superior + Z2 corto 30 min',
          description: 'Doble sesión ligera. Tren superior primero, Z2 al final del día (o invertir si prefieres).',
          checked: false,
          subItems: [
            { id: 'w-vs1-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-vs1-2', text: 'Dominadas: 3-4 series máx reps', checked: false },
            { id: 'w-vs1-3', text: 'Press pecho mancuernas 4 kg: 3 × 15-20', checked: false },
            { id: 'w-vs1-4', text: 'Aperturas mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-vs1-5', text: 'Remo mancuerna: 3 × 15 por lado', checked: false },
            { id: 'w-vs1-6', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-vs1-7', text: 'Curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-vs1-8', text: 'Core: plancha 3 × 60s + crunch 3 × 20', checked: false },
            { id: 'w-vs1-9', text: '─── Más tarde: Z2 corto 30 min (FC < 145 ppm) ───', checked: false },
          ],
        },
        {
          id: 'breakfast-vs1', type: 'breakfast',
          title: 'Desayuno pre-entreno — SIN sal añadida',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-vs1-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-vs1-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-vs1-3', text: '1 fruta', checked: false },
            { id: 'des-vs1-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-vs1', type: 'lunch',
          title: 'Proteína + verduras diuréticas — SIN sal añadida',
          cookingMethod: 'plancha',
          estimatedKcal: 650,
          checked: false,
          subItems: [
            { id: 'lun-vs1-1', text: '160 g pollo o merluza plancha (sin sal o mínima)', checked: false },
            { id: 'lun-vs1-2', text: 'Espárragos + pepino + apio (diuréticos)', checked: false },
            { id: 'lun-vs1-3', text: '50 g arroz integral', checked: false },
            { id: 'lun-vs1-4', text: '1 cda aceite oliva + limón + especias sin sal', checked: false },
            { id: 'lun-vs1-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vs1', type: 'dinner',
          title: 'Cena ligera — SIN sal',
          cookingMethod: 'plancha',
          estimatedKcal: 450,
          checked: false,
          subItems: [
            { id: 'din-vs1-1', text: '200 g pescado blanco plancha (sin sal)', checked: false },
            { id: 'din-vs1-2', text: 'Ensalada diurética: lechuga + pepino + apio + tomate', checked: false },
            { id: 'din-vs1-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vs1-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MARTES 16 JUNIO — VERSE SECO día 2 + tren inferior ligero + core
    {
      date: '2026-06-16',
      dayName: 'Martes',
      estimatedDailyKcal: 1300,
      alcoholQuota: 0,
      waterTarget: 14,
      specialNote: '🧂 VERSE SECO día 2. Sin sal, sin embutidos, sin alcohol. Verduras diuréticas. HOY: tren inferior ligero + core (flotadores).',
      blocks: [
        {
          id: 'workout-vs2', type: 'workout',
          title: 'Fuerza tren inferior ligero + core (35 min)',
          description: 'Ligero — mañana es la sesión de congestión tren superior. No agotar.',
          checked: false,
          subItems: [
            { id: 'w-vs2-1', text: 'Calentamiento caderas 5 min', checked: false },
            { id: 'w-vs2-2', text: 'Sentadilla mancuernas 4 kg: 3 × 15 (reducir volumen vs habitual)', checked: false },
            { id: 'w-vs2-3', text: 'Zancadas alternas: 3 × 12 por pierna', checked: false },
            { id: 'w-vs2-4', text: 'Puente glúteos a una pierna: 3 × 12 por pierna', checked: false },
            { id: 'w-vs2-5', text: 'Elevaciones gemelos: 3 × 20', checked: false },
            { id: 'w-vs2-6', text: 'Russian twists 3 × 20 + plancha lateral 3 × 40s (flotadores)', checked: false },
            { id: 'w-vs2-7', text: 'Crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-vs2', type: 'breakfast',
          title: 'Desayuno ligero — SIN sal',
          estimatedKcal: 250,
          checked: false,
          subItems: [
            { id: 'des-vs2-1', text: '2 huevos revueltos (sin sal)', checked: false },
            { id: 'des-vs2-2', text: '1 fruta', checked: false },
            { id: 'des-vs2-3', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-vs2', type: 'lunch',
          title: 'Proteína + verduras diuréticas — SIN sal',
          cookingMethod: 'plancha',
          estimatedKcal: 600,
          checked: false,
          subItems: [
            { id: 'lun-vs2-1', text: '160 g pollo o lubina plancha (sin sal)', checked: false },
            { id: 'lun-vs2-2', text: 'Espárragos + apio + pepino al vapor', checked: false },
            { id: 'lun-vs2-3', text: '40 g arroz integral (reducir carbos)', checked: false },
            { id: 'lun-vs2-4', text: '1 cda aceite oliva + limón + hierbas sin sal', checked: false },
            { id: 'lun-vs2-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vs2', type: 'dinner',
          title: 'Cena ligera — SIN sal',
          cookingMethod: 'plancha',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'din-vs2-1', text: '150 g merluza o pavo plancha (sin sal)', checked: false },
            { id: 'din-vs2-2', text: 'Ensalada diurética: lechuga + pepino + apio', checked: false },
            { id: 'din-vs2-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vs2-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 17 JUNIO — VERSE SECO día 3 + última fuerza tren superior (congestión)
    {
      date: '2026-06-17',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1200,
      alcoholQuota: 0,
      waterTarget: 14,
      specialNote: '🧂 VERSE SECO día 3 — CERO SAL. Última sesión tren superior LIGERA (congestión/pump). El pump de hoy + baja retención = mejor versión estética mañana en Roquetas.',
      blocks: [
        {
          id: 'workout-vs3', type: 'workout',
          title: 'Tren superior LIGERO — congestión final (30 min)',
          description: 'No buscar fallo ni peso máximo. Objetivo: pump/congestión para mañana.',
          checked: false,
          subItems: [
            { id: 'w-vs3-1', text: 'Dominadas: 3 series (no al fallo)', checked: false },
            { id: 'w-vs3-2', text: 'Press pecho mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-vs3-3', text: 'Aperturas 4 kg: 3 × 15', checked: false },
            { id: 'w-vs3-4', text: 'Remo mancuerna: 3 × 12 por lado', checked: false },
            { id: 'w-vs3-5', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-vs3-6', text: 'Curl bíceps: 3 × 15 (congestión brazos)', checked: false },
            { id: 'w-vs3-7', text: 'Plancha frontal: 3 × 45s', checked: false },
          ],
        },
        {
          id: 'breakfast-vs3', type: 'breakfast',
          title: 'Desayuno mínimo — CERO SAL',
          estimatedKcal: 200,
          checked: false,
          subItems: [
            { id: 'des-vs3-1', text: 'Café', checked: false },
            { id: 'des-vs3-2', text: '1 fruta (manzana o kiwi)', checked: false },
          ],
        },
        {
          id: 'lunch-vs3', type: 'lunch',
          title: 'Proteína magra + espárragos — CERO SAL',
          cookingMethod: 'plancha',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'lun-vs3-1', text: '160 g pechuga pavo o merluza plancha (sin sal)', checked: false },
            { id: 'lun-vs3-2', text: 'Espárragos + apio + pepino al vapor', checked: false },
            { id: 'lun-vs3-3', text: '40 g arroz integral', checked: false },
            { id: 'lun-vs3-4', text: '1 cda aceite oliva + limón + ajo (sin sal)', checked: false },
            { id: 'lun-vs3-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vs3', type: 'dinner',
          title: 'Cena muy ligera — CERO SAL',
          cookingMethod: 'plancha',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'din-vs3-1', text: '150 g merluza plancha (sin sal)', checked: false },
            { id: 'din-vs3-2', text: 'Ensalada diurética: pepino + apio + lechuga', checked: false },
            { id: 'din-vs3-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vs3-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 18 JUNIO — 🏖️ ROQUETAS
    {
      date: '2026-06-18',
      dayName: 'Jueves',
      specialNote: '🏖️ DÍA DE ROQUETAS. Llegaste. 6 semanas de trabajo. Disfruta.',
      blocks: [
        {
          id: 'workout-roquetas', type: 'workout',
          title: '🏖️ Roquetas — Día objetivo',
          description: '75.0 → ~73.0 kg · Tren superior definido · Base sub-45 en marcha',
          checked: false,
          subItems: [
            { id: 'w-roq-1', text: 'Hidratación normal — el protocolo de ayer da resultado hoy', checked: false },
            { id: 'w-roq-2', text: 'Desayuno ligero proteico (no hinchar el estómago)', checked: false },
            { id: 'w-roq-3', text: 'Bañarse, pasear, disfrutar 🌊', checked: false },
            { id: 'w-roq-4', text: 'Esta noche: celebrar con mesura. Lo has ganado 🎉', checked: false },
          ],
        },
        {
          id: 'breakfast-roquetas', type: 'breakfast',
          title: 'Desayuno ligero proteico',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-roq-1', text: '1 yogur natural 0% + 1 fruta', checked: false },
            { id: 'des-roq-2', text: 'Café', checked: false },
            { id: 'des-roq-3', text: 'Hidratación normal desde el primer momento', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

  ],
}

export const week6ShoppingList: ShoppingList = {
  week: 6,
  items: [
    { id: 'w6-p1', category: 'proteinas', name: 'Pechuga pollo 700 g', checked: false },
    { id: 'w6-p2', category: 'proteinas', name: 'Pechuga pavo 300 g', checked: false },
    { id: 'w6-p3', category: 'proteinas', name: 'Pescado blanco 600 g (merluza o lubina)', checked: false },
    { id: 'w6-p4', category: 'proteinas', name: 'Salmón fresco 200 g (jueves post-test)', checked: false },
    { id: 'w6-p5', category: 'proteinas', name: 'Ternera magra 200 g (miércoles 10)', checked: false },
    { id: 'w6-p6', category: 'proteinas', name: 'Huevos (1 docena)', checked: false },
    { id: 'w6-v1', category: 'verduras-frutas', name: 'Espárragos verdes (3 manojos) ← clave verse seco', checked: false },
    { id: 'w6-v2', category: 'verduras-frutas', name: 'Pepinos (4) + apio (2 ramas) ← diuréticos', checked: false },
    { id: 'w6-v3', category: 'verduras-frutas', name: 'Brócoli + judías verdes', checked: false },
    { id: 'w6-v4', category: 'verduras-frutas', name: 'Espinacas frescas + champiñones (mié 10)', checked: false },
    { id: 'w6-v5', category: 'verduras-frutas', name: 'Verdura habitual (calabacín, pimiento, cebolla)', checked: false },
    { id: 'w6-v6', category: 'verduras-frutas', name: 'Ensalada (lechuga, tomate, zanahoria)', checked: false },
    { id: 'w6-v7', category: 'verduras-frutas', name: 'Plátanos (4)', checked: false },
    { id: 'w6-v8', category: 'verduras-frutas', name: 'Fruta variada (manzanas, kiwis)', checked: false },
    { id: 'w6-v9', category: 'verduras-frutas', name: 'Limones y ajos', checked: false },
    { id: 'w6-c1', category: 'carbohidratos', name: 'Arroz integral', checked: false },
    { id: 'w6-c2', category: 'carbohidratos', name: 'Patatas (6)', checked: false },
    { id: 'w6-c3', category: 'carbohidratos', name: 'Pan integral', checked: false },
    { id: 'w6-c4', category: 'carbohidratos', name: 'Muesli sin azúcar', checked: false },
    { id: 'w6-l1', category: 'lacteos-huevos', name: 'Yogur natural 0% (2 packs)', checked: false },
    { id: 'w6-d1', category: 'despensa', name: 'Frutos secos sin sal', checked: false },
    { id: 'w6-d2', category: 'despensa', name: 'Aceite oliva virgen extra', checked: false },
  ],
}
