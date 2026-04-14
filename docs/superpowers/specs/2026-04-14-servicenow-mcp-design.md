# ServiceNow MCP Server — Spec

**Fecha:** 2026-04-14
**Fase:** 1 — Gestión de incidentes (CRUD completo)

---

## Objetivo

Servidor MCP local en Python que conecta Claude Code con una instancia ServiceNow de empresa, permitiendo gestionar incidentes en lenguaje natural vía Basic Auth.

---

## Arquitectura

```
Claude Code  ←—stdio—→  servicenow-mcp (Python)  ←—HTTPS/Basic Auth—→  ServiceNow
```

El servidor corre como proceso local. Claude Code lo lanza automáticamente al arrancar, según la configuración en `claude_desktop_config.json`.

### Estructura del repo (independiente de AntiGravity)

```
servicenow-mcp/
├── server.py          # Punto de entrada; registra las tools MCP y arranca el servidor
├── servicenow.py      # Cliente HTTP genérico hacia ServiceNow (httpx + Basic Auth)
├── .env               # Credenciales — gitignored
├── .env.example       # Plantilla pública de variables de entorno
├── requirements.txt   # mcp, httpx, python-dotenv
└── README.md
```

---

## Configuración

### Variables de entorno (`.env`)

```
SN_INSTANCE=https://tuempresa.service-now.com
SN_USERNAME=tu_usuario
SN_PASSWORD=tu_contraseña
```

### Registro en Claude Code (`~/.claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "servicenow": {
      "command": "python",
      "args": ["/ruta/absoluta/servicenow-mcp/server.py"]
    }
  }
}
```

---

## Cliente HTTP (`servicenow.py`)

Clase `ServiceNowClient` con:
- Autenticación Basic Auth en todas las peticiones
- Headers estándar: `Content-Type: application/json`, `Accept: application/json`
- Método genérico `get(table, params)` y `post/patch(table, data)` para reutilización futura
- Timeout de 15 segundos; un único reintento automático ante fallo de red
- Propagación de errores HTTP con mensaje descriptivo

---

## Tools MCP (`server.py`)

### `search_incidents`
Busca incidentes con filtros opcionales.

**Parámetros:**
- `query` (str, opcional) — texto libre en descripción o número
- `state` (str, opcional) — `open`, `in_progress`, `resolved`, `closed`
- `assigned_to` (str, opcional) — nombre o sys_id del asignado
- `priority` (str, opcional) — `1` (crítica) a `4` (baja)
- `limit` (int, opcional, default 10) — máximo de resultados

**Respuesta:** lista de incidentes con campos: `number`, `short_description`, `state`, `priority`, `assigned_to`, `sys_id`

---

### `get_incident`
Devuelve todos los campos de un incidente.

**Parámetros:**
- `number` (str, requerido) — p.ej. `INC0001234`

**Respuesta:** objeto completo del incidente incluyendo notas de trabajo y comentarios.

---

### `create_incident`
Crea un incidente nuevo.

**Parámetros:**
- `short_description` (str, requerido)
- `description` (str, opcional)
- `caller_id` (str, opcional) — nombre o sys_id del usuario afectado
- `category` (str, opcional)
- `urgency` (str, opcional) — `1` (alta) a `3` (baja)
- `impact` (str, opcional) — `1` a `3`

**Respuesta:** objeto del incidente creado con su número asignado.

---

### `update_incident`
Actualiza uno o más campos de un incidente existente.

**Parámetros:**
- `number` (str, requerido) — número del incidente
- `fields` (object, requerido) — dict con los campos a actualizar y sus nuevos valores

**Respuesta:** objeto del incidente actualizado.

---

### `add_work_note`
Añade una nota de trabajo interna (no visible al usuario final).

**Parámetros:**
- `number` (str, requerido)
- `note` (str, requerido)

**Respuesta:** confirmación con timestamp.

---

### `add_comment`
Añade un comentario visible al usuario final.

**Parámetros:**
- `number` (str, requerido)
- `comment` (str, requerido)

**Respuesta:** confirmación con timestamp.

---

### `close_incident`
Cierra un incidente con código de resolución.

**Parámetros:**
- `number` (str, requerido)
- `resolution_code` (str, requerido) — p.ej. `Solved (Permanently)`, `Closed/Resolved by Caller`
- `resolution_notes` (str, requerido) — descripción de la resolución

**Respuesta:** objeto del incidente cerrado.

---

## Manejo de errores

| Código HTTP | Comportamiento |
|-------------|----------------|
| 401 / 403   | Error descriptivo: credenciales inválidas o sin permisos |
| 404         | "Incidente `NUMBER` no encontrado" |
| 4xx otros   | Propagar mensaje de error de ServiceNow tal cual |
| Timeout / red | Reintento único; si falla, error descriptivo |

Todos los errores se devuelven como strings legibles — Claude los interpreta y responde en lenguaje natural.

---

## Extensibilidad (fases futuras)

La arquitectura está diseñada para crecer. Añadir soporte para nuevas entidades solo requiere:
1. Añadir métodos al cliente en `servicenow.py`
2. Registrar nuevas tools en `server.py`

Entidades previstas para fases siguientes:
- **CMDB** — CIs, relaciones, análisis de impacto
- **Knowledge Base** — búsqueda, creación y publicación de artículos
- **Cambios y Problemas** — ciclo ITIL completo
- **Catálogo de servicios** — ítems y solicitudes
- **Virtual Agent / AI** — según módulos licenciados

---

## Dependencias

```
mcp>=1.0.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

Python 3.10+.
