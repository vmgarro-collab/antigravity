import type { Week, ShoppingList } from '../types'

// SEMANA 5 — 1-7 JUNIO 2026
// Lun 1 + Mar 2: transición post-torneo
// Mié 3 → Dom 7: primer ciclo semanal (tren sup, tempo, tren sup, largo, descanso)

export const week5: Week = {
  weekNumber: 5,
  days: [

    // LUNES 1 JUNIO — Recuperación post-torneo
    {
      date: '2026-06-01',
      dayName: 'Lunes',
      estimatedDailyKcal: 1400,
      alcoholQuota: 0,
      waterTarget: 14,
      specialNote: 'Post-torneo. Recuperar e hidratar. Hoy NO se hace ayuno — desayuno completo. Hidratación PRIORITARIA: 3,5 L.',
      blocks: [
        {
          id: 'workout-lun-5', type: 'workout',
          title: 'Descanso activo',
          description: 'Paseo suave 30-40 min o descanso completo. Sin intensidad.',
          checked: false,
          subItems: [
            { id: 'w-lun-5-1', text: 'Paseo suave 30-40 min (opcional)', checked: false },
            { id: 'w-lun-5-2', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-lun-5', type: 'breakfast',
          title: 'Desayuno completo (HOY no se ayuna)',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-lun-5-1', text: '2 huevos revueltos o a la plancha', checked: false },
            { id: 'des-lun-5-2', text: '1 rebanada pan integral', checked: false },
            { id: 'des-lun-5-3', text: '1 fruta', checked: false },
            { id: 'des-lun-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-lun-5', type: 'lunch',
          title: 'Comida de recuperación',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-lun-5-1', text: '180 g proteína (pollo, ternera o pescado)', checked: false },
            { id: 'lun-lun-5-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-lun-5-3', text: '60 g arroz integral o 1 patata mediana', checked: false },
            { id: 'lun-lun-5-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-lun-5-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-lun-5', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-lun-5-1', text: '200 g pescado o pollo plancha', checked: false },
            { id: 'din-lun-5-2', text: 'Verdura abundante', checked: false },
            { id: 'din-lun-5-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MARTES 2 JUNIO — Z2 reactivación
    {
      date: '2026-06-02',
      dayName: 'Martes',
      estimatedDailyKcal: 1300,
      alcoholQuota: 0,
      blocks: [
        {
          id: 'weighin-mar-5', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas. Inicio del nuevo bloque Roquetas.',
          checked: false,
        },
        {
          id: 'workout-mar-5', type: 'workout',
          title: 'Carrera Z2 reactivación — 30-40 min',
          description: 'Si piernas muy cargadas: acortar a 25 min o bici suave. Sin intensidad.',
          checked: false,
          subItems: [
            { id: 'w-mar-5-1', text: '5 min calentamiento trote suave', checked: false },
            { id: 'w-mar-5-2', text: '20-30 min Z2 (FC < 145 ppm, ritmo libre)', checked: false },
            { id: 'w-mar-5-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
          ],
        },
        {
          id: 'breakfast-mar-5', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café (ayuno — vuelta al 16:8 normal).',
          checked: false,
        },
        {
          id: 'lunch-mar-5', type: 'lunch',
          title: 'Bowl de pollo y arroz',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-mar-5-1', text: '150 g pechuga pollo plancha', checked: false },
            { id: 'lun-mar-5-2', text: '50 g arroz integral en seco', checked: false },
            { id: 'lun-mar-5-3', text: 'Ensalada (lechuga, tomate, pepino, cebolla morada)', checked: false },
            { id: 'lun-mar-5-4', text: '4-5 aceitunas verdes', checked: false },
            { id: 'lun-mar-5-5', text: '1 cda aceite oliva + vinagre + orégano', checked: false },
            { id: 'lun-mar-5-6', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mar-5', type: 'dinner',
          title: 'Salmón al horno con verdura y patata',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-mar-5-1', text: '200 g salmón fresco', checked: false },
            { id: 'din-mar-5-2', text: 'Verdura asada (calabacín, pimiento)', checked: false },
            { id: 'din-mar-5-3', text: '1 patata pequeña', checked: false },
            { id: 'din-mar-5-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-mar-5-5', text: '1 yogur natural 0%', checked: false },
          ],
          recipe: [
            'Precalentar horno 200°C',
            'Verdura en bandeja con aceite, hornear 20-25 min',
            'Salmón sobre papel con limón, hornear 12-14 min',
            'Patata al microondas 6-7 min en paralelo',
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 3 JUNIO — Fuerza tren superior (1ª sesión, 70%)
    {
      date: '2026-06-03',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1500,
      alcoholQuota: 0,
      specialNote: 'Primera sesión tren superior del nuevo bloque. Al 70%: rangos controlados, sin press militar. Si AC molesta: reducir rango/peso.',
      blocks: [
        {
          id: 'workout-mie-5', type: 'workout',
          title: 'Fuerza tren superior + core — S1 al 70% (40-45 min)',
          description: 'Reintroducción progresiva. Tempo 3s bajada. Sin press militar esta semana.',
          checked: false,
          subItems: [
            { id: 'w-mie-5-1', text: 'Calentamiento hombros 5 min (círculos, movilidad)', checked: false },
            { id: 'w-mie-5-2', text: 'Dominadas: 4 series máx reps (si no salen: negativas 5s)', checked: false },
            { id: 'w-mie-5-3', text: 'Press pecho mancuernas 4 kg: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-mie-5-4', text: 'Aperturas mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-mie-5-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-mie-5-6', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-mie-5-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-mie-5-8', text: 'Face pulls con banda o remo ligero: 3 × 20', checked: false },
            { id: 'w-mie-5-9', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado + crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-mie-5', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-mie-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-mie-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-mie-5-3', text: '1 fruta', checked: false },
            { id: 'des-mie-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-mie-5', type: 'lunch',
          title: 'Bowl de pollo y arroz',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-mie-5-1', text: '150 g pechuga pollo plancha', checked: false },
            { id: 'lun-mie-5-2', text: '50 g arroz integral en seco', checked: false },
            { id: 'lun-mie-5-3', text: 'Mix hojas verdes + tomate + pepino + cebolla', checked: false },
            { id: 'lun-mie-5-4', text: '1 cda aceite oliva + vinagre + orégano', checked: false },
            { id: 'lun-mie-5-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mie-5', type: 'dinner',
          title: 'Pollo con verdura asada y arroz',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-mie-5-1', text: '200 g pechuga pollo plancha', checked: false },
            { id: 'din-mie-5-2', text: 'Verdura asada (calabacín, pimiento, berenjena)', checked: false },
            { id: 'din-mie-5-3', text: '50 g arroz integral', checked: false },
            { id: 'din-mie-5-4', text: '1 cda aceite oliva + orégano', checked: false },
            { id: 'din-mie-5-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 4 JUNIO — Carrera calidad (tempo)
    {
      date: '2026-06-04',
      dayName: 'Jueves',
      estimatedDailyKcal: 1600,
      alcoholQuota: 0,
      specialNote: 'Día de calidad. Tempo a 5:00-5:10/km = trabajo clave para base sub-45.',
      blocks: [
        {
          id: 'weighin-jue-5', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'workout-jue-5', type: 'workout',
          title: 'Carrera calidad — Tempo (40 min)',
          description: 'Clave para base sub-45. No salgas demasiado fuerte los primeros minutos.',
          checked: false,
          subItems: [
            { id: 'w-jue-5-1', text: '10 min calentamiento trote suave + skipping + talones al culo', checked: false },
            { id: 'w-jue-5-2', text: '20 min a ritmo umbral (5:00-5:10/km, sensación 7/10)', checked: false },
            { id: 'w-jue-5-3', text: '10 min vuelta a la calma trote suave', checked: false },
          ],
        },
        {
          id: 'breakfast-jue-5', type: 'breakfast',
          title: 'Desayuno pre-calidad',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-jue-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-jue-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-jue-5-3', text: '1 plátano', checked: false },
            { id: 'des-jue-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-jue-5', type: 'lunch',
          title: 'Comida — día de calidad (algo más de carbo)',
          cookingMethod: 'plancha',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-jue-5-1', text: '180 g proteína (pollo o ternera magra)', checked: false },
            { id: 'lun-jue-5-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-jue-5-3', text: '70 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-jue-5-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-jue-5-5', text: '1 fruta + 1 yogur 0% de postre', checked: false },
          ],
        },
        {
          id: 'dinner-jue-5', type: 'dinner',
          title: 'Tortilla de espinacas y champiñones',
          cookingMethod: 'plancha',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-jue-5-1', text: '3 huevos + 2 claras', checked: false },
            { id: 'din-jue-5-2', text: 'Espinacas frescas + champiñones + cebolla + ajo', checked: false },
            { id: 'din-jue-5-3', text: '2 rebanadas pan integral', checked: false },
            { id: 'din-jue-5-4', text: '1 cda aceite oliva + nuez moscada', checked: false },
            { id: 'din-jue-5-5', text: '1 yogur natural 0%', checked: false },
          ],
          recipe: [
            'Saltear cebolla + ajo, añadir champiñones y espinacas',
            '🔑 Escurrir bien en colador (si no, sale aguada)',
            'Batir huevos + claras con sal y nuez moscada, mezclar con verdura',
            'Cuajar 3-4 min por lado en sartén antiadherente',
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // VIERNES 5 JUNIO — Fuerza tren superior (2ª sesión, 70%)
    {
      date: '2026-06-05',
      dayName: 'Viernes',
      estimatedDailyKcal: 1500,
      alcoholQuota: 1,
      specialNote: 'Segunda sesión tren superior. Si comida fuera: proteína + verdura, máx 1 copa vino, sin pan abundante.',
      blocks: [
        {
          id: 'workout-vie-5', type: 'workout',
          title: 'Fuerza tren superior + core — S1 al 70% (40-45 min)',
          description: 'Misma rutina que el miércoles. Si AC da señales: reducir rango/peso.',
          checked: false,
          subItems: [
            { id: 'w-vie-5-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-vie-5-2', text: 'Dominadas: 4 series máx reps (o negativas)', checked: false },
            { id: 'w-vie-5-3', text: 'Press pecho mancuernas 4 kg: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-vie-5-4', text: 'Aperturas mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-vie-5-5', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-vie-5-6', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-vie-5-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-vie-5-8', text: 'Face pulls con banda o remo ligero: 3 × 20', checked: false },
            { id: 'w-vie-5-9', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado + crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-vie-5', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-vie-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-vie-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-vie-5-3', text: '1 fruta', checked: false },
            { id: 'des-vie-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-vie-5', type: 'lunch',
          title: 'Comida (fuera o en casa)',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-vie-5-1', text: 'Proteína magra plancha (pescado o carne)', checked: false },
            { id: 'lun-vie-5-2', text: 'Verdura o ensalada abundante', checked: false },
            { id: 'lun-vie-5-3', text: '1 patata o 50 g arroz', checked: false },
            { id: 'lun-vie-5-4', text: 'Si fuera: máx 1 copa vino · sin pan abundante · sin postre dulce', checked: false },
          ],
        },
        {
          id: 'dinner-vie-5', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vie-5-1', text: '150 g pescado o pollo plancha', checked: false },
            { id: 'din-vie-5-2', text: 'Verdura abundante', checked: false },
            { id: 'din-vie-5-3', text: '1 rebanada pan integral', checked: false },
            { id: 'din-vie-5-4', text: '1 yogur natural 0% + 1 fruta', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 6 JUNIO — Rodaje largo Z2
    {
      date: '2026-06-06',
      dayName: 'Sábado',
      estimatedDailyKcal: 1650,
      alcoholQuota: 2,
      specialNote: 'Rodaje largo de la semana. Pre: plátano + agua. Post: estiramientos completos.',
      blocks: [
        {
          id: 'workout-sab-5', type: 'workout',
          title: 'Rodaje largo Z2 — 50-55 min',
          description: 'FC < 145 ppm, ritmo libre ~5:40-5:50/km. Guiarse por FC, no por el reloj.',
          checked: false,
          subItems: [
            { id: 'w-sab-5-1', text: 'Pre: 1 plátano + 500 ml agua 30 min antes', checked: false },
            { id: 'w-sab-5-2', text: '50-55 min carrera continua Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-sab-5-3', text: 'Post: estiramientos completos 10 min', checked: false },
          ],
        },
        {
          id: 'breakfast-sab-5', type: 'breakfast',
          title: 'Desayuno pre-largo',
          estimatedKcal: 400,
          checked: false,
          subItems: [
            { id: 'des-sab-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-sab-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-sab-5-3', text: '15 g frutos secos', checked: false },
            { id: 'des-sab-5-4', text: '1 fruta variada', checked: false },
            { id: 'des-sab-5-5', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-sab-5', type: 'lunch',
          title: 'Comida post-largo — recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-sab-5-1', text: '200 g proteína (pollo o pescado)', checked: false },
            { id: 'lun-sab-5-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-sab-5-3', text: '80 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-sab-5-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-sab-5-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-sab-5', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-sab-5-1', text: '200 g pescado blanco plancha', checked: false },
            { id: 'din-sab-5-2', text: 'Ensalada o crema de verduras', checked: false },
            { id: 'din-sab-5-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // DOMINGO 7 JUNIO — Descanso / Fútbol
    {
      date: '2026-06-07',
      dayName: 'Domingo',
      estimatedDailyKcal: 1350,
      alcoholQuota: 1,
      specialNote: 'Descanso activo. Fútbol si hay partido.',
      blocks: [
        {
          id: 'workout-dom-5', type: 'workout',
          title: 'Fútbol o descanso activo',
          description: 'Sin entreno estructurado.',
          checked: false,
          subItems: [
            { id: 'w-dom-5-1', text: 'Opción A: fútbol 50 min (si hay partido)', checked: false },
            { id: 'w-dom-5-2', text: 'Opción B: paseo 45-60 min ritmo cómodo', checked: false },
            { id: 'w-dom-5-3', text: 'Estiramientos suaves', checked: false },
          ],
        },
        {
          id: 'breakfast-dom-5', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café o huevos + fruta.',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-dom-5-1', text: 'Opción A: 2 huevos + 1 reb pan + fruta + café', checked: false },
            { id: 'des-dom-5-2', text: 'Opción B: yogur + muesli + fruta + café', checked: false },
          ],
        },
        {
          id: 'lunch-dom-5', type: 'lunch',
          title: 'Comida equilibrada',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-dom-5-1', text: '180 g proteína', checked: false },
            { id: 'lun-dom-5-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-dom-5-3', text: '60 g arroz integral o 1 patata mediana', checked: false },
            { id: 'lun-dom-5-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-dom-5-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-dom-5', type: 'dinner',
          title: 'Cena ligera',
          estimatedKcal: 450,
          checked: false,
          subItems: [
            { id: 'din-dom-5-1', text: 'Tortilla 2 huevos + 2 claras con verdura', checked: false },
            { id: 'din-dom-5-2', text: 'O: 150 g pescado plancha + ensalada', checked: false },
            { id: 'din-dom-5-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

  ],
}

export const week5ShoppingList: ShoppingList = {
  week: 5,
  items: [
    { id: 'w5-p1', category: 'proteinas', name: 'Pechuga pollo 800 g', checked: false },
    { id: 'w5-p2', category: 'proteinas', name: 'Pescado blanco 400 g (merluza o lubina)', checked: false },
    { id: 'w5-p3', category: 'proteinas', name: 'Salmón fresco 200 g (martes)', checked: false },
    { id: 'w5-p4', category: 'proteinas', name: 'Pavo lonchas', checked: false },
    { id: 'w5-p5', category: 'proteinas', name: 'Atún en lata al natural (3 latas)', checked: false },
    { id: 'w5-p6', category: 'proteinas', name: 'Huevos (1 docena)', checked: false },
    { id: 'w5-v1', category: 'verduras-frutas', name: 'Espárragos verdes (2 manojos) ← diurético clave', checked: false },
    { id: 'w5-v2', category: 'verduras-frutas', name: 'Pepino (3) + apio (1 rama) ← diuréticos', checked: false },
    { id: 'w5-v3', category: 'verduras-frutas', name: 'Verdura habitual (calabacín, pimiento, berenjena, cebolla)', checked: false },
    { id: 'w5-v4', category: 'verduras-frutas', name: 'Espinacas frescas + champiñones (jueves cena)', checked: false },
    { id: 'w5-v5', category: 'verduras-frutas', name: 'Ensalada (lechuga, tomate, pepino, zanahoria)', checked: false },
    { id: 'w5-v6', category: 'verduras-frutas', name: 'Plátanos (5)', checked: false },
    { id: 'w5-v7', category: 'verduras-frutas', name: 'Fruta variada (manzanas, kiwis, naranjas)', checked: false },
    { id: 'w5-v8', category: 'verduras-frutas', name: 'Limones y ajos', checked: false },
    { id: 'w5-c1', category: 'carbohidratos', name: 'Arroz integral', checked: false },
    { id: 'w5-c2', category: 'carbohidratos', name: 'Patatas (6)', checked: false },
    { id: 'w5-c3', category: 'carbohidratos', name: 'Pan integral con semillas', checked: false },
    { id: 'w5-c4', category: 'carbohidratos', name: 'Muesli sin azúcar', checked: false },
    { id: 'w5-l1', category: 'lacteos-huevos', name: 'Yogur natural 0% (2 packs)', checked: false },
    { id: 'w5-d1', category: 'despensa', name: 'Frutos secos sin sal', checked: false },
    { id: 'w5-d2', category: 'despensa', name: 'Aceite oliva virgen extra', checked: false },
    { id: 'w5-d3', category: 'despensa', name: 'Banda elástica (face pulls, ~5€ si no hay)', checked: false },
    { id: 'w5-d4', category: 'despensa', name: 'Aceitunas verdes (bote pequeño)', checked: false },
  ],
}
