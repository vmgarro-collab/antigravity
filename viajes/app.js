// Viajes/app.js

// ── Estado global ──────────────────────────────────────────
const state = {
  mode: 'demo',
  searchType: 'roundtrip',
  flightQuery: { origin: '', destination: '', departDate: '', returnDate: null, passengers: 1 },
  hotelQuery: { cityCode: '', checkIn: '', checkOut: '', adults: 1 },
  flightResults: [],
  hotelResults: [],
  selectedFlight: null,
  filters: { maxPrice: null, directOnly: false, airlines: [] },
  loading: { flights: false, hotels: false },
  error: { flights: null, hotels: null }
};

// ── Resolución del cliente de búsqueda ────────────────────
function getSearchClient() {
  // amadeus.js y mock.js exponen searchFlights y searchHotels globalmente
  if (state.mode === 'live') {
    return { searchFlights, searchHotels };
  }
  // En modo demo, mock.js expone las mismas funciones pero se han declarado
  // ANTES que amadeus.js en index.html, así que las de amadeus sobreescriben.
  // Usamos los wrappers de mock explícitamente guardados.
  return { searchFlights: mockSearchFlights, searchHotels: mockSearchHotels };
}

// ── Init ─────────────────────────────────────────────────
function init() {
  detectMode();
  setupSearchTypeToggle();
  setDefaultDates();
  lucide.createIcons();
}

function detectMode() {
  let apiKey = null;
  try {
    apiKey = localStorage.getItem('amadeus_api_key');
  } catch (e) {
    apiKey = window._amadeusApiKey || null;
  }
  state.mode = apiKey ? 'live' : 'demo';
  const banner = document.getElementById('demoBanner');
  if (state.mode === 'demo') banner.classList.add('active');
  else banner.classList.remove('active');
}

function setupSearchTypeToggle() {
  const radios = document.querySelectorAll('input[name="searchType"]');
  radios.forEach(r => r.addEventListener('change', () => {
    state.searchType = r.value;
    const returnGroup = document.getElementById('returnDateGroup');
    returnGroup.style.display = r.value === 'roundtrip' ? '' : 'none';
  }));
  // Estado inicial
  document.getElementById('returnDateGroup').style.display = '';
}

function setDefaultDates() {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const depart = new Date(today); depart.setDate(today.getDate() + 30);
  const ret = new Date(today); ret.setDate(today.getDate() + 37);
  document.getElementById('inputDepartDate').value = fmt(depart);
  document.getElementById('inputReturnDate').value = fmt(ret);
  // Hotel defaults
  document.getElementById('hotelCheckIn').value = fmt(depart);
  document.getElementById('hotelCheckOut').value = fmt(ret);
}

// ── Configuración de API ──────────────────────────────────
function openConfig() {
  const key = prompt('Amadeus API Key (Client ID):');
  if (!key) return;
  const secret = prompt('Amadeus API Secret (Client Secret):');
  if (!secret) return;
  try {
    localStorage.setItem('amadeus_api_key', key.trim());
    localStorage.setItem('amadeus_api_secret', secret.trim());
  } catch (e) {
    window._amadeusApiKey = key.trim();
    window._amadeusApiSecret = secret.trim();
  }
  detectMode();
  alert('Credenciales guardadas. Las próximas búsquedas usarán la API real de Amadeus.');
}

window.addEventListener('load', init);
