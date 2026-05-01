# Vault — Gestor de Contraseñas para AIgor

## Goal

Módulo lateral integrado en AIgor para guardar credenciales web (nombre, URL, usuario, contraseña, notas), lanzar URLs con el password en el portapapeles, y gestión CRUD completa.

## Architecture

**Backend:** `AIgor/core/agents/vault.py` encapsula toda la lógica de cifrado y persistencia. Los endpoints se añaden a `AIgor/core/main.py`.

**Frontend:** `AIgor/ui/vault.js` + sección en `index.html` + estilos en `styles.css`.

**Cifrado:** Fernet (AES-128-CBC + HMAC-SHA256) del paquete `cryptography`. La clave se genera en el primer arranque y se guarda en `~/Documents/AIgor/.vault_key`. El vault cifrado se guarda en `~/Documents/AIgor/vault.enc`.

**Principio de mínima exposición:** el listado de entradas nunca incluye el campo `password`. El password solo se devuelve bajo petición explícita por ID.

## Storage

```
~/Documents/AIgor/
  vault.enc        ← JSON cifrado con Fernet
  .vault_key       ← clave Fernet (generada una vez, solo lectura)
```

Esquema de entrada:
```json
{
  "id": "<uuid4>",
  "name": "Gmail personal",
  "url": "https://mail.google.com",
  "username": "victor@gmail.com",
  "password": "<cifrado internamente>",
  "notes": "",
  "created_at": "2026-05-01T10:00:00",
  "updated_at": "2026-05-01T10:00:00"
}
```

## Backend

### `agents/vault.py`

- `_load_key() -> Fernet` — lee `.vault_key`; si no existe, genera una clave nueva y la escribe
- `_read_vault() -> list` — descifra `vault.enc` y parsea JSON; devuelve `[]` si no existe
- `_write_vault(entries: list)` — serializa a JSON, cifra con Fernet y escribe `vault.enc`
- `list_entries() -> list` — devuelve todas las entradas **sin** el campo `password`
- `get_password(entry_id: str) -> str` — devuelve solo el password descifrado de una entrada
- `create_entry(data: dict) -> dict` — añade entrada, devuelve la entrada sin password
- `update_entry(entry_id: str, data: dict) -> dict` — actualiza campos, devuelve sin password
- `delete_entry(entry_id: str)` — elimina entrada; lanza `KeyError` si no existe

### Endpoints en `main.py`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/vault/entries` | Lista todas las entradas (sin password) |
| GET | `/vault/entries/{id}/password` | Devuelve solo el password de una entrada |
| POST | `/vault/entries` | Crea nueva entrada |
| PUT | `/vault/entries/{id}` | Actualiza entrada existente |
| DELETE | `/vault/entries/{id}` | Borra entrada |
| POST | `/vault/entries/{id}/launch` | Abre la URL en el navegador del sistema |

### Modelos Pydantic

```python
class VaultEntryCreate(BaseModel):
    name: str
    url: str
    username: str
    password: str
    notes: str = ""

class VaultEntryUpdate(BaseModel):
    name: str = ""
    url: str = ""
    username: str = ""
    password: str = ""
    notes: str = ""
```

## Frontend

### Layout (dos columnas, igual que correos)

```
┌──────────────────┬────────────────────────────────────┐
│  🔑 Vault        │  [detalle / formulario]            │
│  [+ Nueva]  [🔍] │                                    │
│                  │  Gmail personal                    │
│  Gmail personal  │  https://mail.google.com           │
│  GitHub          │  victor@gmail.com                  │
│  Jira Accenture  │  ••••••••••  👁                    │
│  ...             │                                    │
│                  │  [🚀 Lanzar] [📋 Usuario] [📋 Pass]│
│                  │  [✏️ Editar]  [🗑 Borrar]           │
└──────────────────┴────────────────────────────────────┘
```

### Estados del panel derecho

1. **Empty state** — "Selecciona una entrada o crea una nueva"
2. **Detail view** — muestra campos + botones de acción
3. **Edit/Create form** — formulario con name, url, username, password (👁), notes + [Guardar] [Cancelar]

### Comportamiento de acciones

- **🚀 Lanzar**: llama a `POST /vault/entries/{id}/launch` (abre URL en navegador), luego llama a `GET /vault/entries/{id}/password` y copia al portapapeles. Muestra aviso "Contraseña copiada — se borrará en 30s" y limpia el portapapeles tras 30s con `setTimeout`.
- **📋 Copiar usuario**: copia `username` al portapapeles.
- **📋 Copiar pass**: llama a `GET /vault/entries/{id}/password`, copia al portapapeles con mismo aviso de 30s.
- **✏️ Editar**: carga el formulario con los valores actuales. El campo password hace `GET /vault/entries/{id}/password` para pre-rellenarlo.
- **🗑 Borrar**: muestra confirmación inline ("¿Seguro? [Sí, borrar] [Cancelar]") antes de llamar al endpoint.
- **Filtro**: `<input>` en la cabecera izquierda; filtra en cliente por nombre, URL y username (case-insensitive).

### `vault.js`

- `loadVault()` — fetch GET /vault/entries, renderiza lista
- `renderVaultList(entries)` — genera items; aplica filtro activo
- `showVaultDetail(entry)` — renderiza panel derecho en modo detalle
- `showVaultForm(entry = null)` — renderiza formulario (crear si null, editar si entry)
- `saveVaultEntry(id = null)` — POST o PUT según si hay id
- `deleteVaultEntry(id)` — DELETE con confirmación inline
- `launchEntry(id)` — launch + copy password
- `copyToClipboard(text, label)` — copia + muestra aviso + limpia en 30s

## Files Modified / Created

| Acción | Fichero |
|--------|---------|
| Crear | `AIgor/core/agents/vault.py` |
| Modificar | `AIgor/core/main.py` (añadir endpoints + imports) |
| Modificar | `AIgor/core/requirements.txt` (añadir `cryptography`) |
| Crear | `AIgor/ui/vault.js` |
| Modificar | `AIgor/ui/index.html` (botón 🔑 sidebar + módulo HTML) |
| Modificar | `AIgor/ui/styles.css` (estilos vault) |

## Security Notes

- La clave Fernet en `.vault_key` es el único secreto. Se añade al `.gitignore`.
- El endpoint `GET /vault/entries` nunca incluye passwords.
- El portapapeles se limpia automáticamente a los 30s tras copiar una contraseña.
- No hay autenticación de red: el servidor solo escucha en `localhost:8765`.
