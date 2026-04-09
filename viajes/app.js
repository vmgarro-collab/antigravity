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

// ── Búsqueda de vuelos ────────────────────────────────────
async function handleFlightSearch() {
  const origin = document.getElementById('inputOrigin').value.trim().toUpperCase();
  const destination = document.getElementById('inputDestination').value.trim().toUpperCase();
  const departDate = document.getElementById('inputDepartDate').value;
  const returnDate = state.searchType === 'roundtrip'
    ? document.getElementById('inputReturnDate').value
    : null;
  const passengers = parseInt(document.getElementById('inputPassengers').value) || 1;

  if (!origin || !destination || !departDate) {
    alert('Por favor completa origen, destino y fecha de ida.');
    return;
  }

  state.flightQuery = { origin, destination, departDate, returnDate, passengers };
  state.selectedFlight = null;
  state.error.flights = null;
  state.loading.flights = true;

  renderFlightsLoading();

  try {
    const client = getSearchClient();
    const results = await client.searchFlights(state.flightQuery);
    state.flightResults = results;
    state.loading.flights = false;
    applyFilters();
    showFilters(results);
  } catch (err) {
    state.loading.flights = false;
    state.error.flights = err.message;
    renderFlightsError();
  }
}

function applyFilters() {
  let results = [...state.flightResults];
  if (state.filters.directOnly) results = results.filter(f => f.stops === 0);
  if (state.filters.maxPrice) results = results.filter(f => f.price <= state.filters.maxPrice);
  if (state.filters.airlines.length > 0) results = results.filter(f => state.filters.airlines.includes(f.airline));
  results.sort((a, b) => a.price - b.price);
  renderFlights(results);
}

function handleFilterChange() {
  const maxPriceSlider = document.getElementById('filterMaxPrice');
  const maxPriceVal = parseInt(maxPriceSlider.value);
  state.filters.maxPrice = maxPriceVal >= 1000 ? null : maxPriceVal;
  document.getElementById('maxPriceValue').textContent = state.filters.maxPrice ? `${state.filters.maxPrice}€` : 'sin límite';
  state.filters.directOnly = document.getElementById('filterDirect').checked;
  state.filters.airlines = Array.from(document.querySelectorAll('.airline-check:checked')).map(cb => cb.value);
  applyFilters();
}

function showFilters(results) {
  document.getElementById('filtersSection').classList.add('active');
  const airlines = [...new Set(results.map(f => f.airline))];
  const group = document.getElementById('airlineFilterGroup');
  const list = document.getElementById('airlinesList');
  if (airlines.length > 1) {
    group.style.display = '';
    list.innerHTML = airlines.map(a => `
      <label class="checkbox-label">
        <input type="checkbox" class="airline-check" value="${a}" checked onchange="handleFilterChange()">
        ${a}
      </label>
    `).join('');
    state.filters.airlines = [];
  } else {
    group.style.display = 'none';
  }
  lucide.createIcons();
}

// ── Renderizado de vuelos ─────────────────────────────────
function renderFlightsLoading() {
  const container = document.getElementById('flightsContainer');
  container.innerHTML = [1,2,3].map(() => `
    <div class="skeleton-card">
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line" style="width:80%"></div>
    </div>
  `).join('');
  document.getElementById('flightsCount').style.display = 'none';
}

function renderFlightsError() {
  const container = document.getElementById('flightsContainer');
  container.innerHTML = `
    <div class="error-state">
      <i data-lucide="alert-circle" style="width:36px;height:36px"></i>
      <p>${state.error.flights}</p>
      <button class="btn-retry" onclick="handleFlightSearch()">Reintentar</button>
    </div>
  `;
  lucide.createIcons();
}

function renderFlights(flights) {
  const container = document.getElementById('flightsContainer');
  const countEl = document.getElementById('flightsCount');

  if (flights.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x" style="width:36px;height:36px"></i>
        <p>No encontramos vuelos</p>
        <span>Prueba con otras fechas o amplía los filtros</span>
      </div>
    `;
    countEl.style.display = 'none';
    lucide.createIcons();
    return;
  }

  countEl.textContent = `${flights.length} vuelo${flights.length !== 1 ? 's' : ''}`;
  countEl.style.display = '';

  container.innerHTML = flights.map(f => {
    const depart = new Date(f.departTime);
    const arrive = new Date(f.arriveTime);
    const fmt = d => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const stopsBadge = f.stops === 0
      ? `<span class="badge badge-direct">Directo</span>`
      : `<span class="badge badge-stops">${f.stops} escala${f.stops > 1 ? 's' : ''}</span>`;
    const baggageBadge = f.baggageIncluded
      ? `<span class="badge badge-baggage"><i data-lucide="luggage" style="width:10px;height:10px"></i> Equipaje incluido</span>`
      : '';
    const isSelected = state.selectedFlight?.id === f.id;

    return `
      <div class="flight-card ${isSelected ? 'selected' : ''}" onclick="selectFlight('${f.id}')">
        <div class="flight-main">
          <div class="flight-route">
            <span>${f.origin}</span>
            <div class="flight-route-sep">
              <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
            </div>
            <span>${f.destination}</span>
          </div>
          <div class="flight-times">
            <span>${fmt(depart)}</span>
            <span>—</span>
            <span>${fmt(arrive)}</span>
            <span style="margin-left:4px">· ${f.duration}</span>
          </div>
          <div class="flight-info">
            <span style="color:var(--text-muted)">${f.airline} ${f.flightNumber}</span>
            ${stopsBadge}
            ${baggageBadge}
          </div>
        </div>
        <div class="flight-price">
          <div class="flight-price-amount">${f.price}€</div>
          <div class="flight-price-label">por persona</div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function selectFlight(flightId) {
  const flight = state.flightResults.find(f => f.id === flightId);
  if (!flight) return;
  state.selectedFlight = flight;

  // Actualizar visual de selección
  applyFilters();

  // Pre-rellenar búsqueda de hoteles
  document.getElementById('hotelCityInput').value = flight.destination;
  document.getElementById('hotelCheckIn').value = flight.departTime.split('T')[0];
  if (state.flightQuery.returnDate) {
    document.getElementById('hotelCheckOut').value = state.flightQuery.returnDate;
  }

  // Mostrar badge de vuelo seleccionado
  const badge = document.getElementById('selectedFlightBadge');
  badge.classList.add('active');
  document.getElementById('selectedFlightText').textContent =
    `Vuelo seleccionado: ${flight.airline} ${flight.flightNumber} · ${flight.origin} → ${flight.destination} · ${flight.price}€`;

  // Mostrar sección de hoteles
  document.getElementById('hotelsSection').style.display = '';
  lucide.createIcons();
}

// ── Búsqueda de hoteles ───────────────────────────────────
async function handleHotelSearch() {
  const cityCode = document.getElementById('hotelCityInput').value.trim().toUpperCase();
  const checkIn = document.getElementById('hotelCheckIn').value;
  const checkOut = document.getElementById('hotelCheckOut').value;
  const adults = parseInt(document.getElementById('inputPassengers').value) || 1;

  if (!cityCode || !checkIn || !checkOut) {
    alert('Por favor completa ciudad, fecha de entrada y fecha de salida.');
    return;
  }
  if (new Date(checkOut) <= new Date(checkIn)) {
    alert('La fecha de salida debe ser posterior a la de entrada.');
    return;
  }

  state.hotelQuery = { cityCode, checkIn, checkOut, adults };
  state.error.hotels = null;
  state.loading.hotels = true;

  renderHotelsLoading();

  try {
    const client = getSearchClient();
    const results = await client.searchHotels(state.hotelQuery);
    state.hotelResults = results;
    state.loading.hotels = false;
    renderHotels(results);
  } catch (err) {
    state.loading.hotels = false;
    state.error.hotels = err.message;
    renderHotelsError();
  }
}

// ── Renderizado de hoteles ────────────────────────────────
function renderHotelsLoading() {
  const container = document.getElementById('hotelsContainer');
  container.innerHTML = [1,2,3].map(() => `
    <div class="skeleton-card" style="margin-top:8px">
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line" style="width:70%"></div>
    </div>
  `).join('');
  document.getElementById('hotelsCount').style.display = 'none';
}

function renderHotelsError() {
  const container = document.getElementById('hotelsContainer');
  container.innerHTML = `
    <div class="error-state">
      <i data-lucide="alert-circle" style="width:36px;height:36px"></i>
      <p>${state.error.hotels}</p>
      <button class="btn-retry" onclick="handleHotelSearch()">Reintentar</button>
    </div>
  `;
  lucide.createIcons();
}

function renderHotels(hotels) {
  const container = document.getElementById('hotelsContainer');
  const countEl = document.getElementById('hotelsCount');

  if (hotels.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="building-2" style="width:36px;height:36px"></i>
        <p>No encontramos hoteles disponibles</p>
        <span>Prueba con otras fechas o ciudad</span>
      </div>
    `;
    countEl.style.display = 'none';
    lucide.createIcons();
    return;
  }

  countEl.textContent = `${hotels.length} hotel${hotels.length !== 1 ? 'es' : ''}`;
  countEl.style.display = '';

  const sorted = [...hotels].sort((a, b) => a.pricePerNight - b.pricePerNight);

  container.innerHTML = sorted.map(h => {
    const stars = '★'.repeat(h.stars) + '☆'.repeat(5 - h.stars);
    const nights = Math.max(1, (new Date(h.checkOut) - new Date(h.checkIn)) / 86400000);
    const checkInFmt = new Date(h.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const checkOutFmt = new Date(h.checkOut).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return `
      <div class="hotel-card">
        <div>
          <div class="hotel-name">${h.name}</div>
          <div class="hotel-stars">${stars}</div>
          <div class="hotel-dates">${checkInFmt} → ${checkOutFmt} · ${nights} noche${nights !== 1 ? 's' : ''}</div>
        </div>
        <div class="hotel-price">
          <div class="hotel-price-night">${Math.round(h.pricePerNight)}€<span style="font-size:12px;font-weight:400">/noche</span></div>
          <div class="hotel-price-total">Total: ${Math.round(h.totalPrice)}€</div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}
