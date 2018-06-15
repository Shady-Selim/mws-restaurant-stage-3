const cacheName = 'retaurant-cach-v0';
self.addEventListener('install', e=> {
    e.waitUntil(
      caches.open(cacheName).then( cache=> {
        return cache.addAll([
          '/',
          '/index.html',
          '/restaurant.html',
          '/css/styles.css',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/js/dbhelper.js',
          'http://localhost:1337/restaurants',
          '/img/1.jpg',
          '/img/2.jpg',
          '/img/3.jpg',
          '/img/4.jpg',
          '/img/5.jpg',
          '/img/6.jpg',
          '/img/7.jpg',
          '/img/8.jpg',
          '/img/9.jpg',
          '/img/10.jpg'
        ]);
      })
    );
});

self.addEventListener('activate',  event => {
    event.waitUntil(
        caches.keys().then(keyList=> {
            return Promise.all(keyList.map(key=> {
                if (key !== cacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key); 
                }
            }));
        })
    );
});  

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request, {ignoreSearch:true}).then(response => {
            return response || fetch(event.request);
        })
        .catch(err => console.log(err, event.request))
    );
});