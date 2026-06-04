import type { Week } from '../types'

export const week5: Week = {
  weekNumber: 5,
  days: [
    {
      date: '2026-06-01',
      dayName: 'Lunes',
      specialNote: 'Recuperación post-torneo. Hoy descanso o paseo suave.',
      blocks: [
        {
          id: 'weighin-lun-5', type: 'weighIn',
          title: 'Pesaje matutino (opcional)',
          description: 'Primera hora, en ayunas. Inicio bloque running.',
          checked: false,
        },
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
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    {
      date: '2026-06-02',
      dayName: 'Martes',
      blocks: [
        {
          id: 'weighin-mar-5', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'workout-mar-5', type: 'workout',
          title: 'Z2 reactivación — 30-40 min',
          description: 'Si piernas muy cargadas: acortar a 25 min. FC < 145 ppm. Sin intensidad.',
          checked: false,
          subItems: [
            { id: 'w-mar-5-1', text: '5 min calentamiento trote suave', checked: false },
            { id: 'w-mar-5-2', text: '20-30 min Z2 (FC < 145 ppm, ritmo libre)', checked: false },
            { id: 'w-mar-5-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    {
      date: '2026-06-03',
      dayName: 'Miércoles',
      specialNote: 'Primera sesión fuerza tren superior. Al 70%: rangos controlados.',
      blocks: [
        {
          id: 'workout-mie-5', type: 'workout',
          title: 'Fuerza tren superior + core (40-45 min)',
          description: 'S1 al 70%. Tempo 3s bajada. Sin press militar.',
          checked: false,
          subItems: [
            { id: 'w-mie-5-1', text: 'Calentamiento hombros 5 min (círculos, movilidad)', checked: false },
            { id: 'w-mie-5-2', text: 'Dominadas: 4 series máx reps (negativas si no salen)', checked: false },
            { id: 'w-mie-5-3', text: 'Press pecho mancuernas 4 kg: 4 × 15-20 (tempo 3s bajada)', checked: false },
            { id: 'w-mie-5-4', text: 'Remo mancuerna a una mano: 4 × 15 por lado', checked: false },
            { id: 'w-mie-5-5', text: 'Elevaciones laterales 4 kg: 3 × 15', checked: false },
            { id: 'w-mie-5-6', text: 'Curl bíceps + extensión tríceps: 3 × 15 cada uno', checked: false },
            { id: 'w-mie-5-7', text: 'Core: plancha 3 × 60s + plancha lateral 3 × 40s/lado', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    {
      date: '2026-06-04',
      dayName: 'Jueves',
      specialNote: '✅ Sesión de calidad completada. Tempo 7.2 km, bloque 20' a 5:03/km @153 ppm.',
      blocks: [
        {
          id: 'weighin-jue-5', type: 'weighIn',
          title: 'Pesaje matutino',
          description: 'Primera hora, en ayunas.',
          checked: false,
        },
        {
          id: 'workout-jue-5', type: 'workout',
          title: '✅ Calidad — Tempo 7.2 km (HECHO)',
          description: 'Bloque 20' a 5:03/km @153 ppm. Sesión registrada.',
          checked: true,
          subItems: [
            { id: 'w-jue-5-1', text: '10 min calentamiento trote suave', checked: true },
            { id: 'w-jue-5-2', text: '20 min tempo a 5:03/km @153 ppm — 7.2 km totales', checked: true },
            { id: 'w-jue-5-3', text: '10 min vuelta a la calma', checked: true },
          ],
        },
      ],
      notes: 'Tempo completado. 7.2km, bloque 20' a 5:03/km, FC 153 ppm.', waterGlasses: 0, closed: true,
    },

    {
      date: '2026-06-05',
      dayName: 'Viernes',
      specialNote: 'Recuperación del umbral. Z2 muy suave o descanso si piernas cargadas.',
      blocks: [
        {
          id: 'workout-vie-5', type: 'workout',
          title: 'Z2 muy suave — 30-35 min (FC < 140)',
          description: 'Recuperación activa. Si piernas cargadas, descanso completo.',
          checked: false,
          subItems: [
            { id: 'w-vie-5-1', text: '5 min calentamiento', checked: false },
            { id: 'w-vie-5-2', text: '20-25 min Z2 muy suave (FC < 140 ppm, ritmo cómodo)', checked: false },
            { id: 'w-vie-5-3', text: '5 min vuelta a la calma + estiramientos', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    {
      date: '2026-06-06',
      dayName: 'Sábado',
      blocks: [
        {
          id: 'workout-sab-5', type: 'workout',
          title: 'Rodaje largo Z2 — 60 min',
          description: 'FC < 145 ppm, ritmo libre ~5:40-6:00/km. Guiarse por FC, no por el reloj.',
          checked: false,
          subItems: [
            { id: 'w-sab-5-1', text: '60 min carrera continua Z2 (FC < 145 ppm)', checked: false },
            { id: 'w-sab-5-2', text: 'Post: estiramientos completos + registro ritmo/FC en notas', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },

    {
      date: '2026-06-07',
      dayName: 'Domingo',
      specialNote: 'Descanso completo.',
      blocks: [
        {
          id: 'workout-dom-5', type: 'workout',
          title: 'Descanso',
          description: 'Recuperación. Paseo suave si apetece.',
          checked: false,
          subItems: [
            { id: 'w-dom-5-1', text: 'Paseo suave opcional 30-40 min', checked: false },
            { id: 'w-dom-5-2', text: 'Estiramientos suaves', checked: false },
          ],
        },
      ],
      notes: '', waterGlasses: 0, closed: false,
    },
  ],
}

// Shopping list vacía — se mantiene por compatibilidad de tipos
export const week5ShoppingList = { week: 5, items: [] }
