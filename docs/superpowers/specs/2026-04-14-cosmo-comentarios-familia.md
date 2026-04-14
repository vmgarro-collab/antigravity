# Spec: Comentarios de ánimo familiares en Cosmo

**Fecha:** 2026-04-14  
**Estado:** Aprobado

---

## Resumen

Añadir un feed de comentarios de ánimo en la pantalla principal de Cosmo, visible y escribible por todos los miembros de la familia (Sofía, Papá, Mamá). Cada dispositivo recuerda quién es su usuario. El dashboard de padres pierde el PIN y pasa a ser accesible libremente, añadiendo configuración de nombres de miembros.

---

## Cambios en pantalla principal

Un bloque al fondo de `view-cosmo`, debajo del contador y logros:

- **Feed con scroll** mostrando los últimos 50 comentarios, ordenados del más reciente al más antiguo
- Cada entrada muestra: inicial del autor (avatar), nombre, texto y fecha/hora relativa
- **Campo de texto + botón Enviar** encima del feed
- Al pulsar Enviar por primera vez en un dispositivo sin nombre configurado → dispara el modal de identificación

---

## Modal "¿Quién eres tú?"

Aparece solo la primera vez en cada dispositivo (o si el localStorage está vacío).

- Título: "¿Quién eres tú?"
- Muestra los nombres de los miembros como botones grandes (obtenidos del perfil en Firestore)
- Al elegir → guarda `cosmo_autor` en `localStorage` → cierra modal → envía el comentario
- No hay opción de "Anónimo" — debe elegir un nombre

---

## Dashboard — sin PIN

- Eliminar el modal de PIN y toda su lógica
- El botón "Padres" pasa a llamarse "Familia" (o similar) y abre el dashboard directamente
- Añadir sección "Miembros de la familia" en ajustes del dashboard con 3 campos editables (nombres)
- Los nombres se guardan en `perfil.miembros` en Firestore (array de strings)
- Por defecto: `["Papá", "Mamá", "Sofía"]`
- Cambiar un nombre actualiza futuros comentarios; los anteriores conservan el nombre con el que se escribieron

---

## Modelo de datos Firebase

Nueva colección:

```
usuarios/cosmo-familia/comentarios/{id}
  autor:  string        // nombre del autor al momento de escribir
  texto:  string        // contenido del comentario
  fecha:  Timestamp     // serverTimestamp()
```

Límite de carga: últimos 50 comentarios (`orderBy('fecha', 'desc'), limit(50)`).

---

## Nuevas funciones en firebase.js

```js
obtenerComentarios(uid)       // últimos 50, desc
agregarComentario(uid, autor, texto)
```

---

## localStorage

| Clave | Valor |
|-------|-------|
| `cosmo_autor` | Nombre elegido por el usuario en este dispositivo |

---

## Flujo de primer uso

1. Usuario abre la app → ve pantalla principal
2. Intenta enviar comentario → modal "¿Quién eres tú?" con botones de nombres
3. Elige nombre → `localStorage.setItem('cosmo_autor', nombre)` → envía comentario
4. A partir de ahora, ese dispositivo siempre comenta como ese nombre

---

## Fuera de alcance

- Notificaciones push al recibir un comentario
- Eliminar comentarios
- Reacciones / emojis en comentarios
- Autenticación por usuario
