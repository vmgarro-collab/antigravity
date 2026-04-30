const CACHE = 'tablas-magia-v3'

// HTML y JS siempre desde red — CSS y assets desde caché (offline fallback)
const CACHE_ONLY = ['styles.css', 'manifest.json', 'icon.svg']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CACHE_ONLY)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  const isCacheFirst = CACHE_ONLY.some(f => url.pathname.endsWith(f))

  if (isCacheFirst) {
    // CSS y assets estáticos: caché primero, red como fallback
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    )
  } else {
    // HTML, JS y fuentes: red primero, caché como fallback offline
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
  }
})
