// MSAL Configuration
let msalInstance;
const msalConfig = {
    auth: {
        clientId: localStorage.getItem('outlook_client_id') || 'placeholder-id', 
        authority: `https://login.microsoftonline.com/${localStorage.getItem('outlook_tenant_id') || 'organizations'}`,
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true,
    }
};

const loginRequest = {
    scopes: ["User.Read", "Calendars.ReadWrite"]
};

let isLocalMode = localStorage.getItem('is_local_mode') === 'true';

// UI Elements
const authOverlay = document.getElementById('authOverlay');
const appContainer = document.getElementById('appContainer');
const loginBtn = document.getElementById('loginBtn');
const localModeBtn = document.getElementById('localModeBtn');
const logoutBtn = document.getElementById('logoutBtn');
const setupTrigger = document.getElementById('setupTrigger');
const setupModal = document.getElementById('setupModal');
const closeSetup = document.getElementById('closeSetup');
const saveSetup = document.getElementById('saveSetup');

// Initialize MSAL
async function initAuth() {
    if (isLocalMode) {
        showApp({ name: "Usuario Local", username: "local-user" });
        return;
    }

    if (!localStorage.getItem('outlook_client_id')) {
        console.log("No client ID found, waiting for setup...");
        return;
    }

    try {
        msalInstance = new msal.PublicClientApplication(msalConfig);
        await msalInstance.initialize();
        
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            handleResponse(response);
        } else {
            checkAccounts();
        }
    } catch (error) {
        console.error("MSAL Initialization Error:", error);
    }
}

function handleResponse(response) {
    if (response !== null) {
        localStorage.setItem('microsoft_account', response.account.username);
        showApp(response.account);
    }
}

function checkAccounts() {
    const currentAccounts = msalInstance.getAllAccounts();
    if (currentAccounts.length > 0) {
        showApp(currentAccounts[0]);
    }
}

async function signIn() {
    if (!msalInstance) {
        alert("Primero configura tu Client ID en el enlace de abajo.");
        return;
    }
    try {
        await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
        console.error(err);
        alert("Error al iniciar sesión. Verifica la configuración.");
    }
}

function signOut() {
    if (isLocalMode) {
        localStorage.removeItem('is_local_mode');
        window.location.reload();
    } else {
        msalInstance.logoutRedirect();
    }
}

function showApp(account) {
    authOverlay.style.display = 'none';
    appContainer.style.display = 'grid';
    document.getElementById('userName').innerText = account.name || account.username;
    
    // Trigger initial event fetch
    if (window.fetchOutlookEvents) {
        window.fetchOutlookEvents();
    }
}

// Setup Wizard Logic
setupTrigger.onclick = () => setupModal.style.display = 'block';
closeSetup.onclick = () => setupModal.style.display = 'none';

saveSetup.onclick = () => {
    const cid = document.getElementById('clientId').value;
    const tid = document.getElementById('tenantId').value;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid)) {
        alert("El Client ID debe tener formato UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
        return;
    }

    localStorage.setItem('outlook_client_id', cid);
    localStorage.setItem('outlook_tenant_id', tid);
    alert("Configuración guardada. La página se recargará.");
    window.location.reload();
};

loginBtn.onclick = signIn;
localModeBtn.onclick = () => {
    localStorage.setItem('is_local_mode', 'true');
    window.location.reload();
};
logoutBtn.onclick = signOut;

// Start initialization
initAuth();
