/* ── Dashboard module ── */

let _tasks = [];
let _briefingActive = false;

async function loadDashboard() {
  renderTasksLoading();
  try {
    const r = await fetch(`${API}/dashboard/tasks`);
    _tasks = await r.json();
    renderTasks();
  } catch (e) {
    document.getElementById('dash-tasks-body').innerHTML =
      `<div class="dash-empty">Error cargando tareas: ${e.message}</div>`;
  }
}

function renderTasksLoading() {
  document.getElementById('dash-tasks-body').innerHTML =
    '<div class="dash-empty"><span class="mini-spinner"></span> Sincronizando tareas…</div>';
}

function renderTasks() {
  const container = document.getElementById('dash-tasks-body');
  const pending = _tasks.filter(t => !t.done);
  const done = _tasks.filter(t => t.done);

  if (!_tasks.length) {
    container.innerHTML = '<div class="dash-empty">No hay tareas — genera minutas de reuniones para verlas aquí.</div>';
    return;
  }

  // Group pending by category heuristic
  const urgent = pending.filter(t => {
    if (!t.deadline || t.deadline === 'Sin fecha') return false;
    const d = parseDeadline(t.deadline);
    if (!d) return false;
    const days = (d - Date.now()) / 86400000;
    return days <= 3;
  });
  const deliverables = pending.filter(t => {
    if (!t.deadline || t.deadline === 'Sin fecha') return false;
    const d = parseDeadline(t.deadline);
    if (!d) return false;
    const days = (d - Date.now()) / 86400000;
    return days > 3;
  });
  const radar = pending.filter(t => !t.deadline || t.deadline === 'Sin fecha');

  let html = '';

  if (urgent.length) {
    html += sectionHtml('🔴 Urgente', urgent);
  }
  if (deliverables.length) {
    html += sectionHtml('📦 Entregables', deliverables);
  }
  if (radar.length) {
    html += sectionHtml('📡 Radar', radar);
  }
  if (done.length) {
    html += `<details class="dash-done-details"><summary class="dash-done-summary">✓ Completadas (${done.length})</summary>`;
    html += done.map(t => taskHtml(t)).join('');
    html += '</details>';
  }

  container.innerHTML = html;

  container.querySelectorAll('.dash-task-check').forEach(cb => {
    cb.addEventListener('change', onTaskCheck);
  });
}

function parseDeadline(str) {
  if (!str) return null;
  // Try YYYY-MM-DD
  const m = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Try DD/MM/YYYY
  const m2 = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);
  return null;
}

function sectionHtml(label, tasks) {
  return `<div class="dash-section">
    <div class="dash-section-label">${label}</div>
    ${tasks.map(t => taskHtml(t)).join('')}
  </div>`;
}

function taskHtml(t) {
  const meta = [t.responsible, t.deadline].filter(x => x && x !== 'Por asignar' && x !== 'Sin fecha').join(' · ');
  const sourceTitle = t.source_title ? `<span class="dash-task-source">${escHtml(t.source_title)}</span>` : '';
  return `<label class="dash-task ${t.done ? 'done' : ''}">
    <input type="checkbox" class="dash-task-check" data-id="${t.id}" ${t.done ? 'checked' : ''}>
    <span class="dash-task-body">
      <span class="dash-task-text">${escHtml(t.text)}</span>
      ${meta || sourceTitle ? `<span class="dash-task-meta">${meta ? escHtml(meta) + ' ' : ''}${sourceTitle}</span>` : ''}
    </span>
  </label>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function onTaskCheck(e) {
  const id = e.target.dataset.id;
  const done = e.target.checked;
  try {
    await fetch(`${API}/dashboard/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    const t = _tasks.find(x => x.id === id);
    if (t) t.done = done;
    renderTasks();
  } catch (err) {
    e.target.checked = !done; // revert
    console.error('Error updating task:', err);
  }
}

async function startBriefing() {
  if (_briefingActive) return;
  _briefingActive = true;
  const btn = document.getElementById('btn-briefing');
  const box = document.getElementById('dash-briefing-box');
  const content = document.getElementById('dash-briefing-content');
  btn.disabled = true;
  btn.textContent = '⏳ Generando…';
  box.style.display = 'block';
  document.getElementById('dash-briefing-placeholder').style.display = 'none';
  content.innerHTML = '<span class="mini-spinner"></span>';

  let full = '';
  try {
    const resp = await fetch(`${API}/dashboard/briefing/stream`, { method: 'POST' });
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    content.textContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.delta) {
          full += payload.delta;
          content.innerHTML = marked.parse(full);
        }
        if (payload.done) break;
        if (payload.error) { content.textContent = 'Error: ' + payload.error; break; }
      }
    }
    if (full) content.innerHTML = marked.parse(full);
  } catch (e) {
    content.textContent = 'Error: ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '✦ Actualizar briefing';
    _briefingActive = false;
  }
}

// Scripts load after DOM is parsed — attach directly
document.getElementById('btn-briefing')?.addEventListener('click', startBriefing);
document.getElementById('btn-refresh-tasks')?.addEventListener('click', loadDashboard);

// Called from nav-btn click handler in app.js
function initDashboardModule() {
  if (!_tasks.length) loadDashboard();
}
