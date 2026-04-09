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
