# Viajes — Spec de diseño
**Fecha:** 2026-04-09

## Resumen

App de búsqueda de viajes baratos (vuelos + hoteles) integrada en el proyecto AntiGravity como módulo independiente en `Viajes/`. Vanilla JS, sin build system, CDN-loaded, compatible con `file://`. UI glassmorphism oscuro, misma paleta neon que el resto del proyecto. Totalmente en español.

---

## Arquitectura

### Archivos

```
Viajes/
├── index.html      — estructura HTML, imports CDN
├── styles.css      — glassmorphism oscuro, paleta neon, responsive
├── app.js          — lógica principal, estado global, renderizado UI
├── amadeus.js      — cliente Amadeus: auth (token Bearer), searchFlights(), searchHotels()
└── mock.js         — mismas funciones que amadeus.js con datos estáticos realistas
```

### Modo de operación

Al iniciar, `app.js` lee `localStorage.amadeus_api_key` y `localStorage.amadeus_api_secret`:
- Si existen → `mode = 'live'`, importa funciones de `amadeus.js`
- Si no existen → `mode = 'demo'`, importa funciones de `mock.js`, muestra banner "Modo demo — configura tu API key de Amadeus para ver precios reales"

Las credenciales se ingresan via `prompt()` nativo y se guardan en `localStorage`, igual que el API key de Groq en Recorder.

---

## Layout UI

### Estructura de dos columnas

```
┌─────────────────────────────────────────────────────┐
│  ✈ TravelFinder                [⚙ Configurar API]   │  ← header
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  FORMULARIO  │  RESULTADOS                          │
│  + FILTROS   │  (vuelos arriba, hoteles abajo)      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Responsive:** en pantallas < 768px las columnas se apilan (formulario arriba, resultados abajo).

### Panel izquierdo — Formulario

- Selector tipo: **Ida** / **Ida y vuelta** (radio buttons)
- Inputs: Origen, Destino (código IATA o ciudad), Fecha ida, Fecha vuelta (oculta en modo "Ida"), Nº pasajeros
- Botón "🔍 Buscar vuelos"
- Sección **Filtros** (aparece tras primera búsqueda):
  - Precio máximo (slider)
  - Solo vuelos directos (checkbox)
  - Filtro por aerolínea (checkboxes dinámicos según resultados)

### Panel derecho — Resultados

**Sección vuelos:**
- Estado vacío: mensaje "Busca tu próximo viaje ✈"
- Estado cargando: skeleton cards con animación pulse
- Estado error: mensaje en español + botón "Reintentar"
- Estado sin resultados: "No encontramos vuelos. Prueba con otras fechas."
- Resultados: cards ordenadas por precio, mostrando aerolínea, número de vuelo, hora salida/llegada, duración, nº escalas, clase, equipaje incluido, precio total. Click en card → selecciona el vuelo.

**Sección hoteles** (aparece tras seleccionar un vuelo):
- Header: "Hoteles en [ciudad destino]" con fechas pre-rellenadas desde el vuelo seleccionado
- El usuario puede ajustar ciudad, fechas y nº adultos independientemente
- Botón "🔍 Buscar hoteles"
- Cards: nombre, categoría (estrellas), check-in/check-out, precio por noche
- La búsqueda de hoteles también funciona de forma independiente sin haber seleccionado vuelo

---

## Estado global (`app.js`)

```js
{
  mode: 'demo' | 'live',
  searchType: 'oneway' | 'roundtrip',
  flightQuery: {
    origin,       // string — código IATA ej. "MAD"
    destination,  // string — código IATA ej. "BCN"
    departDate,   // string ISO — "2026-05-15"
    returnDate,   // string ISO — null si oneway
    passengers    // number — default 1
  },
  hotelQuery: {
    cityCode,   // string — código ciudad IATA
    checkIn,    // string ISO
    checkOut,   // string ISO
    adults      // number
  },
  flightResults: [],      // array de FlightOffer normalizados
  hotelResults: [],       // array de HotelOffer normalizados
  selectedFlight: null,   // FlightOffer | null
  filters: {
    maxPrice: null,       // number | null
    directOnly: false,
    airlines: []          // array de strings — vacío = todos
  },
  loading: { flights: false, hotels: false },
  error: { flights: null, hotels: null }
}
```

---

## Formato de datos normalizado

### FlightOffer
```js
{
  id,              // string
  airline,         // string — nombre completo ej. "Iberia"
  flightNumber,    // string — ej. "IB3456"
  origin,          // string — código IATA
  destination,     // string — código IATA
  departTime,      // string ISO datetime
  arriveTime,      // string ISO datetime
  duration,        // string — ej. "1h 15m"
  stops,           // number — 0 = directo
  price,           // number
  currency,        // string — ej. "EUR"
  cabin,           // string — "ECONOMY" | "BUSINESS" | "FIRST"
  baggageIncluded  // boolean
}
```

### HotelOffer
```js
{
  id,           // string
  name,         // string
  stars,        // number — 1-5
  cityCode,     // string — código IATA ciudad
  checkIn,      // string ISO date
  checkOut,     // string ISO date
  pricePerNight,// number
  currency,     // string
  totalPrice    // number — pricePerNight * noches
}
```

---

## `amadeus.js` — Cliente API

### Autenticación
```js
// POST https://test.api.amadeus.com/v1/security/oauth2/token
// body: grant_type=client_credentials&client_id=KEY&client_secret=SECRET
// Cachea token en memoria, renueva automáticamente al expirar (expires_in segundos)
```

### Funciones públicas
```js
async function searchFlights(flightQuery) → FlightOffer[]
// GET /v2/shopping/flight-offers
// Params: originLocationCode, destinationLocationCode, departureDate, returnDate?,
//         adults, nonStop?, currencyCode='EUR', max=20

async function searchHotels(hotelQuery) → HotelOffer[]
// GET /v1/reference-data/locations/hotels/by-city + GET /v3/shopping/hotel-offers
// Params: cityCode, checkInDate, checkOutDate, adults
```

Ambas funciones traducen la respuesta cruda de Amadeus al formato normalizado antes de retornar.

---

## `mock.js` — Datos de ejemplo

Implementa las mismas dos funciones (`searchFlights`, `searchHotels`) con datos estáticos que cubren al menos:
- 5-8 vuelos entre rutas españolas comunes (MAD↔BCN, MAD↔PMI, MAD↔SVQ, BCN↔LIS)
- 4-6 hoteles en cada ciudad destino de esas rutas
- Variedad de aerolíneas (Iberia, Vueling, Ryanair, Air Europa), precios y duraciones
- Simula latencia con `setTimeout` de 800ms para que la UI de carga sea visible

---

## Convenciones heredadas del proyecto

- Todo el texto de UI en **español**
- No hay modal library — divs ocultos con `style="display:none/block"`
- Scripts al final del `<body>`, sin `defer`/`async`
- `localStorage` puede estar bloqueado en `file://` — las credenciales caen a variable en memoria si falla
- Iconos Lucide — llamar `lucide.createIcons()` tras cualquier mutación del DOM que añada `data-lucide`
- `backdrop-filter: blur()`, fondo `#0a0a0f`, paleta neon

---

## Fuera de alcance

- Pago / reserva real
- Comparación entre múltiples destinos
- Alertas de precio
- Historial de búsquedas
