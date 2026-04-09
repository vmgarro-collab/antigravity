let calendar;

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        firstDay: 1, // Start on Monday
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        allDaySlot: false,
        editable: true,
        droppable: true,
        selectable: true,
        nowIndicator: true,
        locale: 'es',
        
        // Premium Event Styling
        eventColor: '#0078d4',
        eventBackgroundColor: 'rgba(0, 120, 212, 0.2)',
        eventBorderColor: '#0078d4',
        eventTextColor: '#ffffff',
        
        events: (function() {
            try {
                const stored = localStorage.getItem('local_events');
                return stored ? JSON.parse(stored) : null;
            } catch(e) { return null; }
        })() || [
            {
                id: 'demo-1',
                title: 'Ejemplo de Tarea',
                start: (() => { const d = new Date(); d.setHours(10, 0, 0, 0); return d.toISOString(); })(),
                end: (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.toISOString(); })(),
                description: 'Esta es una tarea de demostración que puedes arrastrar'
            }
        ],

        // Handlers for sync
        eventDrop: function(info) {
            console.log("Event moved:", info.event.title);
            if (isLocalMode) {
                saveLocalEvents();
            } else if (window.updateOutlookEvent) {
                window.updateOutlookEvent(info.event);
            }
        },
        
        eventResize: function(info) {
            console.log("Event resized:", info.event.title);
            if (isLocalMode) {
                saveLocalEvents();
            } else if (window.updateOutlookEvent) {
                window.updateOutlookEvent(info.event);
            }
        },

        select: function(info) {
            const title = prompt('Nueva tarea:');
            if (title) {
                const newEvent = {
                    id: isLocalMode ? 'local-' + Date.now() : null,
                    title: title,
                    start: info.startStr,
                    end: info.endStr
                };
                calendar.addEvent(newEvent);
                
                if (isLocalMode) {
                    saveLocalEvents();
                } else if (window.createOutlookEvent) {
                    window.createOutlookEvent(newEvent);
                }
            }
            calendar.unselect();
        },

        eventClick: function(info) {
            if (confirm(`¿Eliminar "${info.event.title}"?`)) {
                info.event.remove();
                if (isLocalMode) {
                    saveLocalEvents();
                }
            }
        }
    });

    calendar.render();
});

function saveLocalEvents() {
    const events = calendar.getEvents().map(e => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        end: e.end ? e.end.toISOString() : ''
    }));
    localStorage.setItem('local_events', JSON.stringify(events));
}

function loadCalendarEvents(events) {
    calendar.removeAllEvents();
    calendar.addEventSource(events);
}
