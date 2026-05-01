import pytest
import tempfile
from pathlib import Path


@pytest.fixture
def vault_dir(tmp_path, monkeypatch):
    """Redirige VAULT_DIR a un directorio temporal."""
    import agents.vault as v
    monkeypatch.setattr(v, 'VAULT_DIR', tmp_path)
    monkeypatch.setattr(v, '_fernet_instance', None)
    return tmp_path


def test_create_and_list(vault_dir):
    from agents.vault import create_entry, list_entries
    entry = create_entry({'name': 'GitHub', 'url': 'https://github.com',
                          'username': 'victor', 'password': 'secret123', 'notes': ''})
    assert entry['name'] == 'GitHub'
    assert 'password' not in entry
    entries = list_entries()
    assert len(entries) == 1
    assert entries[0]['username'] == 'victor'
    assert 'password' not in entries[0]


def test_get_password(vault_dir):
    from agents.vault import create_entry, get_password
    entry = create_entry({'name': 'Gmail', 'url': 'https://gmail.com',
                          'username': 'v@gmail.com', 'password': 'mypass', 'notes': ''})
    pw = get_password(entry['id'])
    assert pw == 'mypass'


def test_update_entry(vault_dir):
    from agents.vault import create_entry, update_entry, get_password
    entry = create_entry({'name': 'X', 'url': 'https://x.com',
                          'username': 'user', 'password': 'old', 'notes': ''})
    updated = update_entry(entry['id'], {'password': 'newpass', 'notes': 'updated'})
    assert updated['notes'] == 'updated'
    assert 'password' not in updated
    assert get_password(entry['id']) == 'newpass'


def test_delete_entry(vault_dir):
    from agents.vault import create_entry, delete_entry, list_entries
    entry = create_entry({'name': 'Del', 'url': 'https://del.com',
                          'username': 'u', 'password': 'p', 'notes': ''})
    delete_entry(entry['id'])
    assert list_entries() == []


def test_delete_missing_raises(vault_dir):
    from agents.vault import delete_entry
    with pytest.raises(KeyError):
        delete_entry('nonexistent-id')
