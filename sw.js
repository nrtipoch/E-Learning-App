const CACHE_NAME = 'e-learning-v1.0.0';
const STATIC_CACHE_NAME = 'e-learning-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'e-learning-dynamic-v1.0.0';

// ไฟล์ที่ต้องการ cache ไว้ใช้ offline
const STATIC_FILES = [
  '/E-Learning-App/',
  '/E-Learning-App/index.html',
  '/E-Learning-App/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.5.0/axios.min.js',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap'
];

// Install Event - Cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Fetch from network and cache dynamic content
        return fetch(event.request)
          .then(networkResponse => {
            // Check if response is valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Cache successful responses
            const responseToCache = networkResponse.clone();
            
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(error => {
            console.log('Service Worker: Network fetch failed', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/E-Learning-App/index.html');
            }
            
            // Return placeholder for images
            if (event.request.destination === 'image') {
              return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">ไม่มีรูป</text></svg>', {
                headers: { 'Content-Type': 'image/svg+xml' }
              });
            }
          });
      })
  );
});

// Background Sync Event (สำหรับ sync ข้อมูลเมื่อกลับมา online)
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-assessment-data') {
    event.waitUntil(
      syncAssessmentData()
    );
  }
});

// Push Event (สำหรับ push notifications)
self.addEventListener('push', event => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'มีการอัปเดตใหม่!',
    icon: '/E-Learning-App/assets/icon-192x192.png',
    badge: '/E-Learning-App/assets/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/E-Learning-App/'
    },
    actions: [
      {
        action: 'open',
        title: 'เปิดแอป',
        icon: '/E-Learning-App/assets/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'ปิด'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('E-Learning Platform', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/E-Learning-App/')
    );
  }
});

// Helper function for syncing data
async function syncAssessmentData() {
  try {
    // ส่งข้อมูลที่ pending ไปยัง server
    console.log('Service Worker: Syncing assessment data...');
    // Implementation สำหรับ sync ข้อมูล
  } catch (error) {
    console.error('Service Worker: Error syncing data', error);
  }
}

// Message Event (สำหรับการสื่อสารกับ main thread)
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
