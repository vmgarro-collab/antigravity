// ── Estado correos ──
let selectedEmailId = null;
let selectedEmailThread = [];

// ── Cargar lista de correos ──
async function loadEmails() {
  const sender = document.getElementById('mail-filter-sender').value;
  const subject = document.getElementById('mail-filter-subject').value;
  const listEl = document.getElementById('email-list');
  listEl.innerHTML = '<p style="color:#888;font-size:0.85rem;padding:8px">Cargando...</p>';

  try {
    const res = await fetch(`${API}/outlook/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'Inbox', limit: 30, sender, subject }),
    });
    if (!res.ok) throw new Error(await res.text());
    const emails = await res.json();
    renderEmailList(emails);
  } catch (e) {
    listEl.innerHTML = `<p style="color:#ef4444;font-size:0.85rem;padding:8px">Error: ${e.message}</p>`;
  }
}

function renderEmailList(emails) {
  const listEl = document.getElementById('email-list');
  if (!emails.length) {
    listEl.innerHTML = '<p style="color:#888;font-size:0.85rem;padding:8px">No hay correos.</p>';
    return;
  }
  listEl.innerHTML = emails.map(e => `
    <div class="email-card ${e.is_read ? '' : 'unread'} ${e.id === selectedEmailId ? 'selected' : ''}"
         data-id="${e.id}" onclick="openThread('${e.id}')">
      <div class="email-sender">${e.sender}</div>
      <div class="email-subject">${e.subject}</div>
      <div class="email-date">${new Date(e.date).toLocaleString('es-ES')}</div>
    </div>
  `).join('');
}

// ── Abrir hilo ──
async function openThread(entryId) {
  selectedEmailId = entryId;
  document.querySelectorAll('.email-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`.email-card[data-id="${entryId}"]`);
  if (card) card.classList.add('selected');

  document.getElementById('email-detail-empty').style.display = 'none';
  const detailEl = document.getElementById('email-detail');
  detailEl.style.display = 'block';
  document.getElementById('email-thread').innerHTML = '<p style="color:#888">Cargando hilo...</p>';
  document.getElementById('draft-area').style.display = 'none';
  document.getElementById('draft-actions').style.display = 'flex';

  try {
    const res = await fetch(`${API}/outlook/email/${encodeURIComponent(entryId)}`);
    if (!res.ok) throw new Error(await res.text());
    selectedEmailThread = await res.json();
    renderThread(selectedEmailThread);
  } catch (e) {
    document.getElementById('email-thread').innerHTML = `<p style="color:#ef4444">Error: ${e.message}</p>`;
  }
}

function renderThread(messages) {
  const threadEl = document.getElementById('email-thread');
  threadEl.innerHTML = messages.map(m => `
    <div class="thread-msg">
      <div class="thread-msg-header">
        <strong>${m.sender}</strong> · ${new Date(m.date).toLocaleString('es-ES')}
      </div>
      <div class="thread-msg-body">${m.body_preview}</div>
    </div>
  `).join('');
}

// ── Pedir borrador ──
async function requestDraft() {
  if (!selectedEmailId || !selectedEmailThread.length) return;
  const btn = document.getElementById('btn-request-draft');
  btn.textContent = 'Generando...';
  btn.disabled = true;

  const context = selectedEmailThread.map(m =>
    `De: ${m.sender}\nFecha: ${m.date}\n${m.body_preview}`
  ).join('\n---\n');

  try {
    const res = await fetch(`${API}/outlook/draft/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_context: context }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { body: result } = await res.json();
    document.getElementById('draft-text').value = result;
    document.getElementById('draft-area').style.display = 'block';
    document.getElementById('draft-actions').style.display = 'none';
  } catch (e) {
    alert('Error generando borrador: ' + e.message);
  } finally {
    btn.textContent = '✦ Pedir borrador a Claude';
    btn.disabled = false;
  }
}

// ── Guardar draft en Outlook ──
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
    document.getElementById('draft-actions').style.display = 'flex';
    alert('✓ Borrador guardado en Drafts de Outlook');
  } catch (e) {
    alert('Error guardando borrador: ' + e.message);
  }
}

// ── Módulo Calendario ──
async function loadMeetingsToday() {
  const listEl = document.getElementById('meetings-list');
  listEl.innerHTML = '<p style="color:#888;font-size:0.85rem">Cargando reuniones...</p>';
  try {
    const res = await fetch(`${API}/outlook/calendar/today`);
    if (!res.ok) throw new Error(await res.text());
    const meetings = await res.json();
    if (!meetings.length) {
      listEl.innerHTML = '<p style="color:#888">No hay reuniones hoy.</p>';
      return;
    }
    listEl.innerHTML = meetings.map(m => {
      const start = new Date(m.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(m.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const attendees = (m.attendees || []).slice(0, 3).join(', ');
      return `
        <div class="meeting-card">
          <div class="meeting-time">${start} – ${end}</div>
          <div class="meeting-subject">${m.subject}</div>
          <div class="meeting-meta">${m.location ? m.location + ' · ' : ''}${attendees}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    listEl.innerHTML = `<p style="color:#ef4444;font-size:0.85rem">Error: ${e.message}</p>`;
  }
}

async function generateBriefing() {
  const btn = document.getElementById('btn-generate-briefing');
  const spinner = document.getElementById('calendar-spinner');
  const resultEl = document.getElementById('briefing-result');

  btn.disabled = true;
  btn.textContent = 'Generando...';
  spinner.style.display = 'block';
  resultEl.style.display = 'none';

  try {
    const res = await fetch(`${API}/outlook/briefing/generate`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const { result, saved_to } = await res.json();
    document.getElementById('briefing-content').innerHTML = marked.parse(result);
    document.getElementById('briefing-saved-path').textContent = saved_to || '';
    resultEl.style.display = 'block';
  } catch (e) {
    alert('Error generando briefing: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '✦ Generar briefing ahora';
    spinner.style.display = 'none';
  }
}

// ── Event listeners ──
document.getElementById('btn-load-emails').addEventListener('click', loadEmails);
document.getElementById('btn-request-draft').addEventListener('click', requestDraft);
document.getElementById('btn-save-draft').addEventListener('click', saveDraft);
document.getElementById('btn-cancel-draft').addEventListener('click', () => {
  document.getElementById('draft-area').style.display = 'none';
  document.getElementById('draft-actions').style.display = 'flex';
});
document.getElementById('btn-generate-briefing').addEventListener('click', generateBriefing);
