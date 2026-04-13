# Cosmo — Corsé Tracker App · Design Spec

**Date:** 2026-04-13  
**Project:** AntiGravity / Cosmo  
**Status:** Approved

---

## Overview

App web PWA para que una chica de 13 años registre las horas que lleva puesto su corsé de escoliosis. El corsé se llama **Cosmo** (nombre editable) y actúa como compañero/amigo motivador. Los padres pueden ver un dashboard de estadísticas protegido por PIN.

**Objetivo diario:** 18 horas  
**Dispositivos principales:** iPhone + iPad (Safari)  
**Idioma:** Español

---

## Arquitectura

### Stack

- Vanilla JS + HTML/CSS — sin build system, sin dependencias npm
- Firebase JS SDK (CDN) — Firestore (datos) + Auth (cuenta familiar única)
- Chart.js (CDN) — gráficas del dashboard de padres
- Service Worker — PWA instalable + notificaciones locales

### Estructura de archivos

```
Cosmo/
  index.html          ← app principal, ambos modos
  app.js              ← lógica principal (modos, sesiones, Cosmo)
  firebase.js         ← inicialización Firebase y operaciones Firestore
  notifications.js    ← programación de notificaciones locales
  sw.js               ← service worker (PWA + notificaciones)
  manifest.json       ← PWA manifest (nombre, icono, color tema)
  styles.css          ← diseño cálido, mobile-first
```

### Flujo de arranque

1. Carga → comprueba sesión Firebase activa
2. Si no hay sesión → pantalla de login (email + contraseña)
3. Si hay sesión → **Modo Cosmo** (siempre por defecto)
4. Botón discreto "👨‍👩‍👧 Padres" → modal de PIN 4 dígitos → **Modo Padres**

---

## Modelo de datos (Firestore)

```
usuarios/{uid}/
  perfil:
    nombreCorse: string          // "Cosmo" por defecto, editable
    objetivoHoras: number        // 18
    pinPadres: string            // PIN hasheado (SHA-256 en cliente)
    fechaInicio: timestamp

  sesiones/{id}/
    inicio: timestamp
    fin: timestamp | null        // null = corsé puesto ahora mismo
    duracionMinutos: number      // calculado al cerrar sesión

  logros/{id}/
    tipo: string                 // ver catálogo abajo
    fecha: timestamp
    visto: boolean               // false = mostrar animación al abrir

  configuracion:
    notificacionesActivas: boolean   // true por defecto
    recordatorioMinutos: number      // 60 por defecto
    horaResumenDiario: string        // "21:00" por defecto
```

**Regla clave:** una sesión con `fin: null` significa corsé puesto en este momento. Solo puede haber una sesión abierta simultáneamente.

Las estadísticas se calculan en cliente leyendo las sesiones — sin Cloud Functions.

---

## Interfaz: Modo Cosmo (ella)

### Pantalla principal (scroll único)

1. **Cabecera mínima** — nombre de Cosmo + icono lápiz para editar
2. **Avatar de Cosmo** — SVG animado, cambia expresión según estado
3. **Mensaje de Cosmo** — texto dinámico según situación y hora del día
4. **Barra de progreso** — hacia las 18h del día, con porcentaje y tiempo acumulado
5. **Botón principal** — grande, centrado, mantener 1.5 segundos para activar
6. **Logros del día** — racha actual + estrellas ganadas hoy

### Botón principal (mantener pulsado 1.5s)

- **Estado SIN corsé:** fondo lavanda suave, texto "Ponerte a Cosmo 💪", Cosmo con carita esperando
- **Estado CON corsé:** fondo melocotón activo, texto "Quitarte a Cosmo 🎽", Cosmo contento
- Al mantener 1.5s → vibración haptica (si disponible) + cambio de estado + mensaje de Cosmo
- **Sin confirmación adicional.** No hay botón deshacer — el mantenimiento prolongado es suficiente protección contra toques accidentales.

---

## Interfaz: Modo Padres (PIN requerido)

### Dashboard

1. **Resumen de hoy** — horas acumuladas, estado actual (puesto/quitado), estrellas
2. **Gráfica semanal** — barras Chart.js con horas por día vs. objetivo (línea roja a 18h)
3. **Historial reciente** — lista de los últimos 7 días con horas y estrellas
4. **Estadísticas globales** — racha actual, mejor racha, % cumplimiento mensual, horas totales acumuladas
5. **Logros desbloqueados** — todos con fecha
6. **Ajustes** — cambiar PIN, cambiar nombre de Cosmo, configurar notificaciones, hora resumen diario

---

## Cosmo — Personaje

### Avatar SVG

Silueta estilizada de un corsé de escoliosis (carcasa rígida tipo Boston/Chêneau):
- Cuerpo: torso redondeado con aperturas laterales características
- Cara: ojos grandes expresivos + sonrisa simple
- Bracitos pequeños a los lados
- Colores: lavanda/melocotón, combinados con la paleta de la app
- Tamaño: prominente en pantalla, ocupa aprox. 40% del viewport

### Estados y animaciones CSS

| Estado | Expresión | Animación |
|---|---|---|
| Corsé puesto, horas correctas | Feliz 😊 | Balanceo suave (keyframe) |
| Corsé puesto, objetivo cumplido | Eufórico 🥳 | Salto + destellos CSS |
| Sin corsé, < 1h | Tranquilo 😌 | Respiración suave (scale) |
| Sin corsé, 1–2h | Echando de menos 🥺 | Mirada hacia abajo |
| Sin corsé, > 2h | Triste 😢 | Cabeza gacha + parpadeo lento |
| Logro desbloqueado | Celebrando ⭐ | Giro + estrellitas animadas |

### Mensajes dinámicos (selección aleatoria por situación)

**Al ponerse el corsé:**
- "¡Allá vamos! Juntos somos imparables 💪"
- "¡Buenos días! Me alegra que estemos juntos 🌅"
- "¡Hola! Te he echado de menos 🌸"

**Corsé puesto, buenas horas:**
- "Estás siendo increíble hoy ✨"
- "Mira qué bien lo estás haciendo 🌟"
- "Cada hora cuenta. Y tú eres de las que cuentan 💎"

**Al cumplir objetivo 18h:**
- "¡18 HORAS! Soy el corsé más orgulloso del mundo 🏆"
- "¡LO HEMOS CONSEGUIDO! Eres una campeona absoluta 🥳✨"

**Sin corsé, echando de menos:**
- "Oye... te echo de menos 🥺 ¿Volvemos?"
- "Aquí esperando, sin prisa. Cuando quieras 💜"
- "Sé que a veces cuesta. Pero tú puedes 🌸"

---

## Sistema de logros

### Estrellas diarias (hasta 3 por día)

- ⭐ Llevar el corsé ≥ 12h ese día
- ⭐⭐ Llevar el corsé ≥ 15h ese día
- ⭐⭐⭐ Llevar el corsé ≥ 18h ese día (objetivo cumplido)

### Logros desbloqueables

| ID | Nombre | Condición |
|---|---|---|
| `primera_vez` | 🌱 Primer día | Primera sesión registrada |
| `racha_3` | 🔥 Racha de 3 | 3 días consecutivos con objetivo cumplido |
| `racha_7` | 💎 Racha de 7 | 7 días consecutivos |
| `racha_30` | 👑 Racha de 30 | 30 días consecutivos |
| `semana_perfecta` | 🌟 Semana perfecta | 7 días seguidos con 3 estrellas |
| `horas_100` | 💪 100 horas | 100 horas acumuladas totales |
| `horas_500` | 🚀 500 horas | 500 horas acumuladas totales |

Al desbloquear un logro: animación celebratoria de Cosmo + mensaje especial + el logro queda marcado como `visto: true` tras mostrarse.

---

## Notificaciones

Implementadas con Service Worker + Notification API local (no requiere servidor push).  
Requiere que la app esté instalada como PWA en Safari iOS 16.4+.

### Tipos

| Tipo | Trigger | Ejemplo de mensaje |
|---|---|---|
| Recordatorio | X minutos sin corsé (configurable, default 60min) | "Cosmo te echa de menos 🥺 ¿Volvemos juntos?" |
| Celebración | Al alcanzar 18h acumuladas en el día | "¡18 horas! ¡Eres una campeona! 🏆✨" |
| Resumen diario | Hora configurable (default 21:00) | "Hoy has llevado a Cosmo 16h 30min. ¡Mañana llegamos a 18! 💪" |

### Lógica de programación

- Al ponerse el corsé → cancelar notificación de recordatorio
- Al quitarse el corsé → programar notificación de recordatorio a +60min
- Al llegar a 18h acumuladas → programar notificación de celebración inmediata
- Cada día a las 21:00 (o hora configurada) → notificación de resumen
- Si el dispositivo está apagado en el momento programado, la notificación no llega (limitación conocida de notificaciones web)

---

## Diseño visual

### Paleta de colores

- Fondo: blanco roto / crema (`#FAF8F5`)
- Primario: lavanda suave (`#C4B5FD`)
- Secundario: melocotón (`#FDBA74`)
- Acento positivo: menta (`#6EE7B7`)
- Texto principal: gris oscuro (`#2D2D2D`)
- Texto secundario: gris medio (`#6B7280`)

### Tipografía

- Fuente: `'Nunito'` (Google Fonts CDN) — redondeada, cálida, legible
- Tamaños grandes para el contador y el botón principal (accesibilidad táctil)

### Principios de diseño

- Mobile-first, optimizado para iPhone y iPad
- Botones con área táctil mínima de 48px
- Sin glassmorphism (a diferencia de otras apps del proyecto) — fondo claro, limpio, cálido
- Animaciones suaves (no agresivas), preferencia por `prefers-reduced-motion`
- Sin modal library — divs ocultos togglados con CSS

---

## Autenticación

- Firebase Auth con email + contraseña
- Una sola cuenta familiar compartida
- Sesión persistente (`setPersistence(browserLocalPersistence)`)
- El PIN de padres (4 dígitos) se hashea con SHA-256 en cliente antes de guardar en Firestore

---

## Instalación como PWA

`manifest.json` con:
- `name`: "Cosmo 🌟"
- `short_name`: "Cosmo"
- `display`: "standalone"
- `background_color`: "#FAF8F5"
- `theme_color`: "#C4B5FD"
- Icono SVG de Cosmo en múltiples tamaños (192px, 512px)

Instrucciones de instalación mostradas en primera visita desde Safari móvil.

---

## Fuera de alcance

- Notificaciones push server-side (requeriría backend propio)
- Multi-usuario / múltiples hijas
- Exportación de datos
- Modo offline completo con sync posterior (los datos se guardan en Firestore en tiempo real)
