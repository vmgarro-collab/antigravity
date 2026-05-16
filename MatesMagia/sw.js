const CACHE = 'mates-magia-v1'
const NETWORK_FIRST = ['index.html', 'app.js', 'generators.js']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      'index.html',
      'app.js',
      'generators.js',
      'styles.css',
      'manifest.json',
      'icon.svg'
    ]))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  const filename = url.pathname.split('/').pop().split('?')[0]

  if (NETWORK_FIRST.some(f => filename === f || filename === '')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return r
      }).catch(() => caches.match(e.request))
    )
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    )
  }
})
