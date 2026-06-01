import type { Week, ShoppingList } from '../types'

// SEMANA 2 — 8-18 JUNIO 2026
// Intensidad tren superior: 85% (incluye press militar con cuidado)
// TEST 10K jueves 11 junio
// Protocolo "verse seco": lunes 15 – miércoles 17 (cero sal, diuréticos, cero alcohol)
// 🏖️ ROQUETAS: jueves 18 junio

export const week6: Week = {
  weekNumber: 6,
  days: [
    // LUNES 8 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-08',
      dayName: 'Lunes',
      estimatedDailyKcal: 1500,
      specialNote: 'Semana 2 al 85%. Si el hombro/AC responde bien esta semana, añadir press militar con rango controlado.',
      blocks: [
        {
          id: 'workout-lun-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Subir intensidad. Press militar: añadir solo si AC sin molestias, rango corto y peso ligero.',
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

    // MARTES 9 JUNIO — Z2 45 min
    {
      date: '2026-06-09',
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
            { id: 'w-mar-6-2', text: '35 min Z2 (FC < 145 ppm, ~5:40/km)', checked: false },
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
          title: 'Pavo asado con verdura y arroz',
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

    // MIÉRCOLES 10 JUNIO — Fuerza tren inferior S2
    {
      date: '2026-06-10',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1500,
      specialNote: 'Mañana test 10K. No agotarte hoy con el tren inferior.',
      blocks: [
        {
          id: 'workout-mie-6', type: 'workout',
          title: 'Fuerza tren inferior + core S2 (45 min)',
          description: 'Progresión vs semana 1. Mañana test 10K: no agotar las piernas.',
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

    // JUEVES 11 JUNIO — TEST 10K CRONOMETRADO
    {
      date: '2026-06-11',
      dayName: 'Jueves',
      estimatedDailyKcal: 1600,
      specialNote: '🎯 DÍA DEL TEST 10K. Sal fresco. Desayuno 2-2,5h antes. El resultado calibra el trabajo para sub-45.',
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
            { id: 'pre-jue-6-1', text: '2-2,5h antes: desayuno completo (ver bloque desayuno)', checked: false },
            { id: 'pre-jue-6-2', text: '30 min antes: 300-400 ml agua a sorbos', checked: false },
            { id: 'pre-jue-6-3', text: 'Calentamiento: 10 min trote suave + 4-5 acelerones de 20s', checked: false },
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
          description: 'A tope. Ritmo constante desde el km 1. Km 1-3 conservador, km 4-7 objetivo, km 8-10 vaciar.',
          checked: false,
          subItems: [
            { id: 'w-jue-6-1', text: '10 min calentamiento trote + acelerones', checked: false },
            { id: 'w-jue-6-2', text: 'TEST 10K a tope — anotar tiempo y ritmo por km', checked: false },
            { id: 'w-jue-6-3', text: '10 min trote suave + estiramientos completos post-test', checked: false },
            { id: 'w-jue-6-4', text: '→ Anotar el tiempo en las notas del día', checked: false },
          ],
        },
        {
          id: 'post-match-jue-6', type: 'post_match_strategy',
          title: 'Post-test — Ventana de recuperación',
          description: 'Comer dentro de 60 min del test para recuperar.',
          checked: false,
          do: [
            '500 ml agua en los próximos 30 min',
            'Comer dentro de 60 min post-test',
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

    // VIERNES 12 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-12',
      dayName: 'Viernes',
      estimatedDailyKcal: 1500,
      blocks: [
        {
          id: 'workout-vie-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Segunda sesión de la semana. Última sesión de fuerza "normal" antes del protocolo.',
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
          title: 'Merluza plancha con ensalada',
          cookingMethod: 'plancha',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vie-6-1', text: '200 g merluza plancha', checked: false },
            { id: 'din-vie-6-2', text: 'Ensalada: lechuga + pepino + apio + tomate', checked: false },
            { id: 'din-vie-6-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vie-6-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 13 JUNIO — Rodaje largo Z2 55-60 min
    {
      date: '2026-06-13',
      dayName: 'Sábado',
      estimatedDailyKcal: 1600,
      alcoholQuota: 2,
      specialNote: 'Rodaje largo de la semana 2. Suave por recuperación del test. Pre: plátano + agua.',
      blocks: [
        {
          id: 'workout-sab-6', type: 'workout',
          title: 'Rodaje largo Z2 suave — 55-60 min (post-test)',
          description: 'Suave por recuperación del test del jueves. FC < 145 ppm, ritmo cómodo.',
          checked: false,
          subItems: [
            { id: 'w-sab-6-1', text: 'Pre: 1 plátano + 500 ml agua', checked: false },
            { id: 'w-sab-6-2', text: '55-60 min Z2 suave (FC < 145 ppm, ritmo cómodo)', checked: false },
            { id: 'w-sab-6-3', text: 'Post: estiramientos completos', checked: false },
          ],
        },
        {
          id: 'breakfast-sab-6', type: 'breakfast',
          title: 'Desayuno pre-largo',
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
          title: 'Comida post-largo — recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-sab-6-1', text: '180 g pollo o pescado', checked: false },
            { id: 'lun-sab-6-2', text: '70 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-sab-6-3', text: 'Verdura abundante', checked: false },
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
            { id: 'din-sab-6-1', text: '150 g pescado blanco plancha', checked: false },
            { id: 'din-sab-6-2', text: 'Ensalada o crema de verduras', checked: false },
            { id: 'din-sab-6-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // DOMINGO 14 JUNIO — Descanso activo
    {
      date: '2026-06-14',
      dayName: 'Domingo',
      estimatedDailyKcal: 1300,
      alcoholQuota: 1,
      specialNote: 'Descanso. Mañana empieza el protocolo verse seco (lunes 15). Última noche con copa permitida si quieres.',
      blocks: [
        {
          id: 'workout-dom-6', type: 'workout',
          title: 'Descanso activo / fútbol / paseo',
          description: 'Sin entreno estructurado. Paseo o fútbol si apetece.',
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
          description: 'Café o huevos revueltos + fruta.',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-dom-6-1', text: 'Opción A: 2 huevos revueltos + 1 rebanada pan + fruta + café', checked: false },
            { id: 'des-dom-6-2', text: 'Opción B: yogur + muesli + fruta + café', checked: false },
          ],
        },
        {
          id: 'lunch-dom-6', type: 'lunch',
          title: 'Comida equilibrada',
          estimatedKcal: 650,
          checked: false,
          subItems: [
            { id: 'lun-dom-6-1', text: '180 g proteína (pollo, ternera o pescado)', checked: false },
            { id: 'lun-dom-6-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-dom-6-3', text: '50 g arroz integral o 1 patata mediana', checked: false },
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
            { id: 'din-dom-6-1', text: 'Tortilla francesa + verdura o ensalada', checked: false },
            { id: 'din-dom-6-2', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // LUNES 15 JUNIO — VERSE SECO día 1
    {
      date: '2026-06-15',
      dayName: 'Lunes',
      estimatedDailyKcal: 1300,
      alcoholQuota: 0,
      specialNote: '🧂 INICIO PROTOCOLO VERSE SECO (3 días). Sin sal añadida, sin embutidos ni conservas. Hidratación 3-3,5 L paradójicamente reduce retención. Cero alcohol hasta Roquetas.',
      blocks: [
        {
          id: 'workout-vs1', type: 'workout',
          title: 'Descanso / paseo suave',
          description: 'Sin entreno estructurado. Conservar energía y dejar que el protocolo actúe.',
          checked: false,
          subItems: [
            { id: 'w-vs1-1', text: 'Paseo suave 30-40 min (opcional)', checked: false },
            { id: 'w-vs1-2', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-vs1', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café (ayuno hasta la comida).',
          checked: false,
        },
        {
          id: 'lunch-vs1', type: 'lunch',
          title: 'Proteína + verduras diuréticas — SIN sal añadida',
          cookingMethod: 'plancha',
          estimatedKcal: 650,
          checked: false,
          subItems: [
            { id: 'lun-vs1-1', text: '160 g pollo o merluza plancha (sin sal o mínima)', checked: false },
            { id: 'lun-vs1-2', text: 'Espárragos + pepino + apio (crudos o al vapor)', checked: false },
            { id: 'lun-vs1-3', text: '50 g arroz integral', checked: false },
            { id: 'lun-vs1-4', text: '1 cda aceite oliva + limón + ajo + especias sin sal', checked: false },
            { id: 'lun-vs1-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vs1', type: 'dinner',
          title: 'Cena ligera — SIN sal',
          cookingMethod: 'plancha',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vs1-1', text: '200 g pescado blanco plancha (sin sal)', checked: false },
            { id: 'din-vs1-2', text: 'Ensalada diurética: lechuga + pepino + apio + tomate', checked: false },
            { id: 'din-vs1-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vs1-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, waterTarget: 14, closed: false,
    },

    // MARTES 16 JUNIO — VERSE SECO día 2
    {
      date: '2026-06-16',
      dayName: 'Martes',
      estimatedDailyKcal: 1250,
      alcoholQuota: 0,
      specialNote: '🧂 VERSE SECO día 2. Seguir sin sal, sin embutidos, sin alcohol. Aumentar verduras diuréticas. Hidratación 3+ L.',
      blocks: [
        {
          id: 'workout-vs2', type: 'workout',
          title: 'Descanso activo',
          description: 'Sin entrenamiento.',
          checked: false,
          subItems: [
            { id: 'w-vs2-1', text: 'Paseo muy suave 20-30 min (opcional)', checked: false },
            { id: 'w-vs2-2', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-vs2', type: 'breakfast',
          title: 'Desayuno ligero — SIN sal',
          estimatedKcal: 250,
          checked: false,
          subItems: [
            { id: 'des-vs2-1', text: '2 huevos revueltos (sin sal)', checked: false },
            { id: 'des-vs2-2', text: '1 fruta (manzana o kiwi)', checked: false },
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
            { id: 'lun-vs2-1', text: '160 g pechuga pollo o lubina plancha (sin sal)', checked: false },
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
            { id: 'din-vs2-1', text: '150 g merluza o pechuga pavo plancha (sin sal)', checked: false },
            { id: 'din-vs2-2', text: 'Ensalada diurética: lechuga + pepino + apio + tomate', checked: false },
            { id: 'din-vs2-3', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vs2-4', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, waterTarget: 13, closed: false,
    },

    // MIÉRCOLES 17 JUNIO — VERSE SECO día 3 + última fuerza (congestión)
    {
      date: '2026-06-17',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1200,
      alcoholQuota: 0,
      specialNote: '🧂 VERSE SECO día 3 — CERO SAL. Última sesión fuerza tren superior (ligera, congestión). El pump de hoy + baja retención = mejor versión estética mañana en Roquetas.',
      blocks: [
        {
          id: 'workout-vs3', type: 'workout',
          title: 'Fuerza tren superior LIGERA — congestión final (30 min)',
          description: 'No buscar fallo ni peso máximo. Objetivo: activar músculo para congestión visible mañana.',
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
      notes: '', waterGlasses: 0, waterTarget: 13, closed: false,
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
            { id: 'w-roq-2', text: 'Desayuno ligero (no hinchar el estómago)', checked: false },
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
