import {
  obtenerPerfil, guardarPerfil, obtenerConfig, guardarConfig,
  abrirSesion, cerrarSesionCorse,
  obtenerSesiones, obtenerSesionAbierta,
  obtenerLogros, desbloquearLogro, marcarLogroVisto,
  obtenerComentarios, agregarComentario
} from './firebase.js';

import {
  registrarSW, pedirPermisoNotificaciones,
  programarRecordatorio, cancelarRecordatorio,
  notificarObjetivoCumplido, programarResumenDiario
} from './notifications.js';

// ── ESTADO GLOBAL ────────────────────────────────────────────────
const uid = 'cosmo-familia';
let perfil = { nombreCorse: 'Cosmo', objetivoHoras: 18, miembros: ['Papá', 'Mamá', 'Sofía'], fechaInicio: null };
let comentarios = [];
let config = { notificacionesActivas: true, recordatorioMinutos: 60, horaResumenDiario: '21:00' };
let sesionActiva = null;       // { id, inicio (Timestamp) } o null
let sesiones = [];             // array de todas las sesiones cargadas
let logros = [];               // array de logros desbloqueados
let tickInterval = null;       // setInterval del contador
let objetivoCelebrado = false; // para no notificar dos veces en el mismo día
let chartInstance = null;      // instancia Chart.js

// ── CATÁLOGO DE LOGROS ───────────────────────────────────────────
const CATALOGO_LOGROS = {
  primera_vez:    { icono: '🌱', nombre: 'Primer día', desc: '¡Empezaste tu aventura con Cosmo!' },
  racha_3:        { icono: '🔥', nombre: 'Racha de 3', desc: '3 días consecutivos cumpliendo el objetivo' },
  racha_7:        { icono: '💎', nombre: 'Racha de 7', desc: '7 días seguidos. ¡Increíble constancia!' },
  racha_30:       { icono: '👑', nombre: 'Racha de 30', desc: '30 días seguidos. ¡Eres una leyenda!' },
  semana_perfecta:{ icono: '🌟', nombre: 'Semana perfecta', desc: '7 días seguidos con las 3 estrellas' },
  horas_100:      { icono: '💪', nombre: '100 horas', desc: '100 horas acumuladas con Cosmo' },
  horas_500:      { icono: '🚀', nombre: '500 horas', desc: '500 horas. ¡Una campeona absoluta!' }
};

// ── AVATAR SVG ───────────────────────────────────────────────────
function svgCosmo(estado) {
  const expresiones = {
    'wearing': {
      ojoi: 'M80 100 Q84 96 88 100 Q84 104 80 100Z',
      ojod: 'M104 100 Q108 96 112 100 Q108 104 104 100Z',
      boca: 'M82 118 Q96 128 110 118',
      colorCuerpo: '#E9D5FF',
      colorCorreas: '#FDBA74'
    },
    'goal-reached': {
      ojoi: 'M78 98 Q84 90 90 98',
      ojod: 'M102 98 Q108 90 114 98',
      boca: 'M80 116 Q96 132 112 116',
      colorCuerpo: '#BBF7D0',
      colorCorreas: '#6EE7B7'
    },
    'off-short': {
      ojoi: 'M82 101 Q86 97 90 101 Q86 105 82 101Z',
      ojod: 'M102 101 Q106 97 110 101 Q106 105 102 101Z',
      boca: 'M84 118 Q96 124 108 118',
      colorCuerpo: '#E9D5FF',
      colorCorreas: '#FDBA74'
    },
    'off-medium': {
      ojoi: 'M82 103 Q86 99 90 103 Q86 107 82 103Z',
      ojod: 'M102 103 Q106 99 110 103 Q106 107 102 103Z',
      boca: 'M84 120 Q96 116 108 120',
      colorCuerpo: '#DDD6FE',
      colorCorreas: '#C4B5FD'
    },
    'off-long': {
      ojoi: 'M82 105 Q86 101 90 105 Q86 109 82 105Z',
      ojod: 'M102 105 Q106 101 110 105 Q106 109 102 105Z',
      boca: 'M84 124 Q96 118 108 124',
      colorCuerpo: '#C4B5FD',
      colorCorreas: '#A78BFA'
    },
    'celebrating': {
      ojoi: 'M78 96 Q84 88 90 96',
      ojod: 'M102 96 Q108 88 114 96',
      boca: 'M78 114 Q96 134 114 114',
      colorCuerpo: '#FDE68A',
      colorCorreas: '#FDBA74'
    }
  };

  const e = expresiones[estado] || expresiones['off-short'];
  const destellos = (estado === 'goal-reached' || estado === 'celebrating')
    ? `<text x="20" y="50" font-size="14" opacity="0.9">✨</text>
       <text x="155" y="45" font-size="16" opacity="0.9">⭐</text>
       <text x="170" y="80" font-size="12" opacity="0.8">✨</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 240" role="img" aria-label="Cosmo">
  <rect x="46" y="50" width="100" height="150" rx="30" fill="#FAF8F5" stroke="#E5E7EB" stroke-width="2"/>
  <rect x="60" y="65" width="72" height="120" rx="20" fill="${e.colorCuerpo}"/>
  <ellipse cx="40" cy="115" rx="16" ry="28" fill="${e.colorCuerpo}" stroke="#E5E7EB" stroke-width="1.5"/>
  <ellipse cx="152" cy="115" rx="16" ry="28" fill="${e.colorCuerpo}" stroke="#E5E7EB" stroke-width="1.5"/>
  <rect x="56" y="70" width="80" height="8" rx="4" fill="${e.colorCorreas}"/>
  <rect x="56" y="175" width="80" height="8" rx="4" fill="${e.colorCorreas}"/>
  <path d="${e.ojoi}" fill="#2D2D2D"/>
  <path d="${e.ojod}" fill="#2D2D2D"/>
  <circle cx="76" cy="113" r="7" fill="#FDBA74" opacity="0.4"/>
  <circle cx="116" cy="113" r="7" fill="#FDBA74" opacity="0.4"/>
  <path d="${e.boca}" stroke="#2D2D2D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="18" y="104" width="32" height="14" rx="7" fill="${e.colorCorreas}"/>
  <rect x="142" y="104" width="32" height="14" rx="7" fill="${e.colorCorreas}"/>
  ${destellos}
</svg>`;
}

// ── MENSAJES DE COSMO ────────────────────────────────────────────
const MENSAJES = {
  alPonerse: [
    '¡Allá vamos! Juntos somos imparables 💪',
    '¡Hola! Te he echado de menos 🌸',
    '¡Vamos a por ello! Hoy va a ser un gran día ✨',
    '¡Me alegra que estemos juntos! 🌟'
  ],
  llevando: [
    'Estás siendo increíble hoy ✨',
    'Mira qué bien lo estás haciendo 🌟',
    'Cada hora cuenta. Y tú eres de las que cuentan 💎',
    'Eres más fuerte de lo que crees 💪',
    'Estoy muy orgulloso de ti 🌸'
  ],
  objetivoCumplido: [
    '¡18 HORAS! Soy el corsé más orgulloso del mundo 🏆',
    '¡LO HEMOS CONSEGUIDO! Eres una campeona absoluta 🥳✨',
    '¡18 horas! Esto merece una celebración enorme 🎉'
  ],
  sinCorsePoco: [
    'Aquí esperando, sin prisa. Cuando quieras 💜',
    'Descansando un poco, ¡pero ya tengo ganas de verte! 🌸',
    'Tómate tu tiempo. Aquí estaré ✨'
  ],
  sinCorseMedia: [
    'Oye... te echo de menos 🥺 ¿Volvemos?',
    'Sé que a veces cuesta. Pero tú puedes 🌸',
    'Te espero con ganas. ¡Juntos somos un equipazo! 💪'
  ],
  sinCorseMucho: [
    'Te echo mucho de menos 😢 ¿Cuándo vuelves?',
    'Estoy aquí cuando estés lista. Sin prisa, pero sin pausa 💜',
    '¿Recuerdas que cada hora suma? ¡Volvemos? 🌟'
  ],
  alQuitarse: [
    '¡Hasta luego! Ha sido un placer 🌸',
    'Descansa un ratito. ¡Volvemos pronto! 💜',
    '¡Buen trabajo hoy! Te mereces un descanso ✨'
  ]
};

function mensajeAleatorio(categoria) {
  const arr = MENSAJES[categoria];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── CÁLCULOS ─────────────────────────────────────────────────────

// Fusiona intervalos solapados y devuelve minutos totales dentro del rango [diaInicio, diaFin)
function minutosEnRango(diaInicio, diaFin) {
  const intervalos = [];
  for (const s of sesiones) {
    const sInicio = s.inicio?.toDate ? s.inicio.toDate() : new Date(s.inicio);
    const sFin = s.fin
      ? (s.fin?.toDate ? s.fin.toDate() : new Date(s.fin))
      : (sesionActiva?.id === s.id ? new Date() : null);
    if (!sFin) continue;
    if (sFin <= diaInicio || sInicio >= diaFin) continue;
    const a = Math.max(sInicio.getTime(), diaInicio.getTime());
    const b = Math.min(sFin.getTime(), diaFin.getTime());
    if (b > a) intervalos.push([a, b]);
  }

  // Ordenar y fusionar solapamientos
  intervalos.sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cursor = -1;
  for (const [a, b] of intervalos) {
    if (a > cursor) {
      total += b - a;
      cursor = b;
    } else if (b > cursor) {
      total += b - cursor;
      cursor = b;
    }
  }
  return Math.floor(total / 60000);
}

function calcularMinutosHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const maniana = new Date(hoy);
  maniana.setDate(maniana.getDate() + 1);
  return minutosEnRango(hoy, maniana);
}

function calcularMinutosFecha(fecha) {
  const diaInicio = new Date(fecha);
  diaInicio.setHours(0, 0, 0, 0);
  const diaFin = new Date(diaInicio);
  diaFin.setDate(diaFin.getDate() + 1);
  return minutosEnRango(diaInicio, diaFin);
}

function estrellasParaMinutos(min) {
  if (min >= 18 * 60) return '⭐⭐⭐';
  if (min >= 15 * 60) return '⭐⭐';
  if (min >= 12 * 60) return '⭐';
  return '';
}

function ultimaSesionCerrada() {
  const cerradas = sesiones.filter(s => s.fin !== null);
  if (cerradas.length === 0) return null;
  return cerradas[cerradas.length - 1];
}

function calcularRachas() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Construir array de días (hoy=0, ayer=1, ...) con boolean cumplido
  const cumplidos = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    cumplidos.push(calcularMinutosFecha(d) >= 18 * 60);
  }

  // Racha actual: días consecutivos desde hoy hacia atrás
  let actual = 0;
  for (let i = 0; i < cumplidos.length; i++) {
    if (cumplidos[i]) actual++;
    else break;
  }

  // Mejor racha histórica (puede incluir la actual)
  let mejor = 0;
  let temp = 0;
  for (let i = 0; i < cumplidos.length; i++) {
    if (cumplidos[i]) {
      temp++;
      if (temp > mejor) mejor = temp;
    } else {
      temp = 0;
    }
  }

  return { actual, mejor };
}

function calcularPctMes() {
  const hoy = new Date();
  const diasMes = hoy.getDate();
  let cumplidos = 0;
  for (let i = 0; i < diasMes; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    if (calcularMinutosFecha(d) >= 18 * 60) cumplidos++;
  }
  return Math.round((cumplidos / diasMes) * 100);
}

function calcularTotalMinutos() {
  const intervalos = [];
  for (const s of sesiones) {
    const sInicio = s.inicio?.toDate ? s.inicio.toDate() : new Date(s.inicio);
    const sFin = s.fin
      ? (s.fin?.toDate ? s.fin.toDate() : new Date(s.fin))
      : (sesionActiva?.id === s.id ? new Date() : null);
    if (!sFin || sFin <= sInicio) continue;
    intervalos.push([sInicio.getTime(), sFin.getTime()]);
  }
  intervalos.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cursor = -1;
  for (const [a, b] of intervalos) {
    if (a > cursor) { total += b - a; cursor = b; }
    else if (b > cursor) { total += b - cursor; cursor = b; }
  }
  return Math.floor(total / 60000);
}

function determinarEstadoAvatar() {
  if (sesionActiva) {
    const minHoy = calcularMinutosHoy();
    if (minHoy >= 18 * 60) return 'goal-reached';
    return 'wearing';
  }
  const ultima = ultimaSesionCerrada();
  if (!ultima) return 'off-short';
  const minSin = (Date.now() - ultima.fin.toMillis()) / 60000;
  if (minSin < 60) return 'off-short';
  if (minSin < 120) return 'off-medium';
  return 'off-long';
}

function mensajePorEstado(estado) {
  if (estado === 'goal-reached') return mensajeAleatorio('objetivoCumplido');
  if (estado === 'wearing') return mensajeAleatorio('llevando');
  if (estado === 'off-short') return mensajeAleatorio('sinCorsePoco');
  if (estado === 'off-medium') return mensajeAleatorio('sinCorseMedia');
  return mensajeAleatorio('sinCorseMucho');
}

// ── LOGROS: COMPROBACIÓN ─────────────────────────────────────────
async function comprobarLogros() {
  const tiposYa = new Set(logros.map(l => l.tipo));
  const nuevos = [];

  if (sesiones.length >= 1 && !tiposYa.has('primera_vez')) {
    if (await desbloquearLogro(uid, 'primera_vez')) nuevos.push('primera_vez');
  }

  const { actual } = calcularRachas();
  for (const [tipo, dias] of [['racha_3', 3], ['racha_7', 7], ['racha_30', 30]]) {
    if (actual >= dias && !tiposYa.has(tipo)) {
      if (await desbloquearLogro(uid, tipo)) nuevos.push(tipo);
    }
  }

  if (!tiposYa.has('semana_perfecta')) {
    let consecutivos = 0;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      if (calcularMinutosFecha(d) >= 18 * 60) consecutivos++;
      else break;
    }
    if (consecutivos >= 7) {
      if (await desbloquearLogro(uid, 'semana_perfecta')) nuevos.push('semana_perfecta');
    }
  }

  const totalH = calcularTotalMinutos() / 60;
  if (totalH >= 100 && !tiposYa.has('horas_100')) {
    if (await desbloquearLogro(uid, 'horas_100')) nuevos.push('horas_100');
  }
  if (totalH >= 500 && !tiposYa.has('horas_500')) {
    if (await desbloquearLogro(uid, 'horas_500')) nuevos.push('horas_500');
  }

  if (nuevos.length > 0) {
    logros = await obtenerLogros(uid);
    for (const tipo of nuevos) {
      const l = logros.find(x => x.tipo === tipo);
      if (l) mostrarModalLogro(l);
    }
  }
}

// ── VISTAS ───────────────────────────────────────────────────────
function mostrarVista(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── ACTUALIZAR UI MODO COSMO ─────────────────────────────────────
function actualizarUICosmo() {
  const estado = determinarEstadoAvatar();
  const wrap = document.getElementById('cosmo-avatar-wrap');
  wrap.innerHTML = svgCosmo(estado);
  wrap.className = `cosmo-avatar-wrap state-${estado}`;

  document.getElementById('cosmo-name-display').textContent = perfil.nombreCorse || 'Cosmo';

  const btn = document.getElementById('btn-toggle');
  const btnText = document.getElementById('btn-toggle-text');
  if (sesionActiva) {
    btn.className = 'btn-toggle btn-wearing-on';
    btnText.textContent = `Quitarte a ${perfil.nombreCorse || 'Cosmo'} 🎽`;
  } else {
    btn.className = 'btn-toggle btn-wearing-off';
    btnText.textContent = `Ponerte a ${perfil.nombreCorse || 'Cosmo'} 💪`;
  }
  btn.setAttribute('aria-label', sesionActiva ? 'Quitar corsé' : 'Poner corsé');

  const minHoy = calcularMinutosHoy();
  const pct = Math.min(100, Math.round((minHoy / (18 * 60)) * 100));
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  const h = Math.floor(minHoy / 60);
  const m = minHoy % 60;
  document.getElementById('progress-hours').textContent = `${h}h ${m}min`;

  document.getElementById('stars-display').textContent = estrellasParaMinutos(minHoy) || '—';
  const { actual } = calcularRachas();
  document.getElementById('streak-display').textContent = `${actual} días 🔥`;

  if (minHoy >= 18 * 60 && !objetivoCelebrado && config.notificacionesActivas) {
    objetivoCelebrado = true;
    notificarObjetivoCumplido(perfil.nombreCorse || 'Cosmo');
  }

  // Actualizar mensaje solo si no hay mensaje reciente de acción
  const msgEl = document.getElementById('cosmo-message');
  if (!msgEl.dataset.locked) {
    msgEl.textContent = mensajePorEstado(estado);
  }
}

function iniciarTicker() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(async () => {
    // Refrescar sesiones desde Firestore para sincronizar entre dispositivos
    try {
      sesiones = await obtenerSesiones(uid, 35);
      sesionActiva = resolverSesionActiva(sesiones);
    } catch (_) { /* si falla, usamos los datos que ya tenemos */ }

    actualizarUICosmo();
    const msgEl = document.getElementById('cosmo-message');
    delete msgEl.dataset.locked;
  }, 30000);
}

// Refrescar al volver a primer plano (cambio de pestaña / desbloqueo del móvil)
document.addEventListener('visibilitychange', async function() {
  if (document.visibilityState === 'visible') {
    try {
      sesiones = await obtenerSesiones(uid, 35);
      sesionActiva = resolverSesionActiva(sesiones);
      actualizarUICosmo();
    } catch (_) {}
  }
});


// Devuelve la sesión abierta más reciente de entre todas las sesiones cargadas.
// Ignora sesiones huérfanas antiguas (fin=null de pruebas) eligiendo siempre la de inicio más reciente.
function resolverSesionActiva(todasLasSesiones) {
  const abiertas = todasLasSesiones.filter(s => s.fin == null);
  if (abiertas.length === 0) return null;
  return abiertas.reduce((mejor, s) => {
    const tMejor = mejor.inicio?.toDate ? mejor.inicio.toDate().getTime() : 0;
    const tS = s.inicio?.toDate ? s.inicio.toDate().getTime() : 0;
    return tS > tMejor ? s : mejor;
  });
}

// ── ARRANQUE ─────────────────────────────────────────────────────
async function cargarDatos() {
  const [p, c, ses, lg, coms] = await Promise.all([
    obtenerPerfil(uid).then(p => p || perfil),
    obtenerConfig(uid),
    obtenerSesiones(uid, 35),
    obtenerLogros(uid),
    obtenerComentarios(uid)
  ]);
  perfil = p;
  if (!perfil.miembros) perfil.miembros = ['Papá', 'Mamá', 'Sofía'];
  config = c;
  sesiones = ses;
  logros = lg;
  comentarios = coms;
  // Elegir la más reciente entre todas las abiertas — evita sesiones huérfanas
  sesionActiva = resolverSesionActiva(sesiones);
}

async function init() {
  await registrarSW();

  const esIOS = /iphone|ipad/i.test(navigator.userAgent);
  const esSafariStandalone = window.navigator.standalone;
  if (esIOS && !esSafariStandalone) {
    document.getElementById('banner-pwa').classList.remove('hidden');
  }

  try {
    await cargarDatos();
  } catch (err) {
    console.error('Error cargando datos:', err);
    // Seguir con datos vacíos — puede estar offline la primera vez
  }

  if (!perfil.fechaInicio) {
    perfil.fechaInicio = new Date();
    await guardarPerfil(uid, perfil).catch(() => {});
  }

  if (config.notificacionesActivas) await pedirPermisoNotificaciones();

  programarResumenDiario(
    config.horaResumenDiario || '21:00',
    function() {
      const min = calcularMinutosHoy();
      return { horas: Math.floor(min / 60), minutos: min % 60 };
    },
    perfil.nombreCorse || 'Cosmo'
  );

  const noVistos = logros.filter(l => !l.visto);
  for (const l of noVistos) mostrarModalLogro(l);

  mostrarVista('view-cosmo');
  actualizarUICosmo();
  renderComentarios();
  iniciarTicker();
}

// ── BOTÓN HOLD (1.5 segundos) ────────────────────────────────────
let holdTimer = null;

const btnToggle = document.getElementById('btn-toggle');
const holdRing = document.getElementById('btn-hold-ring');

function iniciarHold() {
  if (holdTimer) return; // guard: prevent double-fire on iOS (pointerdown + touchstart)
  holdRing.classList.remove('filling');
  void holdRing.offsetWidth;
  holdRing.classList.add('filling');

  holdTimer = setTimeout(async function() {
    holdRing.classList.remove('filling');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    await toggleSesion();
  }, 1500);
}

function cancelarHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  holdRing.classList.remove('filling');
  void holdRing.offsetWidth;
}

btnToggle.addEventListener('pointerdown', iniciarHold);
btnToggle.addEventListener('pointerup', cancelarHold);
btnToggle.addEventListener('pointerleave', cancelarHold);
btnToggle.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// Touch events como refuerzo para iOS Safari
btnToggle.addEventListener('touchstart', function(e) { e.preventDefault(); iniciarHold(); }, { passive: false });
btnToggle.addEventListener('touchend', function(e) { e.preventDefault(); cancelarHold(); }, { passive: false });
btnToggle.addEventListener('touchcancel', cancelarHold);

async function toggleSesion() {
  if (sesionActiva) {
    try {
      await cerrarSesionCorse(uid, sesionActiva.id, sesionActiva.inicio);
      // Only mutate local state after Firebase confirms the session was closed
      const idx = sesiones.findIndex(s => s.id === sesionActiva.id);
      if (idx >= 0) {
        const durMin = Math.floor((Date.now() - sesionActiva.inicio.toMillis()) / 60000);
        sesiones[idx] = {
          ...sesiones[idx],
          fin: { toMillis: () => Date.now(), toDate: () => new Date() },
          duracionMinutos: durMin
        };
      }
      sesionActiva = null;
      if (config.notificacionesActivas) {
        programarRecordatorio(perfil.nombreCorse || 'Cosmo', config.recordatorioMinutos || 60);
      }
      const msgEl = document.getElementById('cosmo-message');
      msgEl.textContent = mensajeAleatorio('alQuitarse');
      msgEl.dataset.locked = '1';
      setTimeout(() => delete msgEl.dataset.locked, 5000);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      return; // Don't update UI if Firebase failed
    }
  } else {
    try {
      cancelarRecordatorio();
      // Verificar que no hay ya una abierta en el estado local (evita duplicados)
      const yaAbierta = resolverSesionActiva(sesiones);
      if (yaAbierta) {
        sesionActiva = yaAbierta;
        actualizarUICosmo();
        return;
      }
      const id = await abrirSesion(uid);
      // Only mutate local state after Firebase confirms the session was created
      const now = { toMillis: () => Date.now(), toDate: () => new Date() };
      sesionActiva = { id, inicio: now };
      sesiones.push({ id, inicio: now, fin: null, duracionMinutos: 0 });
      const minHoy = calcularMinutosHoy();
      if (minHoy < 18 * 60) objetivoCelebrado = false;
      const msgEl = document.getElementById('cosmo-message');
      msgEl.textContent = mensajeAleatorio('alPonerse');
      msgEl.dataset.locked = '1';
      setTimeout(() => delete msgEl.dataset.locked, 5000);
    } catch (err) {
      console.error('Error al abrir sesión:', err);
      return; // Don't update UI if Firebase failed
    }
  }

  actualizarUICosmo();
  await comprobarLogros();
}

// ── EDITAR NOMBRE ────────────────────────────────────────────────
document.getElementById('btn-edit-name').addEventListener('click', function() {
  document.getElementById('input-new-name').value = perfil.nombreCorse || 'Cosmo';
  document.getElementById('modal-edit-name').classList.remove('hidden');
});

document.getElementById('btn-cancel-name').addEventListener('click', function() {
  document.getElementById('modal-edit-name').classList.add('hidden');
});

document.getElementById('btn-save-name').addEventListener('click', async function() {
  const nuevo = document.getElementById('input-new-name').value.trim() || 'Cosmo';
  try {
    await guardarPerfil(uid, { nombreCorse: nuevo });
    perfil.nombreCorse = nuevo;
    document.getElementById('modal-edit-name').classList.add('hidden');
    actualizarUICosmo();
  } catch (err) {
    console.error('Error guardando nombre:', err);
    alert('No se pudo guardar el nombre. Comprueba tu conexión.');
  }
});

// ── MODAL LOGRO DESBLOQUEADO ─────────────────────────────────────
function mostrarModalLogro(logro) {
  const cat = CATALOGO_LOGROS[logro.tipo];
  if (!cat) return;
  document.getElementById('modal-logro-icono').textContent = cat.icono;
  document.getElementById('modal-logro-nombre').textContent = `¡${cat.nombre}!`;
  document.getElementById('modal-logro-desc').textContent = cat.desc;
  document.getElementById('modal-logro').classList.remove('hidden');

  const wrap = document.getElementById('cosmo-avatar-wrap');
  wrap.innerHTML = svgCosmo('celebrating');
  wrap.className = 'cosmo-avatar-wrap state-celebrating';

  document.getElementById('btn-cerrar-logro').onclick = async function() {
    document.getElementById('modal-logro').classList.add('hidden');
    try {
      await marcarLogroVisto(uid, logro.id);
    } catch (err) {
      console.error('Error marcando logro como visto:', err);
    }
    actualizarUICosmo();
  };
}

// ── BANNER PWA ───────────────────────────────────────────────────
document.getElementById('btn-cerrar-banner').addEventListener('click', function() {
  document.getElementById('banner-pwa').classList.add('hidden');
});

// ── ACCESO FAMILIA ───────────────────────────────────────────────────────────────
document.getElementById('btn-padres').addEventListener('click', async function() {
  await abrirModoPadres();
});

// ── MODO PADRES ──────────────────────────────────────────────────
async function abrirModoPadres() {
  sesiones = await obtenerSesiones(uid, 35);
  logros = await obtenerLogros(uid);
  renderDashboardPadres();
  mostrarVista('view-padres');
}

document.getElementById('btn-volver-cosmo').addEventListener('click', function() {
  mostrarVista('view-cosmo');
  actualizarUICosmo();
});

function renderDashboardPadres() {
  const minHoy = calcularMinutosHoy();
  const hHoy = Math.floor(minHoy / 60);
  const mHoy = minHoy % 60;
  document.getElementById('padres-horas-hoy').textContent = `${hHoy}h ${mHoy}m`;
  document.getElementById('padres-estado').textContent = sesionActiva ? '🟢 Puesto' : '⚫ Quitado';
  document.getElementById('padres-estrellas-hoy').textContent = estrellasParaMinutos(minHoy) || '—';

  const { actual, mejor } = calcularRachas();
  document.getElementById('stat-racha').textContent = actual;
  document.getElementById('stat-mejor-racha').textContent = mejor;
  document.getElementById('stat-pct-mes').textContent = `${calcularPctMes()}%`;
  const totalMin = calcularTotalMinutos();
  document.getElementById('stat-horas-total').textContent = `${Math.floor(totalMin / 60)}h`;

  renderHistorial();
  renderGraficaSemanal();
  renderLogros();

  document.getElementById('ajuste-nombre').value = perfil.nombreCorse || 'Cosmo';
  document.getElementById('ajuste-recordatorio').value = config.recordatorioMinutos || 60;
  document.getElementById('ajuste-hora-resumen').value = config.horaResumenDiario || '21:00';
  document.getElementById('ajuste-notificaciones').checked = config.notificacionesActivas !== false;
  const miembros = perfil.miembros || ['Papá', 'Mamá', 'Sofía'];
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`ajuste-miembro-${i}`);
    if (el) el.value = miembros[i] || '';
  }
}

function renderHistorial() {
  const lista = document.getElementById('historial-lista');
  lista.innerHTML = '';
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const min = calcularMinutosFecha(d);
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ok = min >= 18 * 60;
    const stars = estrellasParaMinutos(min);

    const nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    const row = document.createElement('div');
    row.className = 'historial-row';
    row.innerHTML = `
      <span class="historial-fecha">${i === 0 ? 'Hoy' : nombreDia}</span>
      <span class="historial-horas">${min > 0 ? `${h}h ${m}m` : '—'}</span>
      <span class="historial-stars">${stars}</span>
      <span class="${ok ? 'historial-ok' : 'historial-warn'}">${ok ? '✓' : min > 0 ? '!' : '—'}</span>
    `;
    lista.appendChild(row);
  }
}

function renderLogros() {
  const lista = document.getElementById('logros-lista');
  lista.innerHTML = '';
  const tiposDesbloqueados = new Map(logros.map(l => [l.tipo, l]));

  for (const [tipo, cat] of Object.entries(CATALOGO_LOGROS)) {
    const desbloqueado = tiposDesbloqueados.get(tipo);
    const card = document.createElement('div');
    card.className = `logro-card${desbloqueado ? ' unlocked' : ''}`;
    let fechaStr = '';
    if (desbloqueado?.fecha?.toDate) {
      fechaStr = desbloqueado.fecha.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    card.innerHTML = `
      <span class="logro-icono">${cat.icono}</span>
      <span class="logro-nombre">${cat.nombre}</span>
      <span class="logro-fecha">${desbloqueado ? fechaStr : cat.desc}</span>
    `;
    lista.appendChild(card);
  }
}

// ── GRÁFICA SEMANAL ──────────────────────────────────────────────
function renderGraficaSemanal() {
  const labels = [];
  const datos = [];
  const colores = [];
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const min = calcularMinutosFecha(d);
    const horas = min / 60;
    const nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short' });
    labels.push(i === 0 ? 'Hoy' : nombreDia);
    datos.push(Math.round(horas * 10) / 10);
    colores.push(horas >= 18 ? '#6EE7B7' : horas >= 12 ? '#C4B5FD' : '#FDBA74');
  }

  const ctx = document.getElementById('chart-semana').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Horas con Cosmo',
        data: datos,
        backgroundColor: colores,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) { return `${ctx.raw}h`; }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 20,
          ticks: {
            callback: function(v) { return `${v}h`; },
            font: { family: 'Nunito', size: 11 }
          },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { font: { family: 'Nunito', size: 11 } },
          grid: { display: false }
        }
      }
    },
    plugins: [{
      id: 'objetivo-line',
      afterDraw: function(chart) {
        const { ctx: c, scales: { y, x } } = chart;
        const yPos = y.getPixelForValue(18);
        c.save();
        c.strokeStyle = '#EF4444';
        c.lineWidth = 1.5;
        c.setLineDash([6, 4]);
        c.beginPath();
        c.moveTo(x.left, yPos);
        c.lineTo(x.right, yPos);
        c.stroke();
        c.fillStyle = '#EF4444';
        c.font = '10px Nunito';
        c.fillText('18h', x.right + 4, yPos + 4);
        c.restore();
      }
    }]
  });
}

// ── AJUSTES ──────────────────────────────────────────────────────
document.getElementById('btn-guardar-ajustes').addEventListener('click', async function() {
  const nuevoNombre = document.getElementById('ajuste-nombre').value.trim() || 'Cosmo';
  const nuevoRecordatorio = parseInt(document.getElementById('ajuste-recordatorio').value) || 60;
  const nuevaHoraResumen = document.getElementById('ajuste-hora-resumen').value || '21:00';
  const nuevasNotif = document.getElementById('ajuste-notificaciones').checked;
  const nuevosMiembros = [0, 1, 2].map(i =>
    (document.getElementById(`ajuste-miembro-${i}`)?.value || '').trim()
  ).filter(Boolean);
  if (nuevosMiembros.length < 1) { alert('Añade al menos un miembro'); return; }

  perfil.nombreCorse = nuevoNombre;
  perfil.miembros = nuevosMiembros;
  config.recordatorioMinutos = nuevoRecordatorio;
  config.horaResumenDiario = nuevaHoraResumen;
  config.notificacionesActivas = nuevasNotif;

  try {
    await Promise.all([
      guardarPerfil(uid, { nombreCorse: nuevoNombre, miembros: nuevosMiembros }),
      guardarConfig(uid, {
        recordatorioMinutos: nuevoRecordatorio,
        horaResumenDiario: nuevaHoraResumen,
        notificacionesActivas: nuevasNotif
      })
    ]);
  } catch (err) {
    console.error('Error guardando ajustes:', err);
    alert('No se pudieron guardar los ajustes. Comprueba tu conexión.');
    return;
  }

  programarResumenDiario(
    nuevaHoraResumen,
    function() {
      const min = calcularMinutosHoy();
      return { horas: Math.floor(min / 60), minutos: min % 60 };
    },
    nuevoNombre
  );

  alert('✅ Ajustes guardados');
});


// ── COMENTARIOS ──────────────────────────────────────────────────
function formatearFechaRelativa(fecha) {
  if (!fecha) return '';
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function renderComentarios() {
  const lista = document.getElementById('comentarios-lista');
  lista.innerHTML = '';
  if (comentarios.length === 0) {
    lista.innerHTML = '<p style="text-align:center;color:#9CA3AF;font-size:13px;padding:16px">Sé el primero en dejar un ánimo 💜</p>';
    return;
  }
  for (const c of comentarios) {
    const inicial = (c.autor || '?')[0].toUpperCase();
    const card = document.createElement('div');
    card.className = 'comentario-card';
    card.innerHTML = `
      <div class="comentario-avatar">${inicial}</div>
      <div class="comentario-body">
        <div class="comentario-meta">
          <span class="comentario-autor">${c.autor}</span>
          <span class="comentario-fecha">${formatearFechaRelativa(c.fecha)}</span>
        </div>
        <p class="comentario-texto">${c.texto}</p>
      </div>
    `;
    lista.appendChild(card);
  }
}

function mostrarModalQuienEres(callback) {
  const miembros = perfil.miembros || ['Papá', 'Mamá', 'Sofía'];
  const botonesEl = document.getElementById('quien-eres-botones');
  botonesEl.innerHTML = '';
  for (const nombre of miembros) {
    const btn = document.createElement('button');
    btn.className = 'btn-quien';
    btn.textContent = nombre;
    btn.addEventListener('click', function() {
      localStorage.setItem('cosmo_autor', nombre);
      document.getElementById('modal-quien-eres').classList.add('hidden');
      callback(nombre);
    });
    botonesEl.appendChild(btn);
  }
  document.getElementById('modal-quien-eres').classList.remove('hidden');
}

async function enviarComentario() {
  const input = document.getElementById('input-comentario');
  const texto = input.value.trim();
  if (!texto) return;

  const autorGuardado = localStorage.getItem('cosmo_autor');

  const doEnvio = async (autor) => {
    input.value = '';
    try {
      await agregarComentario(uid, autor, texto);
      comentarios = await obtenerComentarios(uid);
      renderComentarios();
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('No se pudo enviar el comentario. Comprueba tu conexión.');
    }
  };

  if (autorGuardado) {
    await doEnvio(autorGuardado);
  } else {
    mostrarModalQuienEres(doEnvio);
  }
}

document.getElementById('btn-enviar-comentario').addEventListener('click', enviarComentario);
document.getElementById('input-comentario').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') enviarComentario();
});

// ── INICIO ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
