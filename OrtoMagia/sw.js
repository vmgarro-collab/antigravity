const CACHE_NAME = 'ortomagia-v2'
const PRECACHE = [
  './',
  'index.html',
  'app.js',
  'generators.js',
  'feedback.js',
  'styles.css',
  'manifest.json',
  'icon.svg',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // banco.json: network-first so edits llegan siempre que haya conexión
  if (url.pathname.endsWith('banco.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Todo lo demás: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
