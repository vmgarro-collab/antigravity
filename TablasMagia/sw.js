const CACHE = 'tablas-magia-v2'

// app.js siempre desde red — los demás assets desde caché con fallback
const NETWORK_FIRST = ['app.js']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './index.html',
      './styles.css',
      './manifest.json',
      './icon.svg',
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
    ])).then(() => self.skipWaiting())
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
  const isNetworkFirst = NETWORK_FIRST.some(f => url.pathname.endsWith(f))

  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    )
  }
})
