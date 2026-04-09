async function getGraphClient() {
    if (!msalInstance) return null;

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read", "Calendars.ReadWrite"],
        account: accounts[0]
    });

    return MicrosoftGraph.Client.init({
        authProvider: (done) => {
            done(null, tokenResponse.accessToken);
        }
    });
}

window.fetchOutlookEvents = async function() {
    const client = await getGraphClient();
    if (!client) return;

    try {
        // Fetch events for the next 30 days
        const result = await client.api('/me/events')
            .select('subject,start,end,id')
            .get();

        const formattedEvents = result.value.map(event => ({
            id: event.id,
            title: event.subject,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            allDay: !event.start.dateTime
        }));

        loadCalendarEvents(formattedEvents);
    } catch (error) {
        console.error("Error fetching events:", error);
    }
}

window.updateOutlookEvent = async function(fcEvent) {
    const client = await getGraphClient();
    if (!client || !fcEvent.id) return;

    try {
        const update = {
            start: {
                dateTime: fcEvent.start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: fcEvent.end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        await client.api(`/me/events/${fcEvent.id}`).update(update);
        console.log("Successfully updated Outlook");
    } catch (error) {
        console.error("Error updating event:", error);
        alert("Error al sincronizar con Outlook. Verifica los permisos.");
    }
}

window.createOutlookEvent = async function(fcEvent) {
    const client = await getGraphClient();
    if (!client) return;

    try {
        const newEvent = {
            subject: fcEvent.title,
            start: {
                dateTime: new Date(fcEvent.start).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: new Date(fcEvent.end).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        const result = await client.api('/me/events').post(newEvent);
        // Update the local event with the remote ID
        fcEvent.setProp('id', result.id);
        console.log("Successfully created event in Outlook");
    } catch (error) {
        console.error("Error creating event:", error);
        alert("Error al crear el evento en Outlook.");
    }
}
