import type { Week } from '../types'

export const week6: Week = {
  weekNumber: 6,
  days: [
    // LUNES 8 JUNIO — Fuerza tren superior S2 (85%)
    {
      date: '2026-06-08',
      dayName: 'Lunes',
      specialNote: 'Semana 2 fuerza al 85%. Introducir press militar si AC responde bien.',
      blocks: [
        {
          id: 'workout-lun-6', type: 'workout',
          title: 'Fuerza tren superior + core — S2 al 85% (40-45 min)',
          description: 'Subir intensidad. Press militar solo si AC sin molestias.',
          checked: false,
          subItems: [
            { id: 'w-lun-6-1', text: 'Calentamiento hombros 5 min', checked: false },
            { id: 'w-lun-6-2', text: 'Dominadas: 4 series máx reps', checked: false },
            { id: 'w-lun-6-3', text: 'Press pecho mancuernas 4 kg: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-lun-6-4', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-lun-6-5', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-lun-6-6', text: 'Curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-lun-6-7', text: 'Press militar (SOLO si AC OK): 3 × 12, poco peso', checked: false },
            { id: 'w-lun-6-8', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MARTES 9 JUNIO — Z2 fácil 45 min
    {
      date: '2026-06-09',
      dayName: 'Martes',
      blocks: [
        {
          id: 'weighin-mar-6', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'workout-mar-6', type: 'workout',
          title: 'Z2 fácil — 45 min (FC < 145)',
          description: 'Aeróbico base. FC < 145 ppm, ritmo libre ~5:40/km.',
          checked: false,
          subItems: [
            { id: 'w-mar-6-1', text: '5 min calentamiento', checked: false },
            { id: 'w-mar-6-2', text: '35 min Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-mar-6-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
            { id: 'w-mar-6-4', text: 'Registrar ritmo y FC media en notas', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // MIÉRCOLES 10 JUNIO — Fuerza tren inferior
    {
      date: '2026-06-10',
      dayName: 'Miércoles',
      specialNote: 'Mañana series 5x1000m. No agotar piernas hoy.',
      blocks: [
        {
          id: 'workout-mie-6', type: 'workout',
          title: 'Fuerza tren inferior + core (45 min)',
          description: 'Mañana calidad: no agotar las piernas hoy.',
          checked: false,
          subItems: [
            { id: 'w-mie-6-1', text: 'Calentamiento caderas 5 min', checked: false },
            { id: 'w-mie-6-2', text: 'Sentadilla mancuernas 4 kg a los lados: 4 × 20', checked: false },
            { id: 'w-mie-6-3', text: 'Zancadas alternas: 4 × 14 por pierna', checked: false },
            { id: 'w-mie-6-4', text: 'Sentadilla búlgara: 4 × 12 por pierna', checked: false },
            { id: 'w-mie-6-5', text: 'Puente glúteos a una pierna: 3 × 12 por pierna', checked: false },
            { id: 'w-mie-6-6', text: 'Elevaciones gemelos: 4 × 25', checked: false },
            { id: 'w-mie-6-7', text: 'Core: plancha 3 × 60s + rotación suave', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // JUEVES 11 JUNIO — CALIDAD: series 5x1000m
    {
      date: '2026-06-11',
      dayName: 'Jueves',
      specialNote: '🎯 Sesión de calidad tipo B: series 5x1000m. Objetivo ritmo ~4:30/km.',
      blocks: [
        {
          id: 'weighin-jue-6', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'pre-match-jue-6', type: 'pre_match',
          title: 'Protocolo pre-calidad',
          checked: false,
          subItems: [
            { id: 'pre-jue-6-1', text: 'Desayuno 2h antes si vas en ayunas: yogur + plátano', checked: false },
            { id: 'pre-jue-6-2', text: 'Hidratación previa: 400 ml agua en los 30 min previos', checked: false },
          ],
        },
        {
          id: 'workout-jue-6', type: 'workout',
          title: 'Series 5×1000m @ ~4:30/km',
          description: '15 min calentamiento + 5×1000m a 4:25-4:35/km con 2 min trote entre + 10 min suave.',
          checked: false,
          subItems: [
            { id: 'w-jue-6-1', text: '15 min calentamiento trote suave + movilidad + 3-4 acelerones 20s', checked: false },
            { id: 'w-jue-6-2', text: 'Serie 1/5: 1000m a ~4:30/km — anotar tiempo', checked: false },
            { id: 'w-jue-6-3', text: '2 min trote suave', checked: false },
            { id: 'w-jue-6-4', text: 'Serie 2/5: 1000m a ~4:30/km', checked: false },
            { id: 'w-jue-6-5', text: '2 min trote suave', checked: false },
            { id: 'w-jue-6-6', text: 'Serie 3/5: 1000m a ~4:30/km', checked: false },
            { id: 'w-jue-6-7', text: '2 min trote suave', checked: false },
            { id: 'w-jue-6-8', text: 'Serie 4/5: 1000m a ~4:30/km', checked: false },
            { id: 'w-jue-6-9', text: '2 min trote suave', checked: false },
            { id: 'w-jue-6-10', text: 'Serie 5/5: 1000m a ~4:30/km', checked: false },
            { id: 'w-jue-6-11', text: '10 min vuelta a la calma trote suave + estiramientos', checked: false },
            { id: 'w-jue-6-12', text: '→ Registrar tiempos de cada serie en notas', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // VIERNES 12 JUNIO — Z2 fácil o descanso
    {
      date: '2026-06-12',
      dayName: 'Viernes',
      specialNote: 'Recuperación post-series. Z2 suave o descanso según sensaciones.',
      blocks: [
        {
          id: 'workout-vie-6', type: 'workout',
          title: 'Z2 fácil 35 min o descanso',
          description: 'Recuperación. Si piernas cargadas: descanso total.',
          checked: false,
          subItems: [
            { id: 'w-vie-6-1', text: 'Opción A: 35 min Z2 suave (FC < 140 ppm)', checked: false },
            { id: 'w-vie-6-2', text: 'Opción B: Descanso completo si piernas cargadas', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // SÁBADO 13 JUNIO — Rodaje largo Z2 65-70 min
    {
      date: '2026-06-13',
      dayName: 'Sábado',
      blocks: [
        {
          id: 'workout-sab-6', type: 'workout',
          title: 'Rodaje largo Z2 — 65-70 min',
          description: 'FC < 145 ppm, ritmo libre ~5:40-6:00/km. Progresión sobre el sábado anterior.',
          checked: false,
          subItems: [
            { id: 'w-sab-6-1', text: '65-70 min carrera continua Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-sab-6-2', text: 'Post: estiramientos completos 10 min', checked: false },
            { id: 'w-sab-6-3', text: '→ Registrar ritmo medio y FC media en notas', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    // DOMINGO 14 JUNIO — Descanso / último fútbol
    {
      date: '2026-06-14',
      dayName: 'Domingo',
      specialNote: 'Descanso. Último partido de fútbol si lo hay — registrar como sesión.',
      blocks: [
        {
          id: 'workout-dom-6', type: 'workout',
          title: 'Descanso / fútbol',
          description: 'Si hay partido de fútbol, registrarlo en notas como sesión.',
          checked: false,
          subItems: [
            { id: 'w-dom-6-1', text: 'Opción A: fútbol (anotar duración y sensaciones)', checked: false },
            { id: 'w-dom-6-2', text: 'Opción B: descanso completo', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },
  ],
}

// Shopping list vacía — módulo eliminado
export const week6ShoppingList = { week: 6, items: [] }
