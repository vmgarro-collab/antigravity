import type { Week, ShoppingList } from '../types'

// SEMANA 2 — 10-18 JUNIO 2026
// Intensidad tren superior: 85% (incluye press militar con cuidado)
// TEST 10K jueves 13
// Protocolo "verse seco" desde sábado 15 hasta Roquetas 18 jun

export const week6: Week = {
  weekNumber: 6,
  days: [
    // LUNES 10 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-10',
      dayName: 'Lunes',
      estimatedDailyKcal: 1500,
      specialNote: 'Semana 2 al 85%. Si el hombro/AC responde bien, añadir press militar al final con rangos controlados.',
      blocks: [
        {
          id: 'workout-lun-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Subir intensidad. Press militar: añadir solo si AC sin molestias, con rango corto y peso ligero.',
          checked: false,
          subItems: [
            { id: 'w-lun-6-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-lun-6-2', text: 'Dominadas: 4 series máx reps (subir 1-2 reps vs semana 1)', checked: false },
            { id: 'w-lun-6-3', text: 'Press pecho mancuernas 4 kg: 4 × 20 (tempo 3s bajada)', checked: false },
            { id: 'w-lun-6-4', text: 'Aperturas mancuernas 4 kg: 3 × 15-20', checked: false },
            { id: 'w-lun-6-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-lun-6-6', text: 'Elevaciones laterales 4 kg: 3 × 15-20', checked: false },
            { id: 'w-lun-6-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-lun-6-8', text: 'Face pulls: 3 × 20', checked: false },
            { id: 'w-lun-6-9', text: 'Press militar mancuernas (SOLO si AC OK): 3 × 12, rango corto', checked: false },
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
            { id: 'lun-lun-6-2', text: '1 patata mediana (microondas)', checked: false },
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

    // MARTES 11 JUNIO — Z2 45 min
    {
      date: '2026-06-11',
      dayName: 'Martes',
      estimatedDailyKcal: 1300,
      blocks: [
        {
          id: 'workout-mar-6', type: 'workout',
          title: 'Carrera Z2 — 45 min',
          description: 'FC < 145 ppm, ritmo libre. 5 min más que semana 1. Progresión aeróbica.',
          checked: false,
          subItems: [
            { id: 'w-mar-6-1', text: '5 min calentamiento trote suave', checked: false },
            { id: 'w-mar-6-2', text: '35 min Z2 (FC < 145 ppm, ritmo libre ~5:40/km)', checked: false },
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
            { id: 'lun-mar-6-3', text: 'Mix hojas verdes + tomate + pepino + cebolla morada', checked: false },
            { id: 'lun-mar-6-4', text: '4-5 aceitunas verdes', checked: false },
            { id: 'lun-mar-6-5', text: '1 cda aceite oliva + vinagre + orégano', checked: false },
            { id: 'lun-mar-6-6', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mar-6', type: 'dinner',
          title: 'Pavo asado con verdura',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-mar-6-1', text: '200 g pechuga pavo plancha', checked: false },
            { id: 'din-mar-6-2', text: 'Verdura asada (calabacín, pimiento, berenjena)', checked: false },
            { id: 'din-mar-6-3', text: '50 g arroz integral', checked: false },
            { id: 'din-mar-6-4', text: '1 cda aceite oliva', checked: false },
            { id: 'din-mar-6-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 12 JUNIO — Fuerza tren inferior S2
    {
      date: '2026-06-12',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1500,
      blocks: [
        {
          id: 'workout-mie-6', type: 'workout',
          title: 'Fuerza tren inferior + core S2 (45 min)',
          description: 'Progresión vs semana 1. Mañana test 10K: no agotarte hoy.',
          checked: false,
          subItems: [
            { id: 'w-mie-6-1', text: 'Calentamiento caderas 5 min', checked: false },
            { id: 'w-mie-6-2', text: 'Sentadilla mancuernas 4 kg a los lados: 4 × 20', checked: false },
            { id: 'w-mie-6-3', text: 'Zancadas alternas: 4 × 14 por pierna', checked: false },
            { id: 'w-mie-6-4', text: 'Sentadilla búlgara: 4 × 12 por pierna', checked: false },
            { id: 'w-mie-6-5', text: 'Puente glúteos a una pierna: 3 × 12 por pierna', checked: false },
            { id: 'w-mie-6-6', text: 'Elevaciones gemelos: 4 × 25', checked: false },
            { id: 'w-mie-6-7', text: 'Russian twists: 3 × 20 + plancha lateral 3 × 40s', checked: false },
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
          recipe: [
            'Saltear cebolla + ajo, añadir champiñones y espinacas',
            'Escurrir bien en colador (clave: si no, sale aguada)',
            'Batir huevos + claras con sal y nuez moscada',
            'Cuajar 3-4 min por lado en sartén antiadherente',
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 13 JUNIO — TEST 10K CRONOMETRADO
    {
      date: '2026-06-13',
      dayName: 'Jueves',
      estimatedDailyKcal: 1600,
      specialNote: '🎯 DÍA DEL TEST 10K. Sal fresco: mínimo 24h sin fuerza ni carrera intensa. Protocolo desayuno 2-2,5h antes. El resultado calibra tu trabajo para sub-45.',
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
            { id: 'pre-jue-6-1', text: '2-2,5h antes: desayuno (ver bloque desayuno)', checked: false },
            { id: 'pre-jue-6-2', text: '30 min antes: 300-400 ml agua a sorbos', checked: false },
            { id: 'pre-jue-6-3', text: 'Calentamiento: 10 min trote suave + 4-5 acelerones de 20s', checked: false },
            { id: 'pre-jue-6-4', text: 'Objetivo ritmo: 4:30/km = sub-45 · 4:35/km = ~45:50 · 4:40/km = ~46:40', checked: false },
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
          description: 'A tope. Ritmo constante desde el km 1. Si tienes GPS: divide en km 1-3 (conservador), km 4-7 (ritmo objetivo), km 8-10 (vaciar).',
          checked: false,
          subItems: [
            { id: 'w-jue-6-1', text: '10 min calentamiento trote + acelerones', checked: false },
            { id: 'w-jue-6-2', text: 'TEST 10K a tope — anotar tiempo y ritmo por km', checked: false },
            { id: 'w-jue-6-3', text: 'Post-test: 10 min trote suave + estiramientos completos', checked: false },
            { id: 'w-jue-6-4', text: 'Anotar el tiempo en las notas del día', checked: false },
          ],
        },
        {
          id: 'post-match-jue-6', type: 'post_match_strategy',
          title: 'Post-test — Ventana de recuperación',
          description: 'Comer en los 60 min post-test para recuperar.',
          checked: false,
          do: [
            'Hidratarse: 500 ml agua en los próximos 30 min',
            'Comer dentro de 60 min del test',
            'Proteína + carbo para recuperar',
          ],
        },
        {
          id: 'lunch-jue-6', type: 'lunch',
          title: 'Comida post-test — Recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-jue-6-1', text: '180 g pollo o ternera (proteína recuperación)', checked: false },
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

    // VIERNES 14 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-14',
      dayName: 'Viernes',
      estimatedDailyKcal: 1500,
      blocks: [
        {
          id: 'workout-vie-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Última sesión de fuerza "normal" antes del protocolo verse seco.',
          checked: false,
          subItems: [
            { id: 'w-vie-6-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-vie-6-2', text: 'Dominadas: 4 series máx reps', checked: false },
            { id: 'w-vie-6-3', text: 'Press pecho mancuernas 4 kg: 4 × 20', checked: false },
            { id: 'w-vie-6-4', text: 'Aperturas mancuernas 4 kg: 3 × 15-20', checked: false },
            { id: 'w-vie-6-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-vie-6-6', text: 'Elevaciones laterales 4 kg: 3 × 15-20', checked: false },
            { id: 'w-vie-6-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
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
          title: 'Pavo con espárragos y arroz',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-vie-6-1', text: '160 g pechuga pavo plancha', checked: false },
            { id: 'lun-vie-6-2', text: '50 g arroz integral', checked: false },
            { id: 'lun-vie-6-3', text: 'Espárragos verdes + cebolla', checked: false },
            { id: 'lun-vie-6-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'lun-vie-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vie-6', type: 'dinner',
          title: 'Merluza plancha con ensalada diurética',
          cookingMethod: 'plancha',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vie-6-1', text: '200 g merluza plancha', checked: false },
            { id: 'din-vie-6-2', text: 'Ensalada: lechuga + pepino + apio + tomate (sin sal o poca)', checked: false },
            { id: 'din-vie-6-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vie-6-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 15 JUNIO — Rodaje largo Z2 + inicio protocolo verse seco
    {
      date: '2026-06-15',
      dayName: 'Sábado',
      estimatedDailyKcal: 1550,
      alcoholQuota: 0,
      specialNote: '🧂 INICIO PROTOCOLO VERSE SECO. Desde hoy: cocinar sin sal añadida, sin embutidos/conservas. Hidratación alta (3-3,5 L) paradójicamente reduce retención. Cero alcohol estos 3 días.',
      blocks: [
        {
          id: 'workout-sab-6', type: 'workout',
          title: 'Rodaje largo Z2 suave — 55-60 min (post-test)',
          description: 'Suave por recuperación del test del jueves. Aeróbico base, no competitivo.',
          checked: false,
          subItems: [
            { id: 'w-sab-6-1', text: 'Pre: 1 plátano + 500 ml agua', checked: false },
            { id: 'w-sab-6-2', text: '55-60 min Z2 suave (FC < 145 ppm, ritmo cómodo)', checked: false },
            { id: 'w-sab-6-3', text: 'Post: estiramientos completos', checked: false },
          ],
        },
        {
          id: 'breakfast-sab-6', type: 'breakfast',
          title: 'Desayuno pre-largo (sin sal añadida)',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-sab-6-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-sab-6-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-sab-6-3', text: '1 plátano', checked: false },
            { id: 'des-sab-6-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-sab-6', type: 'lunch',
          title: 'Pollo con arroz y espárragos — SIN sal añadida',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-sab-6-1', text: '160 g pollo plancha (sin sal o mínima)', checked: false },
            { id: 'lun-sab-6-2', text: '50 g arroz integral', checked: false },
            { id: 'lun-sab-6-3', text: 'Espárragos + pepino + tomate (diuréticos)', checked: false },
            { id: 'lun-sab-6-4', text: '1 cda aceite oliva + limón + ajo + especias sin sal', checked: false },
            { id: 'lun-sab-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-sab-6', type: 'dinner',
          title: 'Lubina al vapor con verdura diurética — SIN sal',
          cookingMethod: 'vapor',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-sab-6-1', text: '200 g lubina o merluza al vapor (sin sal)', checked: false },
            { id: 'din-sab-6-2', text: 'Espárragos + brócoli + apio al vapor', checked: false },
            { id: 'din-sab-6-3', text: '1 patata pequeña', checked: false },
            { id: 'din-sab-6-4', text: '1 cda aceite oliva + limón (sin sal)', checked: false },
            { id: 'din-sab-6-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, waterTarget: 14, closed: false,
    },

    // DOMINGO 16 JUNIO — Verse seco día 2 / descanso
    {
      date: '2026-06-16',
      dayName: 'Domingo',
      estimatedDailyKcal: 1250,
      alcoholQuota: 0,
      specialNote: '🧂 VERSE SECO día 2. Sin sal añadida, sin embutidos, sin procesados, sin alcohol. Verduras diuréticas: espárragos, pepino, apio, pepino. Beber 3+ litros.',
      blocks: [
        {
          id: 'workout-dom-6', type: 'workout',
          title: 'Descanso activo',
          description: 'Sin entrenamiento. Paseo suave si apetece.',
          checked: false,
          subItems: [
            { id: 'w-dom-6-1', text: 'Paseo opcional 30-40 min ritmo muy suave', checked: false },
            { id: 'w-dom-6-2', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-dom-6', type: 'breakfast',
          title: 'Desayuno ligero proteico — SIN sal',
          estimatedKcal: 250,
          checked: false,
          subItems: [
            { id: 'des-dom-6-1', text: '2 huevos revueltos (sin sal)', checked: false },
            { id: 'des-dom-6-2', text: '1 fruta (manzana o kiwi)', checked: false },
            { id: 'des-dom-6-3', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-dom-6', type: 'lunch',
          title: 'Proteína + verdura diurética — SIN sal añadida',
          cookingMethod: 'plancha',
          estimatedKcal: 600,
          checked: false,
          subItems: [
            { id: 'lun-dom-6-1', text: '160 g pechuga pollo o merluza plancha (sin sal)', checked: false },
            { id: 'lun-dom-6-2', text: 'Espárragos + pepino + apio (crudos o al vapor)', checked: false },
            { id: 'lun-dom-6-3', text: '50 g arroz integral (reducir carbos vs días anteriores)', checked: false },
            { id: 'lun-dom-6-4', text: '1 cda aceite oliva + limón + hierbas sin sal', checked: false },
            { id: 'lun-dom-6-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-dom-6', type: 'dinner',
          title: 'Cena ligera — SIN sal',
          cookingMethod: 'plancha',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'din-dom-6-1', text: '150 g pechuga pollo o pescado blanco plancha (sin sal)', checked: false },
            { id: 'din-dom-6-2', text: 'Ensalada diurética: lechuga + pepino + apio + tomate', checked: false },
            { id: 'din-dom-6-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-dom-6-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, waterTarget: 13, closed: false,
    },

    // LUNES 17 JUNIO — Verse seco día 3 + última fuerza tren superior (congestión)
    {
      date: '2026-06-17',
      dayName: 'Lunes',
      estimatedDailyKcal: 1200,
      alcoholQuota: 0,
      specialNote: '🧂 VERSE SECO día 3 — CERO SAL. Última sesión fuerza tren superior (ligera, congestión final). El pump de hoy + baja retención = mejor versión estética mañana en Roquetas.',
      blocks: [
        {
          id: 'workout-lun-7', type: 'workout',
          title: 'Fuerza tren superior LIGERA — congestión final (30 min)',
          description: 'No buscar fallo muscular ni peso máximo. Objetivo: activar el músculo y conseguir congestión visible mañana.',
          checked: false,
          subItems: [
            { id: 'w-lun-7-1', text: 'Dominadas: 3 series (no al fallo)', checked: false },
            { id: 'w-lun-7-2', text: 'Press pecho mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-7-3', text: 'Aperturas 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-7-4', text: 'Remo mancuerna: 3 × 12 por lado', checked: false },
            { id: 'w-lun-7-5', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-7-6', text: 'Curl bíceps: 3 × 15 (congestión brazo)', checked: false },
            { id: 'w-lun-7-7', text: 'Plancha frontal: 3 × 45s', checked: false },
          ],
        },
        {
          id: 'breakfast-lun-7', type: 'breakfast',
          title: 'Desayuno mínimo — SIN sal',
          estimatedKcal: 200,
          checked: false,
          subItems: [
            { id: 'des-lun-7-1', text: 'Café', checked: false },
            { id: 'des-lun-7-2', text: '1 fruta (manzana o kiwi)', checked: false },
          ],
        },
        {
          id: 'lunch-lun-7', type: 'lunch',
          title: 'Proteína magra + espárragos — CERO SAL',
          cookingMethod: 'plancha',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'lun-lun-7-1', text: '160 g pechuga pavo o merluza plancha (sin sal)', checked: false },
            { id: 'lun-lun-7-2', text: 'Espárragos verdes + apio + pepino al vapor', checked: false },
            { id: 'lun-lun-7-3', text: '40 g arroz integral (reducir carbo hoy)', checked: false },
            { id: 'lun-lun-7-4', text: '1 cda aceite oliva + limón + ajo (sin sal)', checked: false },
            { id: 'lun-lun-7-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-lun-7', type: 'dinner',
          title: 'Cena muy ligera — CERO SAL',
          cookingMethod: 'plancha',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'din-lun-7-1', text: '150 g merluza o clara de huevo plancha (sin sal)', checked: false },
            { id: 'din-lun-7-2', text: 'Ensalada diurética: pepino + apio + lechuga', checked: false },
            { id: 'din-lun-7-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-lun-7-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, waterTarget: 13, closed: false,
    },

    // MARTES 18 JUNIO — 🏖️ ROQUETAS
    {
      date: '2026-06-18',
      dayName: 'Martes',
      specialNote: '🏖️ DÍA DE ROQUETAS. Llegaste. 4 semanas de trabajo. Disfruta.',
      blocks: [
        {
          id: 'workout-roquetas', type: 'workout',
          title: '🏖️ Roquetas — Día objetivo',
          description: '75.0 → ~73.0 kg. Tren superior definido. Base sub-45 en marcha.',
          checked: false,
          subItems: [
            { id: 'w-roq-1', text: 'Hidratación normal — el protocolo de ayer da resultado hoy', checked: false },
            { id: 'w-roq-2', text: 'Desayuno ligero proteico (no hinchar el estómago)', checked: false },
            { id: 'w-roq-3', text: 'Bañarse, pasear, disfrutar', checked: false },
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
    { id: 'w6-p5', category: 'proteinas', name: 'Ternera magra 200 g (miércoles)', checked: false },
    { id: 'w6-p6', category: 'proteinas', name: 'Huevos (1 docena)', checked: false },
    { id: 'w6-v1', category: 'verduras-frutas', name: 'Espárragos verdes (3 manojos) ← clave verse seco', checked: false },
    { id: 'w6-v2', category: 'verduras-frutas', name: 'Pepinos (4) + apio (2 ramas) ← diuréticos', checked: false },
    { id: 'w6-v3', category: 'verduras-frutas', name: 'Brócoli + judías verdes', checked: false },
    { id: 'w6-v4', category: 'verduras-frutas', name: 'Espinacas frescas + champiñones (miércoles)', checked: false },
    { id: 'w6-v5', category: 'verduras-frutas', name: 'Verdura habitual (calabacín, pimiento, cebolla)', checked: false },
    { id: 'w6-v6', category: 'verduras-frutas', name: 'Ensalada (lechuga, tomate, zanahoria)', checked: false },
    { id: 'w6-v7', category: 'verduras-frutas', name: 'Plátanos (4)', checked: false },
    { id: 'w6-v8', category: 'verduras-frutas', name: 'Fruta variada (manzanas, kiwis)', checked: false },
    { id: 'w6-v9', category: 'verduras-frutas', name: 'Limones y ajos', checked: false },
    { id: 'w6-c1', category: 'carbohidratos', name: 'Arroz integral', checked: false },
    { id: 'w6-c2', category: 'carbohidratos', name: 'Patatas (6)', checked: false },
    { id: 'w6-c3', category: 'carbohidratos', name: 'Pan integral (sin sal añadida si posible)', checked: false },
    { id: 'w6-c4', category: 'carbohidratos', name: 'Muesli sin azúcar', checked: false },
    { id: 'w6-l1', category: 'lacteos-huevos', name: 'Yogur natural 0% (2 packs)', checked: false },
    { id: 'w6-d1', category: 'despensa', name: 'Frutos secos sin sal', checked: false },
    { id: 'w6-d2', category: 'despensa', name: 'Aceite oliva virgen extra', checked: false },
  ],
}
