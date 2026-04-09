// Liga Veteranos F-6

lucide.createIcons();

const API_BASE = '';

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(tabName) {
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  if (!loadedTabs.has(tabName)) {
    loadTab(tabName);
  }
}

const loadedTabs = new Set();

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------
async function apiFetch(endpoint) {
  // Map API endpoints to static JSON files
  const staticMap = {
    '/api/clasificacion': 'data/clasificacion.json',
    '/api/resultados':    'data/resultados.json',
    '/api/goleadores':    'data/goleadores.json',
    '/api/calendario':    'data/calendario.json',
  };
  const url = staticMap[endpoint] || endpoint;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function showError(panelId, msg) {
  document.getElementById(panelId).innerHTML =
    `<div class="error-card"><i data-lucide="triangle-alert"></i> ${msg}</div>`;
  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Tab loaders
// ---------------------------------------------------------------------------
async function loadTab(tabName) {
  loadedTabs.add(tabName);
  switch (tabName) {
    case 'clasificacion': return loadClasificacion();
    case 'resultados':    return loadResultados();
    case 'goleadores':    return loadGoleadores();
    case 'calendario':    return loadCalendario();
    // jugador is search-driven, no initial load
  }
}

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------
async function loadClasificacion() {
  const panel = document.getElementById('tab-clasificacion');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando clasificación...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/clasificacion');
    panel.innerHTML = `
      <div class="glass-card tabla-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipo</th>
              <th class="center">PJ</th>
              <th class="center">G</th>
              <th class="center">E</th>
              <th class="center">P</th>
              <th class="center">GF</th>
              <th class="center">GC</th>
              <th class="center">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td class="center">${row.pos}</td>
                <td>
                  <span class="equipo-link" onclick="buscarEquipo('${escHtml(row.equipo)}')">
                    ${escHtml(row.equipo)}
                  </span>
                </td>
                <td class="center">${row.pj}</td>
                <td class="center">${row.g}</td>
                <td class="center">${row.e}</td>
                <td class="center">${row.p}</td>
                <td class="center">${row.gf}</td>
                <td class="center">${row.gc}</td>
                <td class="center"><strong>${row.pts}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons();
  } catch (e) {
    const msg = e.message.includes('Failed to fetch')
      ? 'Error cargando datos'
      : e.message;
    showError('tab-clasificacion', msg);
  }
}

function buscarEquipo(nombre) {
  document.getElementById('jugador-input').value = nombre;
  switchTab('jugador');
  buscarJugador(nombre);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------
async function loadResultados() {
  const panel = document.getElementById('tab-resultados');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando resultados...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/resultados');
    // Group by jornada
    const byJornada = {};
    data.forEach(m => {
      if (!byJornada[m.jornada]) byJornada[m.jornada] = [];
      byJornada[m.jornada].push(m);
    });
    const html = Object.entries(byJornada).reverse().map(([jornada, partidos]) => `
      <div class="jornada-section">
        <div class="jornada-header" onclick="toggleJornada(this)">
          <i data-lucide="chevron-down"></i>
          Jornada ${jornada}
        </div>
        <div class="jornada-body">
          ${partidos.map(p => `
            <div class="partido-card">
              <div class="partido-equipo-local">${escHtml(p.local)}</div>
              <div class="partido-marcador">${p.golesLocal} – ${p.golesVisitante}</div>
              <div class="partido-equipo-visitante">${escHtml(p.visitante)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    panel.innerHTML = html || '<div class="loading">No hay resultados aún</div>';
    lucide.createIcons();
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Error cargando datos' : e.message;
    showError('tab-resultados', msg);
  }
}

function toggleJornada(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('[data-lucide]');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  icon.setAttribute('data-lucide', isOpen ? 'chevron-right' : 'chevron-down');
  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Goleadores
// ---------------------------------------------------------------------------
async function loadGoleadores() {
  const panel = document.getElementById('tab-goleadores');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando goleadores...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/goleadores');
    const medalClass = (pos) => pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
    panel.innerHTML = data.map(g => `
      <div class="goleador-row">
        <div class="rank-badge ${medalClass(g.pos)}">${g.pos}</div>
        <div class="goleador-nombre">${escHtml(g.jugador)}</div>
        <div class="goleador-equipo">${escHtml(g.equipo)}</div>
        <div class="goleador-goles">${g.goles} ⚽</div>
      </div>
    `).join('') || '<div class="loading">No hay datos de goleadores</div>';
    lucide.createIcons();
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Error cargando datos' : e.message;
    showError('tab-goleadores', msg);
  }
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------
async function loadCalendario() {
  const panel = document.getElementById('tab-calendario');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando calendario...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/calendario');
    const d = new Date();
    const today = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    panel.innerHTML = data.map(f => {
      const isToday = f.fecha === today;
      return `
        <div class="fixture-card">
          <div class="fixture-fecha">
            ${isToday ? '<span class="hoy-badge">HOY</span> ' : ''}
            ${escHtml(f.fecha)} ${f.hora ? escHtml(f.hora) : ''}
          </div>
          <div class="fixture-local">${escHtml(f.local)}</div>
          <div class="fixture-vs">vs</div>
          <div class="fixture-visitante">${escHtml(f.visitante)}</div>
        </div>`;
    }).join('') || '<div class="loading">No hay partidos próximos</div>';
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Error cargando datos' : e.message;
    showError('tab-calendario', msg);
  }
}

// ---------------------------------------------------------------------------
// Jugador (debounced search)
// ---------------------------------------------------------------------------
let jugadorTimer = null;

document.getElementById('jugador-input').addEventListener('input', (e) => {
  clearTimeout(jugadorTimer);
  const q = e.target.value.trim();
  if (q.length < 2) {
    document.getElementById('jugador-results').innerHTML = '';
    return;
  }
  jugadorTimer = setTimeout(() => buscarJugador(q), 300);
});

async function buscarJugador(nombre) {
  const results = document.getElementById('jugador-results');
  results.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Buscando...</div>';
  lucide.createIcons();
  try {
    const todos = await apiFetch('/api/goleadores');
    const data = todos.filter(j =>
      j.jugador.toLowerCase().includes(nombre.toLowerCase()) ||
      j.equipo.toLowerCase().includes(nombre.toLowerCase())
    );
    if (!Array.isArray(data) || data.length === 0) {
      results.innerHTML = '<div class="loading">No se encontró ningún jugador</div>';
      return;
    }
    results.innerHTML = data.map(j => {
      const inicial = (j.jugador || '?')[0].toUpperCase();
      return `
        <div class="jugador-card">
          <div class="jugador-avatar">${escHtml(inicial)}</div>
          <div class="jugador-info">
            <div class="jugador-nombre">${escHtml(j.jugador)}</div>
            <div class="jugador-equipo">${escHtml(j.equipo)}</div>
          </div>
          <div class="jugador-stats">
            <div class="stat-item">
              <div class="stat-val">${j.goles ?? '—'}</div>
              <div class="stat-lbl">Goles</div>
            </div>
            ${j.partidos != null ? `
            <div class="stat-item">
              <div class="stat-val">${j.partidos}</div>
              <div class="stat-lbl">Partidos</div>
            </div>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Error cargando datos' : e.message;
    results.innerHTML = `<div class="error-card"><i data-lucide="triangle-alert"></i> ${msg}</div>`;
    lucide.createIcons();
  }
}

// ---------------------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------------------
loadTab('clasificacion');
