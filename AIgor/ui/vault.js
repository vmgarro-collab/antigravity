/* ── Vault module ── */

let _vaultEntries = [];
let _vaultFilter = '';
let _vaultSelected = null;
let _clipboardTimer = null;
let _launchData = null; // { entry, pw } — avoids encoding issues in onclick attrs

async function loadVault() {
  _renderVaultListLoading();
  try {
    const r = await fetch(`${API}/vault/entries`);
    _vaultEntries = await r.json();
    renderVaultList();
    if (_vaultSelected) {
      const still = _vaultEntries.find(e => e.id === _vaultSelected.id);
      if (still) showVaultDetail(still); else showVaultEmpty();
    }
  } catch (e) {
    document.getElementById('vault-list').innerHTML =
      `<div class="vault-list-empty">Error: ${e.message}</div>`;
  }
}

function _renderVaultListLoading() {
  document.getElementById('vault-list').innerHTML =
    '<div class="vault-list-empty"><span class="mini-spinner"></span> Cargando…</div>';
}

function renderVaultList() {
  const container = document.getElementById('vault-list');
  const q = _vaultFilter.toLowerCase();
  const filtered = _vaultEntries.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.url.toLowerCase().includes(q) ||
    e.username.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="vault-list-empty">${
      _vaultFilter ? 'Sin resultados.' : 'No hay entradas. Pulsa + para añadir.'
    }</div>`;
    return;
  }

  container.innerHTML = filtered.map(e => `
    <div class="vault-item ${_vaultSelected?.id === e.id ? 'active' : ''}"
         data-id="${e.id}" onclick="selectVaultEntry('${e.id}')">
      <div class="vault-item-icon">${_siteIcon(e.url)}</div>
      <div class="vault-item-body">
        <div class="vault-item-name">${_esc(e.name)}</div>
        <div class="vault-item-user">${_esc(e.username)}</div>
      </div>
    </div>
  `).join('');
}

function _siteIcon(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return host.slice(0, 2).toUpperCase();
  } catch { return '🔑'; }
}

function selectVaultEntry(id) {
  _vaultSelected = _vaultEntries.find(e => e.id === id) || null;
  renderVaultList();
  if (_vaultSelected) showVaultDetail(_vaultSelected);
}

function showVaultDetail(entry) {
  const panel = document.getElementById('vault-detail');
  panel.innerHTML = `
    <div class="vault-detail-header">
      <div class="vault-detail-icon">${_siteIcon(entry.url)}</div>
      <div>
        <div class="vault-detail-name">${_esc(entry.name)}</div>
        <div class="vault-detail-url">${_esc(entry.url)}</div>
      </div>
    </div>

    <div class="vault-fields">
      <div class="vault-field">
        <label>Usuario</label>
        <div class="vault-field-value">${_esc(entry.username)}</div>
      </div>
      <div class="vault-field">
        <label>Contraseña</label>
        <div class="vault-field-value vault-pass-placeholder">••••••••</div>
      </div>
      ${entry.notes ? `<div class="vault-field"><label>Notas</label><div class="vault-field-value">${_esc(entry.notes)}</div></div>` : ''}
    </div>

    <div class="vault-actions">
      <button class="action-chip" id="btn-launch-${entry.id}">🚀 Lanzar</button>
      <button class="action-chip secondary" id="btn-copy-user-${entry.id}">📋 Usuario</button>
      <button class="action-chip secondary" id="btn-copy-pass-${entry.id}">📋 Pass</button>
    </div>
    <div class="vault-actions" style="margin-top:6px">
      <button class="action-chip secondary" id="btn-edit-${entry.id}">✏️ Editar</button>
      <button class="action-chip danger" id="btn-vault-delete-${entry.id}">🗑 Borrar</button>
    </div>

    <div id="vault-clip-notice" class="vault-clip-notice" style="display:none"></div>
  `;

  document.getElementById(`btn-launch-${entry.id}`).addEventListener('click', () => launchEntry(entry.id));
  document.getElementById(`btn-copy-user-${entry.id}`).addEventListener('click', () => copyUsername(entry.id));
  document.getElementById(`btn-copy-pass-${entry.id}`).addEventListener('click', () => copyPass(entry.id));
  document.getElementById(`btn-edit-${entry.id}`).addEventListener('click', () => showVaultForm(entry.id));
  document.getElementById(`btn-vault-delete-${entry.id}`).addEventListener('click', () => confirmDeleteVault(entry.id));
}

function showVaultEmpty() {
  _vaultSelected = null;
  document.getElementById('vault-detail').innerHTML = `
    <div class="vault-empty-state">
      <div style="font-size:2.5rem;opacity:0.15">🔑</div>
      <p>Selecciona una entrada o pulsa + para crear una nueva.</p>
    </div>
  `;
}

async function showVaultForm(entryId = null) {
  const entry = entryId ? _vaultEntries.find(e => e.id === entryId) : null;
  let currentPass = '';
  if (entryId) {
    try {
      const r = await fetch(`${API}/vault/entries/${entryId}/password`);
      const d = await r.json();
      currentPass = d.password || '';
    } catch {}
  }

  const panel = document.getElementById('vault-detail');
  panel.innerHTML = `
    <div class="vault-form-title">${entry ? '✏️ Editar entrada' : '+ Nueva entrada'}</div>
    <div class="vault-form">
      <label>Nombre *</label>
      <input id="vf-name" class="input-filter" style="margin-bottom:10px" value="${_esc(entry?.name || '')}" placeholder="Gmail personal">
      <label>URL *</label>
      <input id="vf-url" class="input-filter" style="margin-bottom:10px" value="${_esc(entry?.url || '')}" placeholder="https://mail.google.com">
      <label>Usuario *</label>
      <input id="vf-username" class="input-filter" style="margin-bottom:10px" value="${_esc(entry?.username || '')}" placeholder="usuario@ejemplo.com">
      <label>Contraseña *</label>
      <div style="position:relative;margin-bottom:10px">
        <input id="vf-password" class="input-filter" type="password" style="width:100%;padding-right:36px" value="${_esc(currentPass)}" placeholder="••••••••">
        <button onclick="toggleVaultPassVisibility()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#888;font-size:1rem">👁</button>
      </div>
      <label>Notas</label>
      <textarea id="vf-notes" class="input-filter" rows="2" style="resize:vertical;margin-bottom:16px">${_esc(entry?.notes || '')}</textarea>
      <div class="row">
        <button class="btn btn-primary btn-sm" id="btn-vf-save">💾 Guardar</button>
        <button class="btn btn-ghost btn-sm" id="btn-vf-cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.getElementById('vf-name').focus();

  // Attach handlers via JS — avoids any quoting issues with entryId
  document.getElementById('btn-vf-save').addEventListener('click', () => saveVaultEntry(entryId || null));
  document.getElementById('btn-vf-cancel').addEventListener('click', () => {
    if (entry) showVaultDetail(entry);
    else showVaultEmpty();
  });
}

function toggleVaultPassVisibility() {
  const inp = document.getElementById('vf-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function saveVaultEntry(entryId) {
  const name = document.getElementById('vf-name').value.trim();
  const url = document.getElementById('vf-url').value.trim();
  const username = document.getElementById('vf-username').value.trim();
  const password = document.getElementById('vf-password').value;
  const notes = document.getElementById('vf-notes').value.trim();

  if (!name || !url || !username || !password) {
    alert('Nombre, URL, usuario y contraseña son obligatorios.');
    return;
  }

  const body = { name, url, username, password, notes };
  try {
    let r;
    if (entryId) {
      r = await fetch(`${API}/vault/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      r = await fetch(`${API}/vault/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    if (!r.ok) throw new Error(await r.text());
    const updated = await r.json();
    if (entryId) {
      const idx = _vaultEntries.findIndex(e => e.id === entryId);
      if (idx >= 0) _vaultEntries[idx] = updated;
    } else {
      _vaultEntries.push(updated);
    }
    _vaultSelected = updated;
    renderVaultList();
    showVaultDetail(updated);
  } catch (e) {
    alert('Error guardando: ' + e.message);
  }
}

function confirmDeleteVault(entryId) {
  const btn = document.getElementById(`btn-vault-delete-${entryId}`);
  if (!btn) return;
  btn.textContent = '¿Seguro?';
  btn.onclick = () => deleteVaultEntry(entryId);
  btn.classList.add('btn-danger-confirm');
  setTimeout(() => {
    if (btn) {
      btn.textContent = '🗑 Borrar';
      btn.onclick = () => confirmDeleteVault(entryId);
      btn.classList.remove('btn-danger-confirm');
    }
  }, 3000);
}

async function deleteVaultEntry(entryId) {
  try {
    const r = await fetch(`${API}/vault/entries/${entryId}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error(await r.text());
    _vaultEntries = _vaultEntries.filter(e => e.id !== entryId);
    _vaultSelected = null;
    renderVaultList();
    showVaultEmpty();
  } catch (e) {
    alert('Error borrando: ' + e.message);
  }
}

async function launchEntry(entryId) {
  const btn = document.getElementById(`btn-launch-${entryId}`);
  const notice = document.getElementById('vault-clip-notice');
  if (btn) { btn.textContent = '⏳ Abriendo…'; btn.disabled = true; }
  if (notice) { notice.textContent = '⏳ Abriendo página y rellenando credenciales en 3s…'; notice.style.display = 'block'; }
  try {
    const r = await fetch(`${API}/vault/entries/${entryId}/launch`, { method: 'POST' });
    if (!r.ok) {
      const err = await r.text();
      if (notice) { notice.textContent = '✗ Error: ' + err; }
      return;
    }
    if (notice) {
      notice.textContent = '✓ Rellenando usuario y contraseña…';
      setTimeout(() => { if (notice) notice.style.display = 'none'; }, 6000);
    }
  } catch (e) {
    if (notice) { notice.textContent = '✗ Error: ' + e.message; }
  } finally {
    if (btn) { btn.textContent = '🚀 Lanzar'; btn.disabled = false; }
  }
}

function _showLaunchPanel() {
  const { entry, pw } = _launchData;
  const panel = document.getElementById('vault-detail');
  panel.innerHTML = `
    <div class="vault-launch-panel">
      <div class="vault-launch-title">
        <div class="vault-detail-icon" style="width:36px;height:36px;font-size:0.75rem">${_siteIcon(entry.url)}</div>
        <div>
          <div style="font-weight:700;font-size:0.95rem">${_esc(entry.name)}</div>
          <div style="font-size:0.75rem;color:#555">${_esc(entry.url)}</div>
        </div>
      </div>
      <div class="vault-launch-step">
        <span class="vault-launch-num">1</span>
        <div class="vault-launch-body">
          <div class="vault-launch-label">Usuario</div>
          <div class="vault-launch-value">${_esc(entry.username)}</div>
        </div>
        <button class="action-chip secondary" id="btn-launch-user">📋 Copiar</button>
      </div>
      <div class="vault-launch-step">
        <span class="vault-launch-num">2</span>
        <div class="vault-launch-body">
          <div class="vault-launch-label">Contraseña</div>
          <div class="vault-launch-value vault-pass-placeholder">••••••••</div>
        </div>
        <button class="action-chip" id="btn-launch-pass">📋 Copiar</button>
      </div>
      <div id="vault-clip-notice" class="vault-clip-notice" style="display:none"></div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;align-self:flex-start" id="btn-launch-back">← Volver</button>
    </div>
  `;

  document.getElementById('btn-launch-user').addEventListener('click', async function() {
    await _copyToClipboard(entry.username, 'Usuario copiado', false);
    this.textContent = '✓ Copiado';
    setTimeout(() => { this.textContent = '📋 Copiar'; }, 2000);
  });

  document.getElementById('btn-launch-pass').addEventListener('click', async function() {
    const password = pw || await (async () => {
      const r = await fetch(`${API}/vault/entries/${entry.id}/password`);
      return (await r.json()).password || '';
    })();
    await _copyToClipboard(password, 'Contraseña copiada — se borrará en 30s', true);
    this.textContent = '✓ Copiada';
    setTimeout(() => { this.textContent = '📋 Copiar'; }, 2000);
  });

  document.getElementById('btn-launch-back').addEventListener('click', () => showVaultDetail(entry));
}

async function copyUsername(entryId) {
  const entry = _vaultEntries.find(e => e.id === entryId);
  if (!entry) return;
  await _copyToClipboard(entry.username, 'Usuario copiado');
}

async function copyPass(entryId) {
  try {
    const r = await fetch(`${API}/vault/entries/${entryId}/password`);
    const d = await r.json();
    await _copyToClipboard(d.password, 'Contraseña copiada — se borrará en 30s', true);
  } catch (e) {
    alert('Error copiando contraseña: ' + e.message);
  }
}

async function _copyToClipboard(text, label, autoClear = false) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const notice = document.getElementById('vault-clip-notice');
  if (notice) {
    notice.textContent = '✓ ' + label;
    notice.style.display = 'block';
    if (_clipboardTimer) clearTimeout(_clipboardTimer);
    _clipboardTimer = setTimeout(() => {
      if (notice) notice.style.display = 'none';
      if (autoClear) navigator.clipboard.writeText('').catch(() => {});
    }, 30000);
  }
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initVaultModule() {
  if (!_vaultEntries.length) {
    loadVault();
  } else {
    renderVaultList();
    if (_vaultSelected) showVaultDetail(_vaultSelected);
    else showVaultEmpty();
  }
}

// Scripts load after DOM is parsed — attach directly
document.getElementById('btn-vault-new')?.addEventListener('click', () => showVaultForm());
document.getElementById('vault-filter')?.addEventListener('input', e => {
  _vaultFilter = e.target.value;
  renderVaultList();
});
