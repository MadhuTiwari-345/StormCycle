const CACHE_NAME = 'storm-v2';

self.addEventListener('install', (event) => {
  // Activate the updated worker immediately so old cached app shells are replaced.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch navigations from the network. Caching index.html can leave users
  // with old Vite asset hashes after a deployment, producing a blank page (404s).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});
