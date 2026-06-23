/**
 * 法考通 · Service Worker
 * 
 * 策略：
 * - HTML/JS/CSS: Cache First, Network Fallback（核心应用离线可用）
 * - JSON 数据: Stale-While-Revalidate（本地快速响应，后台更新）
 * - 字体/图片: Cache First（长期缓存）
 */

const CACHE_NAME = 'fakao-v3.1';
const DATA_CACHE = 'fakao-data-v3.1';

// 核心资源（安装时预缓存）
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/tokens.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/state.js',
  './js/utils/dom.js',
  './js/utils/helpers.js',
  './js/utils/sm2.js',
  './js/utils/charts.js',
  './js/utils/keyboard.js',
  './js/pages/dashboard.js',
  './js/pages/practice.js',
  './js/pages/flashcards.js',
  './js/pages/mistakes.js',
  './js/pages/knowledge.js',
  './js/pages/laws.js',
  './js/pages/settings.js',
  './data/subjects.json',
];

// 数据文件（按需缓存）
const DATA_URLS_PATTERN = /\/data\//;

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core resources');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) return;

  // 数据文件：Stale-While-Revalidate
  if (DATA_URLS_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 核心资源：Cache First
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

/**
 * Cache First 策略
 * 优先从缓存返回，缓存没有则网络请求并缓存
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 离线且无缓存，返回离线页面
    return new Response('离线模式 - 请连接网络后刷新', {
      status: 503,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
  }
}

/**
 * Stale-While-Revalidate 策略
 * 立即返回缓存（快），同时后台更新缓存
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 后台更新
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // 优先返回缓存
  return cached || (await fetchPromise) || new Response('[]', {
    headers: { 'Content-Type': 'application/json' },
  });
}
