# Viajes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-column flight + hotel search app in `Viajes/` using vanilla JS, mock data by default, and Amadeus API when credentials are configured.

**Architecture:** Five files — `index.html` (structure + CDN), `styles.css` (glassmorphism dark), `mock.js` (static data + same API surface), `amadeus.js` (Amadeus API client), `app.js` (state machine + UI rendering). No build step, no backend, runs from `file://`.

**Tech Stack:** Vanilla JS ES6, Lucide icons (CDN), Amadeus REST API (test tier), localStorage for credentials.

---

## File Map

| File | Responsibility |
|---|---|
| `Viajes/index.html` | HTML skeleton, CDN imports (Lucide), script tags in order |
| `Viajes/styles.css` | Glassmorphism dark layout, two-column grid, cards, responsive |
| `Viajes/mock.js` | `searchFlights(query)` + `searchHotels(query)` with static data, 800ms simulated delay |
| `Viajes/amadeus.js` | Token auth + `searchFlights(query)` + `searchHotels(query)` → normalized format |
| `Viajes/app.js` | Global state, init(), form handling, rendering, filters, credential flow |

---

## Task 1: mock.js — datos de vuelos y hoteles

**Files:**
- Create: `Viajes/mock.js`

- [ ] **Step 1: Crear `Viajes/mock.js` con datos de vuelos**

```js
// Viajes/mock.js

const MOCK_FLIGHTS = [
  {
    id: 'f1',
    airline: 'Iberia',
    flightNumber: 'IB3456',
    origin: 'MAD',
    destination: 'BCN',
    departTime: '2026-05-15T08:00:00',
    arriveTime: '2026-05-15T09:15:00',
    duration: '1h 15m',
    stops: 0,
    price: 89,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  },
  {
    id: 'f2',
    airline: 'Vueling',
    flightNumber: 'VY1234',
    origin: 'MAD',
    destination: 'BCN',
    departTime: '2026-05-15T11:30:00',
    arriveTime: '2026-05-15T12:50:00',
    duration: '1h 20m',
    stops: 0,
    price: 67,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  },
  {
    id: 'f3',
    airline: 'Ryanair',
    flightNumber: 'FR9988',
    origin: 'MAD',
    destination: 'BCN',
    departTime: '2026-05-15T19:45:00',
    arriveTime: '2026-05-15T21:10:00',
    duration: '1h 25m',
    stops: 0,
    price: 34,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  },
  {
    id: 'f4',
    airline: 'Air Europa',
    flightNumber: 'UX6612',
    origin: 'MAD',
    destination: 'PMI',
    departTime: '2026-05-15T07:15:00',
    arriveTime: '2026-05-15T08:30:00',
    duration: '1h 15m',
    stops: 0,
    price: 55,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: true
  },
  {
    id: 'f5',
    airline: 'Iberia',
    flightNumber: 'IB8821',
    origin: 'MAD',
    destination: 'SVQ',
    departTime: '2026-05-15T10:00:00',
    arriveTime: '2026-05-15T11:05:00',
    duration: '1h 05m',
    stops: 0,
    price: 72,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: true
  },
  {
    id: 'f6',
    airline: 'Vueling',
    flightNumber: 'VY3301',
    origin: 'BCN',
    destination: 'LIS',
    departTime: '2026-05-15T14:20:00',
    arriveTime: '2026-05-15T16:10:00',
    duration: '1h 50m',
    stops: 0,
    price: 98,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  },
  {
    id: 'f7',
    airline: 'Iberia',
    flightNumber: 'IB4477',
    origin: 'MAD',
    destination: 'BCN',
    departTime: '2026-05-15T16:00:00',
    arriveTime: '2026-05-15T19:30:00',
    duration: '3h 30m',
    stops: 1,
    price: 45,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  },
  {
    id: 'f8',
    airline: 'Ryanair',
    flightNumber: 'FR1122',
    origin: 'MAD',
    destination: 'PMI',
    departTime: '2026-05-15T06:00:00',
    arriveTime: '2026-05-15T07:20:00',
    duration: '1h 20m',
    stops: 0,
    price: 28,
    currency: 'EUR',
    cabin: 'ECONOMY',
    baggageIncluded: false
  }
];

const MOCK_HOTELS = {
  BCN: [
    { id: 'h1', name: 'Hotel Arts Barcelona', stars: 5, cityCode: 'BCN', checkIn: '', checkOut: '', pricePerNight: 320, currency: 'EUR', totalPrice: 0 },
    { id: 'h2', name: 'Catalonia Ramblas', stars: 4, cityCode: 'BCN', checkIn: '', checkOut: '', pricePerNight: 145, currency: 'EUR', totalPrice: 0 },
    { id: 'h3', name: 'Ibis Barcelona Centro', stars: 2, cityCode: 'BCN', checkIn: '', checkOut: '', pricePerNight: 68, currency: 'EUR', totalPrice: 0 },
    { id: 'h4', name: 'NH Collection Gran Hotel Calderón', stars: 4, cityCode: 'BCN', checkIn: '', checkOut: '', pricePerNight: 189, currency: 'EUR', totalPrice: 0 }
  ],
  MAD: [
    { id: 'h5', name: 'Hotel Ritz Madrid', stars: 5, cityCode: 'MAD', checkIn: '', checkOut: '', pricePerNight: 450, currency: 'EUR', totalPrice: 0 },
    { id: 'h6', name: 'Room Mate Óscar', stars: 3, cityCode: 'MAD', checkIn: '', checkOut: '', pricePerNight: 95, currency: 'EUR', totalPrice: 0 },
    { id: 'h7', name: 'Ibis Madrid Centro', stars: 2, cityCode: 'MAD', checkIn: '', checkOut: '', pricePerNight: 62, currency: 'EUR', totalPrice: 0 }
  ],
  PMI: [
    { id: 'h8', name: 'Melià Palma Bay', stars: 4, cityCode: 'PMI', checkIn: '', checkOut: '', pricePerNight: 175, currency: 'EUR', totalPrice: 0 },
    { id: 'h9', name: 'Hotel Saratoga', stars: 4, cityCode: 'PMI', checkIn: '', checkOut: '', pricePerNight: 130, currency: 'EUR', totalPrice: 0 },
    { id: 'h10', name: 'Hostal Brondo Architect', stars: 3, cityCode: 'PMI', checkIn: '', checkOut: '', pricePerNight: 88, currency: 'EUR', totalPrice: 0 }
  ],
  SVQ: [
    { id: 'h11', name: 'Hotel Alfonso XIII', stars: 5, cityCode: 'SVQ', checkIn: '', checkOut: '', pricePerNight: 290, currency: 'EUR', totalPrice: 0 },
    { id: 'h12', name: 'NH Sevilla', stars: 4, cityCode: 'SVQ', checkIn: '', checkOut: '', pricePerNight: 115, currency: 'EUR', totalPrice: 0 },
    { id: 'h13', name: 'Casual Sevilla Don Juan', stars: 3, cityCode: 'SVQ', checkIn: '', checkOut: '', pricePerNight: 72, currency: 'EUR', totalPrice: 0 }
  ],
  LIS: [
    { id: 'h14', name: 'Bairro Alto Hotel', stars: 5, cityCode: 'LIS', checkIn: '', checkOut: '', pricePerNight: 260, currency: 'EUR', totalPrice: 0 },
    { id: 'h15', name: 'Hotel Britania', stars: 4, cityCode: 'LIS', checkIn: '', checkOut: '', pricePerNight: 140, currency: 'EUR', totalPrice: 0 },
    { id: 'h16', name: 'Lisbon Lounge Hostel', stars: 2, cityCode: 'LIS', checkIn: '', checkOut: '', pricePerNight: 45, currency: 'EUR', totalPrice: 0 }
  ]
};

function calcNights(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 1;
}

async function searchFlights(query) {
  await new Promise(resolve => setTimeout(resolve, 800));
  const { origin, destination } = query;
  const results = MOCK_FLIGHTS.filter(
    f => f.origin === origin.toUpperCase() && f.destination === destination.toUpperCase()
  );
  // Si no hay match exacto, devolver todos (demo genérico)
  return results.length > 0 ? results : MOCK_FLIGHTS.slice(0, 5);
}

async function searchHotels(query) {
  await new Promise(resolve => setTimeout(resolve, 800));
  const { cityCode, checkIn, checkOut, adults } = query;
  const nights = calcNights(checkIn, checkOut);
  const base = MOCK_HOTELS[cityCode.toUpperCase()] || MOCK_HOTELS['BCN'];
  return base.map(h => ({
    ...h,
    checkIn,
    checkOut,
    totalPrice: h.pricePerNight * nights
  }));
}
```

- [ ] **Step 2: Verificar la estructura en la consola del navegador**

Abre `Viajes/index.html` en el navegador (lo crearás en Task 4). En la consola ejecuta:
```js
searchFlights({ origin: 'MAD', destination: 'BCN' }).then(r => console.log(r))
```
Esperado: array de 3+ objetos FlightOffer con todos los campos.

- [ ] **Step 3: Commit**

```bash
git add Viajes/mock.js
git commit -m "feat(viajes): add mock data for flights and hotels"
```

---

## Task 2: amadeus.js — cliente API

**Files:**
- Create: `Viajes/amadeus.js`

- [ ] **Step 1: Crear `Viajes/amadeus.js`**

```js
// Viajes/amadeus.js

const AMADEUS_BASE = 'https://test.api.amadeus.com';

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  let apiKey, apiSecret;
  try {
    apiKey = localStorage.getItem('amadeus_api_key');
    apiSecret = localStorage.getItem('amadeus_api_secret');
  } catch (e) {
    // localStorage bloqueado en file://
    apiKey = window._amadeusApiKey;
    apiSecret = window._amadeusApiSecret;
  }

  if (!apiKey || !apiSecret) throw new Error('Credenciales Amadeus no configuradas');

  const resp = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`
  });
  if (!resp.ok) throw new Error('Error de autenticación con Amadeus');
  const data = await resp.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token;
}

function normalizeFlights(data) {
  if (!data.data) return [];
  return data.data.map((offer, i) => {
    const seg = offer.itineraries[0].segments[0];
    const lastSeg = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
    const stops = offer.itineraries[0].segments.length - 1;
    const duration = offer.itineraries[0].duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').trim();
    return {
      id: offer.id || String(i),
      airline: seg.carrierCode,
      flightNumber: `${seg.carrierCode}${seg.number}`,
      origin: seg.departure.iataCode,
      destination: lastSeg.arrival.iataCode,
      departTime: seg.departure.at,
      arriveTime: lastSeg.arrival.at,
      duration,
      stops,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
      baggageIncluded: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity > 0
    };
  });
}

function normalizeHotels(hotelIds, offersData, checkIn, checkOut) {
  if (!offersData.data) return [];
  const nights = Math.max(1, (new Date(checkOut) - new Date(checkIn)) / 86400000);
  return offersData.data.flatMap(hotel =>
    (hotel.offers || []).slice(0, 1).map(offer => ({
      id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      stars: hotel.hotel.rating ? parseInt(hotel.hotel.rating) : 3,
      cityCode: hotel.hotel.cityCode || '',
      checkIn,
      checkOut,
      pricePerNight: parseFloat(offer.price.total) / nights,
      currency: offer.price.currency,
      totalPrice: parseFloat(offer.price.total)
    }))
  );
}

async function searchFlights(query) {
  const token = await getToken();
  const { origin, destination, departDate, returnDate, passengers } = query;
  const params = new URLSearchParams({
    originLocationCode: origin.toUpperCase(),
    destinationLocationCode: destination.toUpperCase(),
    departureDate: departDate,
    adults: passengers || 1,
    currencyCode: 'EUR',
    max: 20
  });
  if (returnDate) params.set('returnDate', returnDate);

  const resp = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Error al buscar vuelos en Amadeus');
  const data = await resp.json();
  return normalizeFlights(data);
}

async function searchHotels(query) {
  const token = await getToken();
  const { cityCode, checkIn, checkOut, adults } = query;

  // Paso 1: obtener hotel IDs por ciudad
  const cityResp = await fetch(
    `${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode.toUpperCase()}&radius=5&radiusUnit=KM&hotelSource=ALL`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!cityResp.ok) throw new Error('Error al buscar hoteles en Amadeus');
  const cityData = await cityResp.json();
  const hotelIds = (cityData.data || []).slice(0, 10).map(h => h.hotelId).join(',');
  if (!hotelIds) return [];

  // Paso 2: buscar ofertas
  const offersResp = await fetch(
    `${AMADEUS_BASE}/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=${adults || 1}&currencyCode=EUR`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!offersResp.ok) throw new Error('Error al obtener precios de hoteles');
  const offersData = await offersResp.json();
  return normalizeHotels(hotelIds, offersData, checkIn, checkOut);
}
```

- [ ] **Step 2: Verificar en consola (modo live)**

Si tienes credenciales Amadeus, en la consola:
```js
localStorage.setItem('amadeus_api_key', 'TU_KEY');
localStorage.setItem('amadeus_api_secret', 'TU_SECRET');
searchFlights({ origin: 'MAD', destination: 'BCN', departDate: '2026-06-01', passengers: 1 }).then(console.log);
```
Esperado: array de FlightOffer normalizados. Sin credenciales, el test de mock.js es suficiente.

- [ ] **Step 3: Commit**

```bash
git add Viajes/amadeus.js
git commit -m "feat(viajes): add Amadeus API client with token caching"
```

---

## Task 3: styles.css — layout y estilos

**Files:**
- Create: `Viajes/styles.css`

- [ ] **Step 1: Crear `Viajes/styles.css`**

```css
/* Viajes/styles.css */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0f;
  --surface: rgba(255,255,255,0.05);
  --surface-hover: rgba(255,255,255,0.08);
  --border: rgba(255,255,255,0.1);
  --neon: #7c3aed;
  --neon-light: #a78bfa;
  --cyan: #06b6d4;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --success: #10b981;
  --danger: #ef4444;
  --radius: 12px;
  --blur: blur(16px);
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
  font-size: 14px;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--surface);
  backdrop-filter: var(--blur);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--neon-light);
}

.header-logo i { color: var(--cyan); }

.btn-config {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-config:hover { border-color: var(--neon-light); color: var(--neon-light); }

/* ── Demo banner ── */
.demo-banner {
  background: rgba(124, 58, 237, 0.15);
  border-bottom: 1px solid rgba(124, 58, 237, 0.3);
  padding: 10px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--neon-light);
  display: none;
}
.demo-banner.active { display: block; }

/* ── Main layout ── */
.main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  height: calc(100vh - 57px);
  overflow: hidden;
}

/* ── Panel izquierdo ── */
.sidebar {
  background: var(--surface);
  backdrop-filter: var(--blur);
  border-right: 1px solid var(--border);
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Panel derecho ── */
.results-panel {
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Formulario ── */
.form-section { display: flex; flex-direction: column; gap: 14px; }

.form-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.radio-group {
  display: flex;
  gap: 0;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  padding: 3px;
}

.radio-option {
  flex: 1;
  position: relative;
}

.radio-option input { display: none; }

.radio-option label {
  display: block;
  text-align: center;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.radio-option input:checked + label {
  background: var(--neon);
  color: white;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; color: var(--text-muted); }

.form-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--text);
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
}
.form-input:focus { outline: none; border-color: var(--neon-light); }
.form-input::placeholder { color: var(--text-muted); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--neon), #6d28d9);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  width: 100%;
}
.btn-search:hover { opacity: 0.9; }
.btn-search:active { transform: scale(0.98); }

/* ── Filtros ── */
.filters-section {
  display: none;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.filters-section.active { display: flex; }

.filter-group { display: flex; flex-direction: column; gap: 8px; }

.range-input {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--neon);
  cursor: pointer;
}

.range-value { font-size: 12px; color: var(--neon-light); text-align: right; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
}

.checkbox-label input[type=checkbox] { accent-color: var(--neon); width: 14px; height: 14px; }

.airlines-list { display: flex; flex-direction: column; gap: 6px; }

/* ── Sección resultados ── */
.results-section { display: flex; flex-direction: column; gap: 12px; }

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.results-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface);
  padding: 3px 10px;
  border-radius: 20px;
}

/* ── Estado vacío ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
  text-align: center;
}
.empty-state i { color: var(--neon-light); opacity: 0.5; }
.empty-state p { font-size: 15px; }
.empty-state span { font-size: 13px; }

/* ── Skeleton ── */
.skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, var(--border) 25%, rgba(255,255,255,0.08) 50%, var(--border) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}
.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 65%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Flight card ── */
.flight-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}
.flight-card:hover { background: var(--surface-hover); border-color: var(--neon-light); }
.flight-card.selected { border-color: var(--neon); background: rgba(124,58,237,0.1); }

.flight-main { display: flex; flex-direction: column; gap: 8px; }

.flight-route {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
}

.flight-route-sep { color: var(--text-muted); font-size: 14px; display: flex; align-items: center; gap: 4px; }

.flight-times { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }

.flight-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
}

.badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge-direct { background: rgba(16,185,129,0.15); color: var(--success); }
.badge-stops { background: rgba(239,68,68,0.15); color: var(--danger); }
.badge-baggage { background: rgba(6,182,212,0.15); color: var(--cyan); }

.flight-price { text-align: right; }
.flight-price-amount { font-size: 22px; font-weight: 700; color: var(--neon-light); }
.flight-price-label { font-size: 11px; color: var(--text-muted); }

/* ── Hotel card ── */
.hotel-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  transition: all 0.2s;
}
.hotel-card:hover { background: var(--surface-hover); border-color: rgba(6,182,212,0.5); }

.hotel-name { font-size: 15px; font-weight: 600; }
.hotel-stars { color: #f59e0b; font-size: 12px; letter-spacing: 2px; }
.hotel-dates { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.hotel-price { text-align: right; }
.hotel-price-night { font-size: 18px; font-weight: 700; color: var(--cyan); }
.hotel-price-total { font-size: 11px; color: var(--text-muted); }

/* ── Hotel search form ── */
.hotel-search-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: end;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}

.btn-search-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, var(--cyan), #0891b2);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.btn-search-sm:hover { opacity: 0.9; }

/* ── Selected flight divider ── */
.selected-flight-badge {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.3);
  border-radius: 8px;
  font-size: 13px;
  color: var(--neon-light);
}
.selected-flight-badge.active { display: flex; }

/* ── Error state ── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  color: var(--danger);
}
.btn-retry {
  background: rgba(239,68,68,0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.btn-retry:hover { background: rgba(239,68,68,0.2); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .main {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
    height: auto;
  }
  .results-panel { height: auto; }
  .hotel-search-bar {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  .btn-search-sm { grid-column: 1 / -1; }
}
```

- [ ] **Step 2: Verificar visualmente**

Abre `Viajes/index.html` en el navegador. El CSS se aplica desde Task 4, pero puedes verificar que no hay errores de sintaxis revisando que el archivo se cargue sin errores 404.

- [ ] **Step 3: Commit**

```bash
git add Viajes/styles.css
git commit -m "feat(viajes): add glassmorphism dark styles"
```

---

## Task 4: index.html — estructura HTML

**Files:**
- Create: `Viajes/index.html`

- [ ] **Step 1: Crear `Viajes/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TravelFinder — Viajes Baratos</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div class="header-logo">
      <i data-lucide="plane"></i>
      TravelFinder
    </div>
    <button class="btn-config" id="btnConfig" onclick="openConfig()">
      <i data-lucide="settings"></i>
      Configurar API
    </button>
  </header>

  <!-- Banner modo demo -->
  <div class="demo-banner" id="demoBanner">
    Modo demo — datos de ejemplo. <a href="#" onclick="openConfig()" style="color:inherit;font-weight:600">Configura tu API key de Amadeus</a> para ver precios reales.
  </div>

  <!-- Layout principal -->
  <div class="main">

    <!-- Sidebar izquierdo: formulario + filtros -->
    <aside class="sidebar">

      <!-- Búsqueda de vuelos -->
      <div class="form-section">
        <div class="form-title">Buscar vuelos</div>

        <div class="radio-group">
          <div class="radio-option">
            <input type="radio" id="typeOneway" name="searchType" value="oneway">
            <label for="typeOneway">Solo ida</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="typeRoundtrip" name="searchType" value="roundtrip" checked>
            <label for="typeRoundtrip">Ida y vuelta</label>
          </div>
        </div>

        <div class="form-group">
          <label for="inputOrigin">Origen (código IATA)</label>
          <input class="form-input" id="inputOrigin" type="text" placeholder="ej. MAD" maxlength="3">
        </div>

        <div class="form-group">
          <label for="inputDestination">Destino (código IATA)</label>
          <input class="form-input" id="inputDestination" type="text" placeholder="ej. BCN" maxlength="3">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="inputDepartDate">Ida</label>
            <input class="form-input" id="inputDepartDate" type="date">
          </div>
          <div class="form-group" id="returnDateGroup">
            <label for="inputReturnDate">Vuelta</label>
            <input class="form-input" id="inputReturnDate" type="date">
          </div>
        </div>

        <div class="form-group">
          <label for="inputPassengers">Pasajeros</label>
          <input class="form-input" id="inputPassengers" type="number" value="1" min="1" max="9">
        </div>

        <button class="btn-search" onclick="handleFlightSearch()">
          <i data-lucide="search"></i>
          Buscar vuelos
        </button>
      </div>

      <!-- Filtros (se muestran tras la primera búsqueda) -->
      <div class="filters-section" id="filtersSection">
        <div class="form-title">Filtros</div>

        <div class="filter-group">
          <label class="form-group" style="flex-direction:row;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text-muted)">Precio máximo</span>
            <span class="range-value" id="maxPriceValue">sin límite</span>
          </label>
          <input class="range-input" id="filterMaxPrice" type="range" min="0" max="1000" step="10" value="1000" oninput="handleFilterChange()">
        </div>

        <div class="filter-group">
          <label class="checkbox-label">
            <input type="checkbox" id="filterDirect" onchange="handleFilterChange()">
            Solo vuelos directos
          </label>
        </div>

        <div class="filter-group" id="airlineFilterGroup" style="display:none">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Aerolíneas</div>
          <div class="airlines-list" id="airlinesList"></div>
        </div>
      </div>

    </aside>

    <!-- Panel derecho: resultados -->
    <main class="results-panel">

      <!-- Sección vuelos -->
      <section class="results-section" id="flightsSection">
        <div class="results-header">
          <div class="results-title">
            <i data-lucide="plane"></i>
            Vuelos
          </div>
          <span class="results-count" id="flightsCount" style="display:none"></span>
        </div>
        <div id="flightsContainer">
          <!-- Estado vacío inicial -->
          <div class="empty-state" id="flightsEmpty">
            <i data-lucide="plane-takeoff" style="width:48px;height:48px"></i>
            <p>Busca tu próximo viaje ✈</p>
            <span>Introduce origen, destino y fechas para ver vuelos disponibles</span>
          </div>
        </div>
      </section>

      <!-- Sección hoteles -->
      <section class="results-section" id="hotelsSection" style="display:none">
        <div class="results-header">
          <div class="results-title">
            <i data-lucide="building-2"></i>
            Hoteles
          </div>
          <span class="results-count" id="hotelsCount" style="display:none"></span>
        </div>

        <!-- Indicador de vuelo seleccionado -->
        <div class="selected-flight-badge" id="selectedFlightBadge">
          <i data-lucide="check-circle" style="width:16px;height:16px"></i>
          <span id="selectedFlightText"></span>
        </div>

        <!-- Barra de búsqueda de hoteles -->
        <div class="hotel-search-bar">
          <div class="form-group">
            <label>Ciudad (IATA)</label>
            <input class="form-input" id="hotelCityInput" type="text" placeholder="ej. BCN" maxlength="3">
          </div>
          <div class="form-group">
            <label>Check-in</label>
            <input class="form-input" id="hotelCheckIn" type="date">
          </div>
          <div class="form-group">
            <label>Check-out</label>
            <input class="form-input" id="hotelCheckOut" type="date">
          </div>
          <button class="btn-search-sm" onclick="handleHotelSearch()">
            <i data-lucide="search"></i>
            Buscar
          </button>
        </div>

        <div id="hotelsContainer"></div>
      </section>

    </main>
  </div>

  <!-- Scripts -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script src="mock.js"></script>
  <script src="amadeus.js"></script>
  <script src="app.js"></script>

</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abre `http://localhost:8000/Viajes/index.html` (o desde `file://`). Debes ver:
- Header con logo y botón "Configurar API"
- Formulario de búsqueda con radio buttons, inputs y botón
- Panel derecho con estado vacío "Busca tu próximo viaje ✈"
- Sin errores en consola (salvo que `app.js` no exista todavía)

- [ ] **Step 3: Commit**

```bash
git add Viajes/index.html
git commit -m "feat(viajes): add HTML structure with two-column layout"
```

---

## Task 5: app.js — estado global, init y configuración de API

**Files:**
- Create: `Viajes/app.js`

- [ ] **Step 1: Crear `Viajes/app.js` con estado global e init**

```js
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
```

- [ ] **Step 2: Verificar en el navegador**

Abre `Viajes/index.html`. En la consola:
```js
console.log(state.mode); // "demo"
console.log(state.searchType); // "roundtrip"
```
Al hacer click en "Solo ida", el campo de vuelta debe desaparecer. Al hacer click en "Configurar API" debe salir `prompt()`.

- [ ] **Step 3: Commit**

```bash
git add Viajes/app.js
git commit -m "feat(viajes): add app state, init and API config flow"
```

---

## Task 6: app.js — búsqueda y renderizado de vuelos

**Files:**
- Modify: `Viajes/app.js` (añadir al final)

- [ ] **Step 1: Añadir al final de `Viajes/app.js` las funciones de búsqueda y renderizado de vuelos**

```js
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
```

- [ ] **Step 2: Verificar en el navegador**

1. Introduce MAD → BCN, fechas y haz click en "Buscar vuelos"
2. Deben aparecer skeleton cards durante ~800ms, luego las cards de vuelos
3. Las cards deben mostrar aerolínea, ruta, horarios, precio
4. Al hacer click en una card debe quedar resaltada y aparecer la sección de hoteles con la ciudad y fechas pre-rellenadas

- [ ] **Step 3: Commit**

```bash
git add Viajes/app.js
git commit -m "feat(viajes): add flight search, filters and rendering"
```

---

## Task 7: app.js — búsqueda y renderizado de hoteles

**Files:**
- Modify: `Viajes/app.js` (añadir al final)

- [ ] **Step 1: Añadir al final de `Viajes/app.js` las funciones de hoteles**

```js
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
```

- [ ] **Step 2: Verificar en el navegador**

1. Selecciona un vuelo MAD → BCN
2. Comprueba que la sección de hoteles aparece con ciudad BCN y fechas pre-rellenadas
3. Haz click en "Buscar" en la barra de hoteles
4. Deben aparecer skeletons y luego cards de hoteles ordenadas por precio, con nombre, estrellas, fechas y precio/noche

- [ ] **Step 3: Verificar búsqueda independiente de hoteles**

Sin haber seleccionado vuelo, ve a la sección de hoteles, escribe "MAD" como ciudad y busca. Deben aparecer hoteles de Madrid.

- [ ] **Step 4: Commit**

```bash
git add Viajes/app.js
git commit -m "feat(viajes): add hotel search and rendering"
```

---

## Task 8: mock.js — ajuste de aliases para evitar sobreescritura

**Files:**
- Modify: `Viajes/mock.js`

> **Contexto:** `index.html` carga primero `mock.js` y luego `amadeus.js`. Ambos archivos declaran `searchFlights` y `searchHotels` como funciones globales. En modo demo, `app.js` necesita usar las de mock, no las de amadeus. La solución es que mock.js guarde sus funciones con nombres distintos que `app.js` pueda referenciar.

- [ ] **Step 1: Añadir aliases al final de `Viajes/mock.js`**

Al final del archivo `Viajes/mock.js`, después de las definiciones de `searchFlights` y `searchHotels`, añade:

```js
// Aliases para que app.js pueda referenciarlas en modo demo
// (amadeus.js sobreescribe searchFlights/searchHotels en el scope global)
const mockSearchFlights = searchFlights;
const mockSearchHotels = searchHotels;
```

- [ ] **Step 2: Verificar en el navegador — modo demo**

Abre `Viajes/index.html` sin credenciales Amadeus. En la consola:
```js
console.log(state.mode); // "demo"
console.log(typeof mockSearchFlights); // "function"
```
Busca MAD → BCN. Los resultados deben llegar (mock data), sin error de token.

- [ ] **Step 3: Commit**

```bash
git add Viajes/mock.js
git commit -m "fix(viajes): expose mock aliases to avoid amadeus.js override"
```

---

## Task 9: verificación final e integración

**Files:** ninguno nuevo

- [ ] **Step 1: Flujo completo modo demo**

1. Abre `http://localhost:8000/Viajes/index.html` (sirve con `python -m http.server 8000` desde la raíz del proyecto)
2. Verifica que el banner "Modo demo" aparece
3. Escribe MAD en Origen, BCN en Destino, selecciona "Ida y vuelta", fechas en el futuro
4. Click "Buscar vuelos" → skeletons → cards de vuelos ordenadas por precio
5. Activa filtro "Solo vuelos directos" → se eliminan los vuelos con escalas
6. Mueve el slider de precio → se filtran los resultados en tiempo real
7. Click en una card de vuelo → queda resaltada, aparece sección hoteles con BCN pre-rellenado
8. Click "Buscar" en hoteles → skeletons → cards de hoteles ordenadas por precio/noche
9. Modifica la ciudad en hoteles a "SVQ" y busca → hoteles de Sevilla

- [ ] **Step 2: Responsive**

Reduce la ventana del navegador a < 768px. Verifica que el formulario se apila sobre los resultados.

- [ ] **Step 3: Flujo "solo ida"**

Selecciona "Solo ida". Verifica que el campo de fecha de vuelta desaparece.

- [ ] **Step 4: Flujo configurar API**

Click en "Configurar API" → introduce cualquier texto en ambos prompts. Verifica que el banner "Modo demo" desaparece y `state.mode` es `'live'` en consola.

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat(viajes): complete travel search app with flights and hotels"
```

---

## Resumen de commits esperados

1. `feat(viajes): add mock data for flights and hotels`
2. `feat(viajes): add Amadeus API client with token caching`
3. `feat(viajes): add glassmorphism dark styles`
4. `feat(viajes): add HTML structure with two-column layout`
5. `feat(viajes): add app state, init and API config flow`
6. `feat(viajes): add flight search, filters and rendering`
7. `feat(viajes): add hotel search and rendering`
8. `fix(viajes): expose mock aliases to avoid amadeus.js override`
9. `feat(viajes): complete travel search app with flights and hotels`
