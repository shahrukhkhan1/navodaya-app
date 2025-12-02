const CACHE_NAME = 'navodaya-mitra-cache-v1';
// Only cache the core app shell files. Other assets will be cached on demand by the fetch handler.
// Paths updated to be relative (removed leading slash) to support hosting in subdirectories.
const urlsToCache = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For API calls to Gemini, always go to the network.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          // Return the cached response if found.
          if (response) {
            return response;
          }

          // If not in cache, fetch from the network.
          return fetch(event.request).then(networkResponse => {
            // Cache the new response for future use.
            // We clone it because a response is a stream and can be consumed only once.
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
    })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});