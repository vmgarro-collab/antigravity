import json
import uuid
from datetime import datetime
from pathlib import Path

from cryptography.fernet import Fernet

VAULT_DIR = Path.home() / "Documents" / "AIgor"
_fernet_instance = None


def _load_key() -> Fernet:
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance
    key_file = VAULT_DIR / ".vault_key"
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    if key_file.exists():
        key = key_file.read_bytes()
    else:
        key = Fernet.generate_key()
        key_file.write_bytes(key)
        key_file.chmod(0o600)
    _fernet_instance = Fernet(key)
    return _fernet_instance


def _read_vault() -> list:
    vault_file = VAULT_DIR / "vault.enc"
    if not vault_file.exists():
        return []
    try:
        f = _load_key()
        data = f.decrypt(vault_file.read_bytes())
        return json.loads(data)
    except Exception:
        return []


def _write_vault(entries: list):
    vault_file = VAULT_DIR / "vault.enc"
    f = _load_key()
    vault_file.write_bytes(f.encrypt(json.dumps(entries, ensure_ascii=False).encode()))


def _strip_password(entry: dict) -> dict:
    return {k: v for k, v in entry.items() if k != 'password'}


def list_entries() -> list:
    return [_strip_password(e) for e in _read_vault()]


def get_password(entry_id: str) -> str:
    entries = _read_vault()
    for e in entries:
        if e['id'] == entry_id:
            return e['password']
    raise KeyError(entry_id)


def create_entry(data: dict) -> dict:
    entries = _read_vault()
    now = datetime.now().isoformat(timespec='seconds')
    entry = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'url': data['url'],
        'username': data['username'],
        'password': data['password'],
        'notes': data.get('notes', ''),
        'created_at': now,
        'updated_at': now,
    }
    entries.append(entry)
    _write_vault(entries)
    return _strip_password(entry)


def update_entry(entry_id: str, data: dict) -> dict:
    entries = _read_vault()
    for e in entries:
        if e['id'] == entry_id:
            for field in ('name', 'url', 'username', 'password', 'notes'):
                if data.get(field):
                    e[field] = data[field]
            e['updated_at'] = datetime.now().isoformat(timespec='seconds')
            _write_vault(entries)
            return _strip_password(e)
    raise KeyError(entry_id)


def delete_entry(entry_id: str):
    entries = _read_vault()
    new_entries = [e for e in entries if e['id'] != entry_id]
    if len(new_entries) == len(entries):
        raise KeyError(entry_id)
    _write_vault(new_entries)
