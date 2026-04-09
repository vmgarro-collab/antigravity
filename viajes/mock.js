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

// Aliases para que app.js pueda referenciarlas en modo demo
// (amadeus.js sobreescribe searchFlights/searchHotels en el scope global)
const mockSearchFlights = searchFlights;
const mockSearchHotels = searchHotels;
