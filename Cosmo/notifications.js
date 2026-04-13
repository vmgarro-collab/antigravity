// IDs de timeout en memoria para poder cancelarlos
let timerRecordatorio = null;
let timerResumen = null;

/** Registra el Service Worker si no está registrado. */
export async function registrarSW() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('SW no registrado:', e);
    return false;
  }
}

/** Pide permiso de notificaciones. Devuelve true si concedido. */
export async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Envía notificación al SW para mostrarla. */
async function mostrarNotificacion(title, body, tag) {
  if (Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
}

/**
 * Programa recordatorio si el corsé lleva X minutos quitado.
 * @param {string} nombreCorse - "Cosmo" o el nombre que haya puesto
 * @param {number} minutos - minutos de espera
 */
export function programarRecordatorio(nombreCorse, minutos) {
  cancelarRecordatorio();
  timerRecordatorio = setTimeout(() => {
    mostrarNotificacion(
      `${nombreCorse} te echa de menos 🥺`,
      '¿Volvemos juntos? Llevas un rato sin ponértelo 💜',
      'recordatorio'
    );
  }, minutos * 60 * 1000);
}

/** Cancela el recordatorio pendiente. */
export function cancelarRecordatorio() {
  if (timerRecordatorio) {
    clearTimeout(timerRecordatorio);
    timerRecordatorio = null;
  }
}

/**
 * Notificación inmediata de celebración al cumplir el objetivo.
 * @param {string} nombreCorse
 */
export function notificarObjetivoCumplido(nombreCorse) {
  mostrarNotificacion(
    `¡18 horas con ${nombreCorse}! 🏆`,
    '¡Eres una campeona absoluta! Lo hemos conseguido 🥳✨',
    'objetivo'
  );
}

/**
 * Programa resumen diario a la hora indicada.
 * @param {string} hora - "21:00"
 * @param {Function} obtenerResumen - función que devuelve { horas, minutos }
 * @param {string} nombreCorse
 */
export function programarResumenDiario(hora, obtenerResumen, nombreCorse) {
  cancelarResumenDiario();
  const [h, m] = hora.split(':').map(Number);
  const ahora = new Date();
  const objetivo = new Date();
  objetivo.setHours(h, m, 0, 0);
  if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1);
  const msHasta = objetivo.getTime() - ahora.getTime();

  timerResumen = setTimeout(async () => {
    const { horas, minutos } = obtenerResumen();
    const texto = horas >= 18
      ? `¡18 horas hoy! Increíble 🏆 Hasta mañana 🌙`
      : `Hoy llevas ${horas}h ${minutos}min con ${nombreCorse}. ¡Mañana a por las 18! 💪`;
    await mostrarNotificacion(`Resumen del día con ${nombreCorse}`, texto, 'resumen');
    // Re-programar para el día siguiente
    programarResumenDiario(hora, obtenerResumen, nombreCorse);
  }, msHasta);
}

/** Cancela el resumen diario pendiente. */
export function cancelarResumenDiario() {
  if (timerResumen) {
    clearTimeout(timerResumen);
    timerResumen = null;
  }
}
