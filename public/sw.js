// This is the service worker for the Badminton Score PWA
const CACHE_NAME = 'badminton-score-cache-v1';
const urlsToCache = [
  '/',
  '/badmintonScore',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/next.svg',
  '/amplify.svg'
];

// Debug log for service worker events
const logEvent = (message) => {
  console.log(`[Service Worker] ${message}`);
};

// Install event - cache files
self.addEventListener('install', (event) => {
  logEvent('Installing...');
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        logEvent('Cache opened, adding URLs to cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        logEvent('Installation completed');
      })
      .catch(error => {
        logEvent(`Installation error: ${error}`);
      })
  );
  
  // Force this service worker to become active right away
  self.skipWaiting();
  logEvent('skipWaiting called');
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Only deal with HTTP/HTTPS requests, ignore others like chrome-extension://
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  logEvent(`Fetch request for: ${event.request.url}`);
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          logEvent(`Serving from cache: ${event.request.url}`);
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        logEvent(`Fetching from network: ${event.request.url}`);
        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            // Only cache same-origin requests to avoid issues
            const url = new URL(event.request.url);
            const isSameOrigin = url.origin === self.location.origin;

            if (isSameOrigin) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  logEvent(`Caching response for: ${event.request.url}`);
                  cache.put(event.request, responseToCache);
                })
                .catch(error => {
                  logEvent(`Error caching response: ${error}`);
                });
            }

            return response;
          }
        ).catch(error => {
          logEvent(`Fetch error: ${error}`);
          // You could return a fallback page here if appropriate
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  logEvent('Activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            logEvent(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      logEvent('Activation complete, claiming clients');
      // Take control of all clients as soon as it activates
      return self.clients.claim();
    })
    .catch(error => {
      logEvent(`Activation error: ${error}`);
    })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  logEvent(`Message received: ${event.data}`);
  
  if (event.data === 'SKIP_WAITING') {
    logEvent('SKIP_WAITING message received');
    self.skipWaiting();
  }
});

logEvent('Service worker loaded');