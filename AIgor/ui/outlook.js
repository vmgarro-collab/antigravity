// ── Estado ──
let selectedEmailId = null;
let selectedEmailThread = [];

// ── Helpers ──
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function firstName(name) {
  return (name || '').split(/[\s,<@]/)[0] || name;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function avatarColor(name) {
  const colors = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899'];
  let h = 0;
  for (const c of (name || '?')) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

function normalizeSubject(s) {
  return s.replace(/^(re|fw|fwd|rv|aw):\s*/gi, '').trim().toLowerCase();
}

// ── Cargar correos ──
async function loadEmails() {
  const sender = document.getElementById('mail-filter-sender').value.trim();
  const subject = document.getElementById('mail-filter-subject').value.trim();
  const listEl = document.getElementById('email-list');
  listEl.innerHTML = '<div class="thread-loading"><div class="mini-spinner"></div> Cargando…</div>';

  try {
    const res = await fetch(`${API}/outlook/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'Inbox', limit: 40, sender, subject }),
    });
    if (!res.ok) throw new Error(await res.text());
    const emails = await res.json();
    renderThreadList(groupByThread(emails));
  } catch (e) {
    listEl.innerHTML = `<div class="thread-error">⚠ ${e.message}</div>`;
  }
}

// ── Agrupar por conversación ──
function groupByThread(emails) {
  const groups = {};
  for (const email of emails) {
    const key = normalizeSubject(email.subject);
    if (!groups[key]) groups[key] = [];
    groups[key].push(email);
  }
  return Object.values(groups).sort((a, b) => new Date(b[0].date) - new Date(a[0].date));
}

// ── Renderizar lista de hilos ──
function renderThreadList(threads) {
  const listEl = document.getElementById('email-list');
  if (!threads.length) {
    listEl.innerHTML = '<div class="thread-empty">No hay correos.</div>';
    return;
  }
  listEl.innerHTML = threads.map(msgs => {
    const latest = msgs[0];
    const hasUnread = msgs.some(m => !m.is_read);
    const count = msgs.length;
    const senders = [...new Set(msgs.map(m => firstName(m.sender)))].slice(0, 2).join(', ');
    const color = avatarColor(senders);
    const initial = (senders[0] || '?').toUpperCase();
    return `
      <div class="thread-item ${hasUnread ? 'unread' : ''}"
           data-id="${latest.id}" onclick="openThread('${latest.id}', this)">
        <div class="thread-item-avatar" style="background:${color}">${initial}</div>
        <div class="thread-item-body">
          <div class="thread-item-row1">
            <span class="thread-senders">${escHtml(senders)}</span>
            <span class="thread-date">${formatDate(latest.date)}</span>
          </div>
          <div class="thread-item-subject">
            ${hasUnread ? '<span class="unread-pill"></span>' : ''}
            <span>${escHtml(latest.subject)}</span>
            ${count > 1 ? `<span class="thread-count-badge">${count}</span>` : ''}
          </div>
          <div class="thread-snippet">${escHtml((latest.body_preview || '').substring(0, 80))}…</div>
        </div>
        ${latest.has_attachments ? '<span class="thread-attach-icon">📎</span>' : ''}
      </div>
    `;
  }).join('');
}

// ── Abrir hilo ──
async function openThread(entryId, el) {
  selectedEmailId = entryId;
  document.querySelectorAll('.thread-item').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('mail-empty-state').style.display = 'none';
  const threadView = document.getElementById('mail-thread-view');
  threadView.style.display = 'flex';

  // Reset
  document.getElementById('thread-subject').textContent = 'Cargando…';
  document.getElementById('thread-participants').textContent = '';
  document.getElementById('thread-chips').innerHTML = '';
  document.getElementById('thread-avatar').textContent = '?';
  document.getElementById('thread-ai-summary').style.display = 'none';
  document.getElementById('email-thread').innerHTML = '<div class="thread-loading"><div class="mini-spinner"></div></div>';
  document.getElementById('draft-area').style.display = 'none';

  try {
    const res = await fetch(`${API}/outlook/email/${encodeURIComponent(entryId)}`);
    if (!res.ok) throw new Error(await res.text());
    selectedEmailThread = await res.json();
    renderThreadDetail(selectedEmailThread);
  } catch (e) {
    document.getElementById('email-thread').innerHTML = `<div class="thread-error">⚠ ${e.message}</div>`;
  }
}

function renderThreadDetail(messages) {
  const latest = messages[messages.length - 1] || messages[0];
  const senders = [...new Set(messages.map(m => m.sender))];
  const initial = (senders[0] || '?')[0].toUpperCase();
  const color = avatarColor(senders[0]);

  document.getElementById('thread-avatar').textContent = initial;
  document.getElementById('thread-avatar').style.background = color;
  document.getElementById('thread-subject').textContent = latest.subject || '(Sin asunto)';
  document.getElementById('thread-participants').textContent = senders.slice(0, 3).join(' · ');

  // Chips de info
  const chips = document.getElementById('thread-chips');
  chips.innerHTML = `
    <span class="info-chip">${messages.length} mensaje${messages.length > 1 ? 's' : ''}</span>
    ${latest.has_attachments ? '<span class="info-chip">📎 Adjunto</span>' : ''}
    ${!latest.is_read ? '<span class="info-chip accent">No leído</span>' : ''}
  `;

  // Mensajes
  const threadEl = document.getElementById('email-thread');
  threadEl.innerHTML = messages.map((m, i) => {
    const isLast = i === messages.length - 1;
    const color = avatarColor(m.sender);
    return `
      <div class="message-bubble ${isLast ? '' : 'collapsed'}" onclick="toggleMessage(this)">
        <div class="message-meta">
          <div class="message-avatar" style="background:${color}">${(m.sender || '?')[0].toUpperCase()}</div>
          <div class="message-info">
            <span class="message-sender">${escHtml(m.sender)}</span>
            <span class="message-date">${new Date(m.date).toLocaleString('es-ES', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <span class="collapse-icon">${isLast ? '▲' : '▼'}</span>
        </div>
        <div class="message-body">${escHtml(isLast ? (m.body || m.body_preview || '') : (m.body_preview || ''))}</div>
      </div>
    `;
  }).join('');

  threadEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleMessage(el) {
  el.classList.toggle('collapsed');
  const icon = el.querySelector('.collapse-icon');
  if (icon) icon.textContent = el.classList.contains('collapsed') ? '▼' : '▲';
}

// ── Resumir hilo con IA ──
async function summarizeThread() {
  if (!selectedEmailThread.length) return;
  const btn = document.getElementById('btn-summarize-thread');
  const summaryEl = document.getElementById('thread-ai-summary');
  const summaryText = document.getElementById('thread-ai-summary-text');

  btn.textContent = '⚡ Resumiendo…';
  btn.disabled = true;

  const context = selectedEmailThread.map((m, i) => {
    const body = (i === selectedEmailThread.length - 1) ? (m.body || m.body_preview) : m.body_preview;
    return `De: ${m.sender}\nFecha: ${m.date}\n${body}`;
  }).join('\n---\n');

  try {
    const res = await fetch(`${API}/outlook/draft/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_context: context, mode: 'summary' }),
    });
    if (!res.ok) throw new Error(await res.text());
    // Reutilizamos el endpoint de draft con un prompt diferente — aquí pedimos resumen
    // Por ahora mostramos el contexto resumido
    const { body } = await res.json();
    summaryText.textContent = body;
    summaryEl.style.display = 'block';
    summaryEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    btn.textContent = '⚡ Resumir hilo';
    btn.disabled = false;
  }
}

// ── Redactar borrador ──
async function requestDraft() {
  if (!selectedEmailThread.length) return;
  const btn = document.getElementById('btn-request-draft');
  btn.textContent = '✦ Generando…';
  btn.disabled = true;

  const context = selectedEmailThread.map((m, i) => {
    const body = (i === selectedEmailThread.length - 1) ? (m.body || m.body_preview) : m.body_preview;
    return `De: ${m.sender}\nFecha: ${m.date}\n${body}`;
  }).join('\n---\n');

  try {
    const res = await fetch(`${API}/outlook/draft/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_context: context }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { body } = await res.json();
    document.getElementById('draft-text').value = body;
    document.getElementById('draft-area').style.display = 'flex';
    document.getElementById('draft-text').focus();
    document.getElementById('draft-area').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    alert('Error generando borrador: ' + e.message);
  } finally {
    btn.textContent = '✦ Redactar respuesta';
    btn.disabled = false;
  }
}

// ── Guardar draft ──
async function saveDraft() {
  if (!selectedEmailThread.length) return;
  const lastMsg = selectedEmailThread[selectedEmailThread.length - 1];
  const body = document.getElementById('draft-text').value;

  try {
    const res = await fetch(`${API}/outlook/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: lastMsg.sender_email,
        subject: 'RE: ' + lastMsg.subject,
        body,
        reply_to_id: selectedEmailId,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    document.getElementById('draft-area').style.display = 'none';
    const btn = document.getElementById('btn-request-draft');
    const orig = btn.textContent;
    btn.textContent = '✓ Guardado en Drafts';
    setTimeout(() => { btn.textContent = '✦ Redactar respuesta'; }, 2500);
  } catch (e) {
    alert('Error guardando borrador: ' + e.message);
  }
}

// ── Calendario ──
async function loadMeetingsToday() {
  const listEl = document.getElementById('meetings-list');
  listEl.innerHTML = '<div class="thread-loading"><div class="mini-spinner"></div> Cargando…</div>';
  try {
    const res = await fetch(`${API}/outlook/calendar/today`);
    if (!res.ok) throw new Error(await res.text());
    const meetings = await res.json();
    if (!meetings.length) {
      listEl.innerHTML = '<p style="color:var(--text-muted);padding:8px 0">No hay reuniones hoy.</p>';
      return;
    }
    listEl.innerHTML = meetings.map(m => {
      const start = new Date(m.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(m.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const attendees = (m.attendees || []).slice(0, 4).map(a => firstName(a)).join(', ');
      const color = m.color || '#3b82f6';
      return `
        <div class="meeting-card" style="border-left-color:${color}">
          <div class="meeting-time-badge" style="color:${color}">${start}</div>
          <div class="meeting-body">
            <div class="meeting-subject">${escHtml(m.subject)}</div>
            <div class="meeting-meta">
              ${m.location ? `<span>📍 ${escHtml(m.location)}</span>` : ''}
              ${attendees ? `<span>👥 ${escHtml(attendees)}</span>` : ''}
              <span>⏱ ${start}–${end}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    listEl.innerHTML = `<p style="color:#ef4444;font-size:0.85rem">Error: ${e.message}</p>`;
  }
}


// ── Abrir en Claude Code ──
function openInClaude() {
  if (!selectedEmailThread.length) return;
  const popover = document.getElementById('claude-popover');
  popover.style.display = popover.style.display === 'none' ? 'flex' : 'none';
}

async function launchClaude(projectId) {
  document.getElementById('claude-popover').style.display = 'none';

  const latest = selectedEmailThread[selectedEmailThread.length - 1];
  const prompt = `Tengo este correo en Outlook:\n\nAsunto: ${latest.subject}\nDe: ${latest.sender}\nFecha: ${latest.date}\n\n${latest.body || latest.body_preview || ''}`;

  await navigator.clipboard.writeText(prompt);

  const base = projectId ? `claude://claude.ai/project/${projectId}` : `claude://claude.ai/new?q=${encodeURIComponent(prompt)}`;
  window.open(base, '_blank');

  const btn = document.getElementById('btn-open-claude');
  btn.textContent = projectId ? '📋 Pega con Ctrl+V' : '✓ Abierto';
  setTimeout(() => { btn.textContent = '⬡ Abrir en Claude'; }, 4000);
}

// ── Event listeners ──
document.getElementById('btn-load-emails').addEventListener('click', loadEmails);
document.getElementById('btn-request-draft').addEventListener('click', requestDraft);
document.getElementById('btn-summarize-thread').addEventListener('click', summarizeThread);
document.getElementById('btn-save-draft').addEventListener('click', saveDraft);
document.getElementById('btn-cancel-draft').addEventListener('click', () => {
  document.getElementById('draft-area').style.display = 'none';
});
document.getElementById('btn-open-claude').addEventListener('click', openInClaude);
