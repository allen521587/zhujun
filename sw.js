const CACHE_NAME = ‘jp-driver-test-v2’;
const urlsToCache = [
‘/’,
‘/index.html’,
‘/styles.css’,
‘/app.js’,
‘/questions.js’,
‘/manifest.json’
];

// 安装 Service Worker
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => {
console.log(‘Opened cache’);
return cache.addAll(urlsToCache);
})
);
self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(cacheNames => {
return Promise.all(
cacheNames.map(cacheName => {
if (cacheName !== CACHE_NAME) {
console.log(‘Deleting old cache:’, cacheName);
return caches.delete(cacheName);
}
})
);
})
);
self.clients.claim();
});

// 拦截请求
self.addEventListener(‘fetch’, event => {
event.respondWith(
caches.match(event.request)
.then(response => {
// 缓存命中 - 返回响应
if (response) {
return response;
}

```
    // 克隆请求
    const fetchRequest = event.request.clone();
    
    return fetch(fetchRequest).then(response => {
      // 检查是否是有效响应
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      
      // 克隆响应
      const responseToCache = response.clone();
      
      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
        });
      
      return response;
    });
  })
```

);
});