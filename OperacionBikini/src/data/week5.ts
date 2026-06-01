import type { Week, ShoppingList } from '../types'

// SEMANA 1 — 3-9 JUNIO 2026
// Objetivo: Roquetas 18 jun + base sub-45
// Intensidad tren superior: 70% (reintroducción progresiva AC)
// Kcal diarias: ~1.500 en déficit sostenible

export const week5: Week = {
  weekNumber: 5,
  days: [
    // LUNES 3 JUNIO — Fuerza tren superior S1 (70%)
    {
      date: '2026-06-01',
      dayName: 'Lunes',
      estimatedDailyKcal: 1500,
      specialNote: 'Primer día del nuevo bloque. Tren superior al 70% — rangos controlados, sin forzar AC. Objetivo: verse bien en Roquetas el 18 jun.',
      blocks: [
        {
          id: 'workout-lun-5', type: 'workout',
          title: 'Fuerza tren superior + core — S1 al 70% (40-45 min)',
          description: 'Reintroducción progresiva. Rangos controlados, tempo lento (3s bajada). Sin press militar esta semana.',
          checked: false,
          subItems: [
            { id: 'w-lun-5-1', text: 'Calentamiento hombros 5 min (círculos, movilidad, rango completo)', checked: false },
            { id: 'w-lun-5-2', text: 'Dominadas: 4 series máx reps (si no salen: negativas 5s o asistidas)', checked: false },
            { id: 'w-lun-5-3', text: 'Press pecho con mancuernas 4 kg tumbado: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-lun-5-4', text: 'Aperturas con mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-5-5', text: 'Remo con mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-lun-5-6', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-5-7', text: 'Superset: curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-lun-5-8', text: 'Face pulls con banda o remo ligero: 3 × 20 (salud hombro)', checked: false },
            { id: 'w-lun-5-9', text: 'Core: plancha frontal 3 × 60s + plancha lateral 3 × 40s/lado + crunch 3 × 20', checked: false },
          ],
        },
        {
          id: 'breakfast-lun-5', type: 'breakfast',
          title: 'Desayuno pre-entreno',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-lun-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-lun-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-lun-5-3', text: '1 fruta (manzana o naranja)', checked: false },
            { id: 'des-lun-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-lun-5', type: 'lunch',
          title: 'Pavo plancha con arroz y verdura',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-lun-5-1', text: '160 g pechuga pavo plancha', checked: false },
            { id: 'lun-lun-5-2', text: '50 g arroz integral en seco', checked: false },
            { id: 'lun-lun-5-3', text: 'Espárragos verdes + pimiento + cebolla salteados', checked: false },
            { id: 'lun-lun-5-4', text: '1 cda aceite oliva + ajo + pimentón', checked: false },
            { id: 'lun-lun-5-5', text: '1 fruta de postre', checked: false },
          ],
          recipe: [
            'Cocer arroz integral 25 min',
            'Saltear espárragos y verdura con ajo y pimentón, 7 min',
            'Pavo plancha 3-4 min por lado',
            'Servir sobre base de arroz con verdura encima',
          ],
        },
        {
          id: 'dinner-lun-5', type: 'dinner',
          title: 'Merluza al vapor con verdura',
          cookingMethod: 'vapor',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-lun-5-1', text: '200 g merluza al vapor o plancha', checked: false },
            { id: 'din-lun-5-2', text: 'Brócoli + judías verdes al vapor', checked: false },
            { id: 'din-lun-5-3', text: '1 patata pequeña cocida', checked: false },
            { id: 'din-lun-5-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-lun-5-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MARTES 4 JUNIO — Carrera Z2 40 min
    {
      date: '2026-06-02',
      dayName: 'Martes',
      estimatedDailyKcal: 1300,
      blocks: [
        {
          id: 'workout-mar-5', type: 'workout',
          title: 'Carrera Z2 — 40 min',
          description: 'FC < 145 ppm, ritmo libre ~5:40-5:50/km. Base aeróbica sub-45.',
          checked: false,
          subItems: [
            { id: 'w-mar-5-1', text: '5 min calentamiento trote suave', checked: false },
            { id: 'w-mar-5-2', text: '30 min Z2 estricta (FC < 145 ppm, ritmo libre)', checked: false },
            { id: 'w-mar-5-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
          ],
        },
        {
          id: 'breakfast-mar-5', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café (ayuno hasta la comida).',
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
            { id: 'lun-mar-5-3', text: 'Mix hojas verdes + tomate + pepino + cebolla morada', checked: false },
            { id: 'lun-mar-5-4', text: '1 cda aceite oliva + vinagre + orégano', checked: false },
            { id: 'lun-mar-5-5', text: '1 fruta de postre', checked: false },
          ],
          recipe: [
            'Cocer arroz 25 min',
            'Pollo plancha 4-5 min por lado, reposar y filetear',
            'Montar bowl con base de arroz, hojas, verdura y pollo encima',
            'Aliñar con aceite + vinagre + sal + orégano',
          ],
        },
        {
          id: 'dinner-mar-5', type: 'dinner',
          title: 'Pollo con verdura asada',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-mar-5-1', text: '200 g pechuga pollo plancha', checked: false },
            { id: 'din-mar-5-2', text: 'Verdura asada (calabacín, pimiento, berenjena)', checked: false },
            { id: 'din-mar-5-3', text: '50 g arroz integral', checked: false },
            { id: 'din-mar-5-4', text: '1 cda aceite oliva + orégano', checked: false },
            { id: 'din-mar-5-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 5 JUNIO — Fuerza tren inferior + core
    {
      date: '2026-06-01',
      dayName: 'Miércoles',
      estimatedDailyKcal: 1500,
      blocks: [
        {
          id: 'workout-mie-5', type: 'workout',
          title: 'Fuerza tren inferior + core (45 min)',
          description: 'Mantener músculo en déficit. Progresión normal.',
          checked: false,
          subItems: [
            { id: 'w-mie-5-1', text: 'Calentamiento caderas 5 min', checked: false },
            { id: 'w-mie-5-2', text: 'Sentadilla mancuernas 4 kg a los lados: 4 × 20', checked: false },
            { id: 'w-mie-5-3', text: 'Zancadas alternas: 4 × 14 por pierna', checked: false },
            { id: 'w-mie-5-4', text: 'Sentadilla búlgara: 4 × 12 por pierna', checked: false },
            { id: 'w-mie-5-5', text: 'Puente glúteos a una pierna: 3 × 12 por pierna', checked: false },
            { id: 'w-mie-5-6', text: 'Elevaciones gemelos: 4 × 25', checked: false },
            { id: 'w-mie-5-7', text: 'Core oblicuos: russian twists 3 × 20 + plancha lateral 3 × 40s', checked: false },
            { id: 'w-mie-5-8', text: 'Crunch 3 × 20', checked: false },
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
          title: 'Tortilla de atún con patata y ensalada',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-mie-5-1', text: '2 huevos + 2 claras', checked: false },
            { id: 'lun-mie-5-2', text: '1 lata atún al natural escurrido', checked: false },
            { id: 'lun-mie-5-3', text: '1/2 cebolla + 1/2 pimiento rojo en daditos', checked: false },
            { id: 'lun-mie-5-4', text: '1 patata mediana (microondas 6-7 min)', checked: false },
            { id: 'lun-mie-5-5', text: '2 tomates en rodajas + orégano', checked: false },
            { id: 'lun-mie-5-6', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-mie-5-7', text: '1 fruta + 1 yogur 0% de postre', checked: false },
          ],
        },
        {
          id: 'dinner-mie-5', type: 'dinner',
          title: 'Lubina al horno con espárragos',
          cookingMethod: 'horno',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-mie-5-1', text: '200 g lubina o merluza', checked: false },
            { id: 'din-mie-5-2', text: 'Espárragos verdes al horno', checked: false },
            { id: 'din-mie-5-3', text: '1 patata pequeña', checked: false },
            { id: 'din-mie-5-4', text: '1 cda aceite oliva + limón + ajo', checked: false },
            { id: 'din-mie-5-5', text: '1 yogur natural 0%', checked: false },
          ],
          recipe: [
            'Precalentar horno 200°C',
            'Colocar lubina sobre papel con espárragos, ajo laminado y limón',
            'Hornear 15-18 min',
            'Patata al microondas en paralelo',
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 6 JUNIO — Carrera calidad (Tempo)
    {
      date: '2026-06-02',
      dayName: 'Jueves',
      estimatedDailyKcal: 1600,
      specialNote: 'Día de calidad. Desayuno antes del tempo para tener energía. El tempo a 5:00-5:10/km es el trabajo clave para la base sub-45.',
      blocks: [
        {
          id: 'workout-jue-5', type: 'workout',
          title: 'Carrera calidad — Tempo (40 min)',
          description: 'Clave para base sub-45. No salgas demasiado fuerte en los primeros 5 min del tempo.',
          checked: false,
          subItems: [
            { id: 'w-jue-5-1', text: '10 min calentamiento trote suave + skipping + talones al culo', checked: false },
            { id: 'w-jue-5-2', text: '20 min a ritmo umbral (5:00-5:10/km, sensación de esfuerzo 7/10)', checked: false },
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
          title: 'Ternera magra con arroz y verdura',
          cookingMethod: 'plancha',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-jue-5-1', text: '180 g ternera magra plancha', checked: false },
            { id: 'lun-jue-5-2', text: '70 g arroz integral en seco', checked: false },
            { id: 'lun-jue-5-3', text: 'Verdura abundante (calabacín + tomate + cebolla)', checked: false },
            { id: 'lun-jue-5-4', text: '1 cda aceite oliva', checked: false },
            { id: 'lun-jue-5-5', text: '1 fruta + 1 yogur 0% de postre', checked: false },
          ],
        },
        {
          id: 'dinner-jue-5', type: 'dinner',
          title: 'Salmón al horno con ensalada',
          cookingMethod: 'horno',
          estimatedKcal: 550,
          checked: false,
          subItems: [
            { id: 'din-jue-5-1', text: '200 g salmón fresco', checked: false },
            { id: 'din-jue-5-2', text: 'Lechuga + tomate + pepino + zanahoria', checked: false },
            { id: 'din-jue-5-3', text: '1 patata mediana', checked: false },
            { id: 'din-jue-5-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-jue-5-5', text: '1 yogur natural 0%', checked: false },
          ],
          recipe: [
            'Patata al microondas 6-7 min',
            'Precalentar horno 200°C',
            'Salmón sobre papel con rodajas limón, 12-14 min',
            'Ensalada al gusto + aliño con aceite + limón + sal',
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // VIERNES 7 JUNIO — Fuerza tren superior S1 (70%)
    {
      date: '2026-06-01',
      dayName: 'Viernes',
      estimatedDailyKcal: 1500,
      blocks: [
        {
          id: 'workout-vie-5', type: 'workout',
          title: 'Fuerza tren superior + core — S1 al 70% (40-45 min)',
          description: 'Segunda sesión de la semana. Mismos ejercicios, controlar si el hombro/AC da señales.',
          checked: false,
          subItems: [
            { id: 'w-vie-5-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-vie-5-2', text: 'Dominadas: 4 series máx reps (o negativas)', checked: false },
            { id: 'w-vie-5-3', text: 'Press pecho con mancuernas 4 kg: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-vie-5-4', text: 'Aperturas con mancuernas 4 kg: 3 × 15', checked: false },
            { id: 'w-vie-5-5', text: 'Remo con mancuerna a una mano: 4 × 15 por lado', checked: false },
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
          title: 'Pechuga de pollo con patata y espárragos',
          cookingMethod: 'plancha',
          estimatedKcal: 700,
          checked: false,
          subItems: [
            { id: 'lun-vie-5-1', text: '160 g pechuga pollo plancha', checked: false },
            { id: 'lun-vie-5-2', text: '1 patata mediana cocida', checked: false },
            { id: 'lun-vie-5-3', text: 'Espárragos verdes plancha + cebolla', checked: false },
            { id: 'lun-vie-5-4', text: '1 cda aceite oliva + limón + ajo', checked: false },
            { id: 'lun-vie-5-5', text: '1 fruta de postre', checked: false },
          ],
        },
        {
          id: 'dinner-vie-5', type: 'dinner',
          title: 'Lubina plancha con judías verdes',
          cookingMethod: 'plancha',
          estimatedKcal: 500,
          checked: false,
          subItems: [
            { id: 'din-vie-5-1', text: '200 g lubina o dorada plancha', checked: false },
            { id: 'din-vie-5-2', text: 'Judías verdes + brócoli al vapor', checked: false },
            { id: 'din-vie-5-3', text: '1 patata pequeña', checked: false },
            { id: 'din-vie-5-4', text: '1 cda aceite oliva + limón', checked: false },
            { id: 'din-vie-5-5', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 8 JUNIO — Rodaje largo Z2 50-55 min
    {
      date: '2026-06-02',
      dayName: 'Sábado',
      estimatedDailyKcal: 1600,
      alcoholQuota: 2,
      specialNote: 'Rodaje largo de la semana. Pre-carrera: plátano + agua. Post-carrera: estiramientos completos.',
      blocks: [
        {
          id: 'workout-sab-5', type: 'workout',
          title: 'Rodaje largo Z2 — 50-55 min',
          description: 'Aeróbico base. FC < 145 ppm, ritmo libre. No hay número de km objetivo — solo tiempo y FC.',
          checked: false,
          subItems: [
            { id: 'w-sab-5-1', text: 'Pre: 1 plátano + 500 ml agua 30 min antes', checked: false },
            { id: 'w-sab-5-2', text: '50-55 min carrera continua Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-sab-5-3', text: 'Ritmo ~5:40-5:50/km (guiarse por FC, no por reloj)', checked: false },
            { id: 'w-sab-5-4', text: 'Post: estiramientos completos 10 min', checked: false },
          ],
        },
        {
          id: 'breakfast-sab-5', type: 'breakfast',
          title: 'Desayuno pre-largo',
          estimatedKcal: 350,
          checked: false,
          subItems: [
            { id: 'des-sab-5-1', text: '1 yogur natural 0%', checked: false },
            { id: 'des-sab-5-2', text: '30 g muesli sin azúcar', checked: false },
            { id: 'des-sab-5-3', text: '1 plátano', checked: false },
            { id: 'des-sab-5-4', text: 'Café', checked: false },
          ],
        },
        {
          id: 'lunch-sab-5', type: 'lunch',
          title: 'Comida post-largo — recuperación',
          estimatedKcal: 750,
          checked: false,
          subItems: [
            { id: 'lun-sab-5-1', text: '180 g pollo o pescado', checked: false },
            { id: 'lun-sab-5-2', text: '70 g arroz integral o 1 patata grande', checked: false },
            { id: 'lun-sab-5-3', text: 'Verdura abundante', checked: false },
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
            { id: 'din-sab-5-1', text: '150 g pescado blanco plancha', checked: false },
            { id: 'din-sab-5-2', text: 'Ensalada o crema de verduras', checked: false },
            { id: 'din-sab-5-3', text: '1 yogur natural 0%', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // DOMINGO 9 JUNIO — Descanso / Fútbol / Paseo
    {
      date: '2026-06-01',
      dayName: 'Domingo',
      estimatedDailyKcal: 1300,
      alcoholQuota: 1,
      specialNote: 'Descanso activo. Si hay fútbol, perfecto. Si no: paseo 45-60 min. Semana 1 completada.',
      blocks: [
        {
          id: 'workout-dom-5', type: 'workout',
          title: 'Descanso activo / fútbol / paseo',
          description: 'Sin entreno estructurado. Cuerpo recupera.',
          checked: false,
          subItems: [
            { id: 'w-dom-5-1', text: 'Opción A: fútbol (si hay partido)', checked: false },
            { id: 'w-dom-5-2', text: 'Opción B: paseo 45-60 min ritmo cómodo', checked: false },
            { id: 'w-dom-5-3', text: 'Estiramientos suaves + movilidad', checked: false },
          ],
        },
        {
          id: 'breakfast-dom-5', type: 'breakfast',
          title: 'Desayuno',
          description: 'Café o huevos revueltos + fruta.',
          estimatedKcal: 300,
          checked: false,
          subItems: [
            { id: 'des-dom-5-1', text: 'Opción A: café + 2 huevos revueltos + 1 rebanada pan integral', checked: false },
            { id: 'des-dom-5-2', text: 'Opción B: yogur + muesli + fruta + café', checked: false },
          ],
        },
        {
          id: 'lunch-dom-5', type: 'lunch',
          title: 'Comida equilibrada',
          estimatedKcal: 650,
          checked: false,
          subItems: [
            { id: 'lun-dom-5-1', text: '180 g proteína (pollo, ternera o pescado)', checked: false },
            { id: 'lun-dom-5-2', text: 'Verdura abundante', checked: false },
            { id: 'lun-dom-5-3', text: '50 g arroz integral o 1 patata mediana', checked: false },
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
            { id: 'din-dom-5-1', text: 'Tortilla francesa 2 huevos + 2 claras con verdura', checked: false },
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
    { id: 'w5-p2', category: 'proteinas', name: 'Pechuga pavo 300 g', checked: false },
    { id: 'w5-p3', category: 'proteinas', name: 'Pescado blanco 400 g (merluza o lubina)', checked: false },
    { id: 'w5-p4', category: 'proteinas', name: 'Salmón fresco 200 g (jueves)', checked: false },
    { id: 'w5-p5', category: 'proteinas', name: 'Ternera magra 200 g (jueves)', checked: false },
    { id: 'w5-p6', category: 'proteinas', name: 'Atún en lata al natural (3 latas)', checked: false },
    { id: 'w5-p7', category: 'proteinas', name: 'Huevos (1 docena)', checked: false },
    { id: 'w5-v1', category: 'verduras-frutas', name: 'Espárragos verdes (2 manojos) ← diurético clave', checked: false },
    { id: 'w5-v2', category: 'verduras-frutas', name: 'Pepino (3) + apio (1 rama) ← diuréticos', checked: false },
    { id: 'w5-v3', category: 'verduras-frutas', name: 'Brócoli + judías verdes', checked: false },
    { id: 'w5-v4', category: 'verduras-frutas', name: 'Verdura habitual (calabacín, pimiento, berenjena, cebolla)', checked: false },
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
  ],
}
