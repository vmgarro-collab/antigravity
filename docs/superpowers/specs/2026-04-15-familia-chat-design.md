# FamiliaChat — Spec de diseño

**Fecha:** 2026-04-15  
**Módulo:** `/Familia/`  
**Estado:** Aprobado

---

## Resumen

App de mensajería privada para 4 miembros de la familia (Papá, Mamá, Sofía, Martín). Un único chat grupal en tiempo real, con notificaciones push en iOS y PC. Sin backend propio — todo via Firebase.

---

## Usuarios

| Usuario | Dispositivo |
|---------|------------|
| Papá    | iPhone + PC (navegador) |
| Mamá    | iPhone |
| Sofía   | iPhone |
| Martín  | iPhone |

---

## Arquitectura

### Firebase (plan Spark — gratuito)

- **Firestore** — base de datos en tiempo real. Colección única `messages`.
- **Firebase Cloud Messaging (FCM)** — notificaciones push.
- **Firebase SDK** cargado via CDN, sin build system ni npm.

### Estructura de datos

```js
// Colección: messages
{
  id: auto,
  sender: "papa" | "mama" | "sofia" | "martin",
  text: String,
  timestamp: ServerTimestamp
}

// Colección: users (tokens FCM por dispositivo)
{
  userId: "papa" | "mama" | "sofia" | "martin",
  fcmToken: String,
  updatedAt: ServerTimestamp
}
```

### PWA

- `manifest.json` — permite "Añadir a pantalla de inicio" en iOS/Android
- `sw.js` — service worker para recibir notificaciones FCM con la app cerrada
- iOS requiere instalación en pantalla de inicio para notificaciones (Safari → Compartir → Añadir a pantalla de inicio)
- PC (Chrome/Edge): notificaciones sin instalación

---

## Archivos

```
Familia/
  index.html      — estructura HTML + carga de scripts
  app.js          — lógica del chat, Firebase, login, mensajes
  sw.js           — service worker (FCM background notifications)
  manifest.json   — PWA manifest
  styles.css      — estilos
```

---

## Login

- Primera vez: pantalla "¿Quién eres?" con 4 botones (Papá, Mamá, Sofía, Martín)
- Selección guardada en `localStorage` como `familia_user`
- Las siguientes veces abre directamente el chat
- Sin contraseña ni PIN
- Para cambiar de usuario: botón "Cambiar" en el chat (esquina discreta)

---

## Chat

- Suscripción en tiempo real con `onSnapshot` de Firestore (últimos 100 mensajes)
- Mensajes propios a la derecha, del resto a la izquierda
- Burbuja con nombre del remitente + hora
- Color de burbuja distinto por usuario (4 colores cálidos)
- Scroll automático al último mensaje al recibir uno nuevo
- Input fijo en la parte inferior con botón "Enviar"
- Envío también con tecla Enter (útil en PC)

---

## Notificaciones push

- Al entrar al chat por primera vez: solicitar permiso de notificaciones
- Token FCM del dispositivo guardado en Firestore (colección `users`)
- Al enviar un mensaje, una **Firebase Cloud Function** (o regla de Firestore + extensión FCM) notifica a los otros 3 dispositivos
- Texto de notificación: `"Papá: Hola a todos!"`
- El service worker (`sw.js`) recibe el push y muestra la notificación del sistema

> **Nota sobre FCM:** El envío de notificaciones a otros dispositivos requiere ejecutar código en servidor (no se puede hacer desde el navegador por seguridad). Se usará **Firebase Cloud Functions** (plan Blaze) o la extensión "Trigger Email" como alternativa. Si el plan Blaze supone fricción, la primera versión puede funcionar sin notificaciones y añadirlas en una segunda iteración.

---

## Estilo visual

- Estilo cálido y familiar, **no glassmorphism**
- Fondo oscuro suave (`#1a1a2e` o similar), no negro puro
- Tipografía grande y legible
- Colores de burbuja por usuario:
  - Papá: azul suave
  - Mamá: verde suave
  - Sofía: naranja/coral
  - Martín: morado suave
- Sin neón, sin blur intenso

---

## Setup inicial (una vez)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com) (gratuito)
2. Activar Firestore y FCM
3. Copiar las credenciales (`firebaseConfig`) en `app.js`
4. Cada familiar: abrir la URL en Safari → Compartir → "Añadir a pantalla de inicio"
5. Seleccionar su nombre al abrir la app

---

## Escalabilidad futura

- **Llamadas/video:** WebRTC con Firebase como servidor de señalización. La arquitectura actual lo soporta sin cambios estructurales.
- **Más usuarios:** Solo añadir entradas en el array de usuarios hardcodeado.
- **Conversaciones privadas:** Añadir colecciones adicionales en Firestore (`messages_1on1`).

---

## Lo que esta versión NO incluye

- Mensajes privados 1 a 1
- Edición o borrado de mensajes
- Envío de imágenes o archivos
- Indicador de "visto"
- Indicador de "escribiendo..."
