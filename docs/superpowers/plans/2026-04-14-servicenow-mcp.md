# ServiceNow MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un servidor MCP en Python que conecta Claude Code con ServiceNow vía Basic Auth, exponiendo 7 tools para CRUD completo de incidentes.

**Architecture:** Proceso Python local que Claude Code lanza vía stdio. `servicenow.py` es un cliente HTTP genérico con Basic Auth; `server.py` registra las tools MCP usando FastMCP y delega todas las llamadas al cliente. Los errores se propagan como strings legibles.

**Tech Stack:** Python 3.10+, `mcp[cli]` (FastMCP), `httpx`, `python-dotenv`, `pytest`, `respx` (mock httpx)

---

## Estructura de ficheros

```
servicenow-mcp/           ← repo independiente, fuera de AntiGravity
├── servicenow.py         # ServiceNowClient: get / post / patch con Basic Auth
├── server.py             # FastMCP app con las 7 tools registradas
├── tests/
│   ├── test_client.py    # Tests del cliente HTTP (con respx)
│   └── test_tools.py     # Tests de las tools MCP
├── .env                  # Credenciales reales — gitignored
├── .env.example          # Plantilla pública
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Task 1: Scaffold del repo

**Files:**
- Create: `servicenow-mcp/requirements.txt`
- Create: `servicenow-mcp/.gitignore`
- Create: `servicenow-mcp/.env.example`

- [ ] **Step 1: Crear el directorio y entrar**

```bash
mkdir servicenow-mcp
cd servicenow-mcp
git init
```

- [ ] **Step 2: Crear `requirements.txt`**

```
mcp[cli]>=1.0.0
httpx>=0.27.0
python-dotenv>=1.0.0
pytest>=8.0.0
respx>=0.21.0
```

- [ ] **Step 3: Crear `.gitignore`**

```
.env
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 4: Crear `.env.example`**

```
SN_INSTANCE=https://tuempresa.service-now.com
SN_USERNAME=tu_usuario
SN_PASSWORD=tu_contraseña
```

- [ ] **Step 5: Instalar dependencias**

```bash
pip install -r requirements.txt
```

Resultado esperado: instalación sin errores. Verificar con `python -c "import mcp; import httpx; print('OK')"`.

- [ ] **Step 6: Commit inicial**

```bash
git add requirements.txt .gitignore .env.example
git commit -m "chore: scaffold repo servicenow-mcp"
```

---

## Task 2: Cliente HTTP `servicenow.py`

**Files:**
- Create: `servicenow-mcp/servicenow.py`
- Create: `servicenow-mcp/tests/__init__.py`
- Create: `servicenow-mcp/tests/test_client.py`

- [ ] **Step 1: Escribir los tests del cliente**

Crear `tests/__init__.py` vacío y `tests/test_client.py`:

```python
import pytest
import respx
import httpx
from servicenow import ServiceNowClient

BASE = "https://test.service-now.com"
CLIENT = ServiceNowClient(instance=BASE, username="u", password="p")


@respx.mock
def test_get_returns_json():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [{"number": "INC001"}]})
    )
    result = CLIENT.get("incident", {})
    assert result == [{"number": "INC001"}]


@respx.mock
def test_post_returns_json():
    respx.post(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(201, json={"result": {"number": "INC002", "sys_id": "abc"}})
    )
    result = CLIENT.post("incident", {"short_description": "Test"})
    assert result["number"] == "INC002"


@respx.mock
def test_patch_returns_json():
    respx.patch(f"{BASE}/api/now/table/incident/abc").mock(
        return_value=httpx.Response(200, json={"result": {"number": "INC002", "state": "7"}})
    )
    result = CLIENT.patch("incident", "abc", {"state": "7"})
    assert result["state"] == "7"


@respx.mock
def test_get_raises_on_401():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(401, json={"error": {"message": "User Not Authenticated"}})
    )
    with pytest.raises(RuntimeError, match="Credenciales inválidas"):
        CLIENT.get("incident", {})


@respx.mock
def test_get_raises_on_404():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(404, json={"error": {"message": "No record found"}})
    )
    with pytest.raises(RuntimeError, match="No encontrado"):
        CLIENT.get("incident", {})
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```bash
cd servicenow-mcp
pytest tests/test_client.py -v
```

Resultado esperado: `ModuleNotFoundError: No module named 'servicenow'`

- [ ] **Step 3: Implementar `servicenow.py`**

```python
import httpx
from typing import Any


class ServiceNowClient:
    def __init__(self, instance: str, username: str, password: str):
        self._base = instance.rstrip("/")
        self._auth = (username, password)
        self._headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _url(self, table: str) -> str:
        return f"{self._base}/api/now/table/{table}"

    def _handle_response(self, response: httpx.Response) -> Any:
        if response.status_code in (401, 403):
            raise RuntimeError("Credenciales inválidas o sin permisos en ServiceNow")
        if response.status_code == 404:
            raise RuntimeError(f"No encontrado: {response.text}")
        if response.status_code >= 400:
            try:
                detail = response.json().get("error", {}).get("message", response.text)
            except Exception:
                detail = response.text
            raise RuntimeError(f"Error ServiceNow {response.status_code}: {detail}")
        return response.json().get("result", response.json())

    def get(self, table: str, params: dict) -> Any:
        with httpx.Client(auth=self._auth, headers=self._headers, timeout=15) as client:
            try:
                r = client.get(self._url(table), params=params)
            except httpx.TransportError:
                with httpx.Client(auth=self._auth, headers=self._headers, timeout=15) as c2:
                    r = c2.get(self._url(table), params=params)
        return self._handle_response(r)

    def post(self, table: str, data: dict) -> Any:
        with httpx.Client(auth=self._auth, headers=self._headers, timeout=15) as client:
            r = client.post(self._url(table), json=data)
        return self._handle_response(r)

    def patch(self, table: str, sys_id: str, data: dict) -> Any:
        url = f"{self._url(table)}/{sys_id}"
        with httpx.Client(auth=self._auth, headers=self._headers, timeout=15) as client:
            r = client.patch(url, json=data)
        return self._handle_response(r)
```

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

```bash
pytest tests/test_client.py -v
```

Resultado esperado: 5 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add servicenow.py tests/
git commit -m "feat: ServiceNowClient con get/post/patch y manejo de errores"
```

---

## Task 3: Tools `search_incidents` y `get_incident`

**Files:**
- Create: `servicenow-mcp/server.py`
- Create: `servicenow-mcp/tests/test_tools.py`

ServiceNow states: `1`=New/Open, `2`=In Progress, `6`=Resolved, `7`=Closed.

- [ ] **Step 1: Escribir tests para search_incidents y get_incident**

Crear `tests/test_tools.py`:

```python
import pytest
import respx
import httpx
import os

os.environ.setdefault("SN_INSTANCE", "https://test.service-now.com")
os.environ.setdefault("SN_USERNAME", "u")
os.environ.setdefault("SN_PASSWORD", "p")

from server import search_incidents, get_incident

BASE = "https://test.service-now.com"

INCIDENT_LIST = [
    {"number": "INC001", "short_description": "VPN caída", "state": "1",
     "priority": "2", "assigned_to": {"display_value": "Ana"}, "sys_id": "aaa"}
]
INCIDENT_FULL = {
    "number": "INC001", "short_description": "VPN caída", "description": "No conecta",
    "state": "1", "priority": "2", "urgency": "1", "impact": "2",
    "assigned_to": {"display_value": "Ana"}, "sys_id": "aaa",
    "work_notes": "", "comments": ""
}


@respx.mock
def test_search_incidents_returns_list():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": INCIDENT_LIST})
    )
    result = search_incidents(query="VPN")
    assert "INC001" in result
    assert "VPN caída" in result


@respx.mock
def test_get_incident_returns_details():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [INCIDENT_FULL]})
    )
    result = get_incident(number="INC001")
    assert "INC001" in result
    assert "No conecta" in result


@respx.mock
def test_get_incident_not_found():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": []})
    )
    result = get_incident(number="INC999")
    assert "no encontrado" in result.lower()
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```bash
pytest tests/test_tools.py -v
```

Resultado esperado: `ImportError` o `ModuleNotFoundError` para `server`.

- [ ] **Step 3: Implementar `server.py` con las primeras 2 tools**

```python
import os
import json
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from servicenow import ServiceNowClient

load_dotenv()

mcp = FastMCP("servicenow")

_client = ServiceNowClient(
    instance=os.environ["SN_INSTANCE"],
    username=os.environ["SN_USERNAME"],
    password=os.environ["SN_PASSWORD"],
)

STATE_MAP = {
    "open": "1",
    "in_progress": "2",
    "resolved": "6",
    "closed": "7",
}


@mcp.tool()
def search_incidents(
    query: str = "",
    state: str = "",
    assigned_to: str = "",
    priority: str = "",
    limit: int = 10,
) -> str:
    """Busca incidentes en ServiceNow con filtros opcionales."""
    conditions = ["active=true"]
    if query:
        conditions.append(f"short_descriptionLIKE{query}^ORnumberLIKE{query}")
    if state and state in STATE_MAP:
        conditions.append(f"state={STATE_MAP[state]}")
    if assigned_to:
        conditions.append(f"assigned_to.nameLIKE{assigned_to}")
    if priority:
        conditions.append(f"priority={priority}")

    params = {
        "sysparm_query": "^".join(conditions),
        "sysparm_limit": limit,
        "sysparm_fields": "number,short_description,state,priority,assigned_to,sys_id",
        "sysparm_display_value": "true",
    }
    try:
        results = _client.get("incident", params)
        if not results:
            return "No se encontraron incidentes con esos filtros."
        return json.dumps(results, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)


@mcp.tool()
def get_incident(number: str) -> str:
    """Devuelve todos los campos de un incidente por su número (INC0001234)."""
    params = {
        "sysparm_query": f"number={number}",
        "sysparm_display_value": "true",
        "sysparm_limit": 1,
    }
    try:
        results = _client.get("incident", params)
        if not results:
            return f"Incidente {number} no encontrado."
        return json.dumps(results[0], ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)


if __name__ == "__main__":
    mcp.run()
```

- [ ] **Step 4: Ejecutar tests**

```bash
pytest tests/test_tools.py::test_search_incidents_returns_list tests/test_tools.py::test_get_incident_returns_details tests/test_tools.py::test_get_incident_not_found -v
```

Resultado esperado: 3 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add server.py
git commit -m "feat: tools search_incidents y get_incident"
```

---

## Task 4: Tools `create_incident` y `update_incident`

**Files:**
- Modify: `servicenow-mcp/server.py`
- Modify: `servicenow-mcp/tests/test_tools.py`

- [ ] **Step 1: Añadir tests**

Añadir al final de `tests/test_tools.py`:

```python
from server import create_incident, update_incident

CREATED = {"number": "INC002", "sys_id": "bbb", "short_description": "Impresora rota"}
UPDATED = {"number": "INC002", "sys_id": "bbb", "state": "2"}


@respx.mock
def test_create_incident():
    respx.post(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(201, json={"result": CREATED})
    )
    result = create_incident(short_description="Impresora rota")
    assert "INC002" in result
    assert "Impresora rota" in result


@respx.mock
def test_update_incident():
    # Primero get para obtener sys_id
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [{"sys_id": "bbb", "number": "INC002"}]})
    )
    respx.patch(f"{BASE}/api/now/table/incident/bbb").mock(
        return_value=httpx.Response(200, json={"result": UPDATED})
    )
    result = update_incident(number="INC002", fields={"state": "2"})
    assert "INC002" in result
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```bash
pytest tests/test_tools.py::test_create_incident tests/test_tools.py::test_update_incident -v
```

Resultado esperado: `ImportError` para `create_incident`.

- [ ] **Step 3: Añadir las tools a `server.py`**

Añadir después de `get_incident`:

```python
@mcp.tool()
def create_incident(
    short_description: str,
    description: str = "",
    caller_id: str = "",
    category: str = "",
    urgency: str = "",
    impact: str = "",
) -> str:
    """Crea un nuevo incidente en ServiceNow."""
    data: dict = {"short_description": short_description}
    if description:
        data["description"] = description
    if caller_id:
        data["caller_id"] = caller_id
    if category:
        data["category"] = category
    if urgency:
        data["urgency"] = urgency
    if impact:
        data["impact"] = impact
    try:
        result = _client.post("incident", data)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)


@mcp.tool()
def update_incident(number: str, fields: dict) -> str:
    """Actualiza campos de un incidente existente. fields es un dict con los campos a cambiar."""
    try:
        # Obtener sys_id por número
        lookup = _client.get("incident", {
            "sysparm_query": f"number={number}",
            "sysparm_fields": "sys_id,number",
            "sysparm_limit": 1,
        })
        if not lookup:
            return f"Incidente {number} no encontrado."
        sys_id = lookup[0]["sys_id"]
        result = _client.patch("incident", sys_id, fields)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)
```

- [ ] **Step 4: Ejecutar tests**

```bash
pytest tests/test_tools.py::test_create_incident tests/test_tools.py::test_update_incident -v
```

Resultado esperado: 2 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add server.py tests/test_tools.py
git commit -m "feat: tools create_incident y update_incident"
```

---

## Task 5: Tools `add_work_note`, `add_comment` y `close_incident`

**Files:**
- Modify: `servicenow-mcp/server.py`
- Modify: `servicenow-mcp/tests/test_tools.py`

ServiceNow acepta `work_notes` y `comments` como campos normales en un PATCH. Para cerrar: `state=7`, `close_code`, `close_notes`.

- [ ] **Step 1: Añadir tests**

Añadir al final de `tests/test_tools.py`:

```python
from server import add_work_note, add_comment, close_incident

NOTE_RESPONSE = {"number": "INC002", "sys_id": "bbb", "work_notes": "Nota añadida"}
COMMENT_RESPONSE = {"number": "INC002", "sys_id": "bbb", "comments": "Comentario añadido"}
CLOSED_RESPONSE = {"number": "INC002", "sys_id": "bbb", "state": "7"}


@respx.mock
def test_add_work_note():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [{"sys_id": "bbb", "number": "INC002"}]})
    )
    respx.patch(f"{BASE}/api/now/table/incident/bbb").mock(
        return_value=httpx.Response(200, json={"result": NOTE_RESPONSE})
    )
    result = add_work_note(number="INC002", note="Revisado el servidor")
    assert "INC002" in result


@respx.mock
def test_add_comment():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [{"sys_id": "bbb", "number": "INC002"}]})
    )
    respx.patch(f"{BASE}/api/now/table/incident/bbb").mock(
        return_value=httpx.Response(200, json={"result": COMMENT_RESPONSE})
    )
    result = add_comment(number="INC002", comment="Estamos investigando")
    assert "INC002" in result


@respx.mock
def test_close_incident():
    respx.get(f"{BASE}/api/now/table/incident").mock(
        return_value=httpx.Response(200, json={"result": [{"sys_id": "bbb", "number": "INC002"}]})
    )
    respx.patch(f"{BASE}/api/now/table/incident/bbb").mock(
        return_value=httpx.Response(200, json={"result": CLOSED_RESPONSE})
    )
    result = close_incident(
        number="INC002",
        resolution_code="Solved (Permanently)",
        resolution_notes="Se reinició el servicio"
    )
    assert "INC002" in result
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```bash
pytest tests/test_tools.py::test_add_work_note tests/test_tools.py::test_add_comment tests/test_tools.py::test_close_incident -v
```

Resultado esperado: `ImportError` para las 3 tools.

- [ ] **Step 3: Añadir las tools a `server.py`**

Añadir después de `update_incident`:

```python
def _get_sys_id(number: str) -> str:
    """Helper: obtiene sys_id de un incidente por número. Lanza RuntimeError si no existe."""
    lookup = _client.get("incident", {
        "sysparm_query": f"number={number}",
        "sysparm_fields": "sys_id,number",
        "sysparm_limit": 1,
    })
    if not lookup:
        raise RuntimeError(f"Incidente {number} no encontrado.")
    return lookup[0]["sys_id"]


@mcp.tool()
def add_work_note(number: str, note: str) -> str:
    """Añade una nota de trabajo interna (no visible al usuario final) a un incidente."""
    try:
        sys_id = _get_sys_id(number)
        result = _client.patch("incident", sys_id, {"work_notes": note})
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)


@mcp.tool()
def add_comment(number: str, comment: str) -> str:
    """Añade un comentario visible al usuario final en un incidente."""
    try:
        sys_id = _get_sys_id(number)
        result = _client.patch("incident", sys_id, {"comments": comment})
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)


@mcp.tool()
def close_incident(number: str, resolution_code: str, resolution_notes: str) -> str:
    """Cierra un incidente con código de resolución y notas. resolution_code ejemplos: 'Solved (Permanently)', 'Closed/Resolved by Caller'."""
    try:
        sys_id = _get_sys_id(number)
        data = {
            "state": "7",
            "close_code": resolution_code,
            "close_notes": resolution_notes,
        }
        result = _client.patch("incident", sys_id, data)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)
```

También refactorizar `update_incident` para usar `_get_sys_id`:

```python
@mcp.tool()
def update_incident(number: str, fields: dict) -> str:
    """Actualiza campos de un incidente existente. fields es un dict con los campos a cambiar."""
    try:
        sys_id = _get_sys_id(number)
        result = _client.patch("incident", sys_id, fields)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except RuntimeError as e:
        return str(e)
```

- [ ] **Step 4: Ejecutar todos los tests**

```bash
pytest tests/ -v
```

Resultado esperado: todos los tests PASSED (mínimo 13).

- [ ] **Step 5: Commit**

```bash
git add server.py tests/test_tools.py
git commit -m "feat: tools add_work_note, add_comment, close_incident"
```

---

## Task 6: README y configuración Claude Code

**Files:**
- Create: `servicenow-mcp/README.md`

- [ ] **Step 1: Crear `README.md`**

```markdown
# servicenow-mcp

Servidor MCP local que conecta Claude Code con ServiceNow vía Basic Auth.

## Requisitos

- Python 3.10+
- Acceso a una instancia ServiceNow con Basic Auth

## Instalación

```bash
git clone <repo>
cd servicenow-mcp
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus credenciales
```

## Configuración en Claude Code

Añadir a `~/.claude/claude_desktop_config.json`:

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

Reiniciar Claude Code. Las tools aparecen automáticamente.

## Tools disponibles

| Tool | Descripción |
|------|-------------|
| `search_incidents` | Busca incidentes con filtros |
| `get_incident` | Detalle completo de un incidente |
| `create_incident` | Crea un nuevo incidente |
| `update_incident` | Actualiza campos de un incidente |
| `add_work_note` | Añade nota interna |
| `add_comment` | Añade comentario al usuario |
| `close_incident` | Cierra con código de resolución |

## Tests

```bash
pytest tests/ -v
```
```

- [ ] **Step 2: Ejecutar suite completa de tests por última vez**

```bash
pytest tests/ -v
```

Resultado esperado: todos los tests PASSED.

- [ ] **Step 3: Commit final**

```bash
git add README.md
git commit -m "docs: README con instalación y configuración Claude Code"
```

- [ ] **Step 4: Probar en vivo con Claude Code**

1. Copiar la ruta absoluta del directorio: `pwd`
2. Editar `~/.claude/claude_desktop_config.json` añadiendo el bloque `servicenow`
3. Copiar `.env.example` a `.env` y rellenar con credenciales reales
4. Reiniciar Claude Code
5. Pedir a Claude: *"Busca los últimos 5 incidentes abiertos"*

Resultado esperado: Claude llama a `search_incidents` y devuelve la lista en lenguaje natural.
```

---

## Self-review

**Spec coverage:**
- ✅ 7 tools implementadas: search, get, create, update, work_note, comment, close
- ✅ Basic Auth
- ✅ Variables de entorno con dotenv
- ✅ Errores 401/403, 404, 4xx propagados como strings
- ✅ Reintento único en `get` ante fallo de red
- ✅ Configuración Claude Code documentada
- ✅ Repo independiente de AntiGravity

**Placeholders:** ninguno — todo el código está escrito.

**Type consistency:** `_get_sys_id` definido antes de `add_work_note`, `add_comment` y `close_incident` que lo usan. `update_incident` refactorizado para usarlo también.
