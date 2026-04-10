// Family/app.js

const MEMBERS = [
  { name: 'Victor',  label: 'Víctor',  color: '#3b82f6' },
  { name: 'Johanna', label: 'Johanna', color: '#ec4899' },
  { name: 'Sofia',   label: 'Sofía',   color: '#22c55e' },
  { name: 'Martin',  label: 'Martín',  color: '#f97316' },
];
const COLOR_MAP = Object.fromEntries(MEMBERS.map(m => [m.name, m.color]));
const COLOR_NONE = '#6b7280';

function eventColor(assignees) {
  if (!assignees || assignees.length === 0) return COLOR_NONE;
  return COLOR_MAP[assignees[0]] || COLOR_NONE;
}

// ── FullCalendar ──

let calendar;

function initCalendar() {
  const el = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    height: 'auto',
    editable: true,
    eventStartEditable: true,
    eventDrop: onEventDrop,
    dateClick: onDateClick,
    eventClick: onEventClick,
    events: []
  });
  calendar.render();
}

function onEventDrop(info) {
  const newStart = info.event.startStr; // "2026-04-15"
  updateEvent(info.event.id, { start: newStart }).catch(() => info.revert());
}

function onDateClick(info) {
  openModal({ mode: 'create-event', date: info.dateStr });
}

function onEventClick(info) {
  const ev = info.event;
  openModal({
    mode: 'edit-event',
    id: ev.id,
    title: ev.title,
    date: ev.startStr,
    assignees: ev.extendedProps.assignees || []
  });
}

// ── Listener en tiempo real: events ──

function startEventsListener() {
  onEvents(events => {
    calendar.removeAllEvents();
    events.forEach(ev => {
      calendar.addEvent({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end || undefined,
        backgroundColor: eventColor(ev.assignees),
        extendedProps: { assignees: ev.assignees || [] }
      });
    });
  });
}

// ── Listener en tiempo real: pending ──

function startPendingListener() {
  onPending(items => renderPendingList(items));
}

// ── Render lista pendientes ──

function renderPendingList(items) {
  const list = document.getElementById('pendingList');
  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'pending-item' + (item.done ? ' done' : '');
    li.innerHTML = `
      <div class="pending-check" data-id="${item.id}"></div>
      <span class="pending-title">${escapeHtml(item.title)}</span>
      <div class="assignee-pills">
        ${(item.assignees || []).map(a => pillHtml(a)).join('')}
      </div>
    `;
    // Checkbox toggle done
    li.querySelector('.pending-check').addEventListener('click', e => {
      e.stopPropagation();
      updatePending(item.id, { done: !item.done });
    });
    // Click en el item → editar
    li.addEventListener('click', () => {
      openModal({
        mode: 'edit-pending',
        id: item.id,
        title: item.title,
        assignees: item.assignees || []
      });
    });
    list.appendChild(li);
  });
}

function pillHtml(memberName) {
  const color = COLOR_MAP[memberName] || COLOR_NONE;
  const initial = memberName.charAt(0).toUpperCase();
  return `<div class="assignee-pill" style="background:${color}" title="${memberName}">${initial}</div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Inicialización ──

document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  startEventsListener();
  startPendingListener();
  initModal();

  document.getElementById('btnAddPending').addEventListener('click', () => {
    openModal({ mode: 'create-pending' });
  });
});
