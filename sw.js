/* =========================================================================
   DỰ BÁO XSMN - SERVICE WORKER V2.1

   Mục tiêu:
   - Không để app.js / index.html bị kẹt cache cũ
   - Ưu tiên lấy phiên bản mới từ GitHub Pages
   - Vẫn hỗ trợ offline bằng cache
   - Tự động xoá cache phiên bản cũ
   ========================================================================= */

const CACHE_NAME = 'xsmn-stats-v2.1-20260808';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './data/xsmn_seed.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];


/* =========================================================================
   INSTALL
   ========================================================================= */

self.addEventListener('install', (event) => {

  console.log('[SW V2.1] Installing...');

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then((cache) => {

        console.log('[SW V2.1] Caching app shell');

        return cache.addAll(APP_SHELL);

      })
      .catch((error) => {

        console.warn(
          '[SW V2.1] App shell cache error:',
          error
        );

      })

  );

  /*
   * Không chờ Service Worker cũ kết thúc.
   */

  self.skipWaiting();

});


/* =========================================================================
   ACTIVATE
   ========================================================================= */

self.addEventListener('activate', (event) => {

  console.log('[SW V2.1] Activating...');

  event.waitUntil(

    caches
      .keys()
      .then((keys) => {

        return Promise.all(

          keys.map((key) => {

            if (key !== CACHE_NAME) {

              console.log(
                '[SW V2.1] Delete old cache:',
                key
              );

              return caches.delete(key);

            }

            return Promise.resolve();

          })

        );

      })
      .then(() => {

        /*
         * Service Worker mới kiểm soát
         * các tab đang mở ngay lập tức.
         */

        return self.clients.claim();

      })

  );

});


/* =========================================================================
   FETCH
   ========================================================================= */

self.addEventListener('fetch', (event) => {

  const request = event.request;

  const url = new URL(request.url);


  /*
   * Chỉ xử lý GET.
   */

  if (request.method !== 'GET') {
    return;
  }


  /*
   * Không cache request ngoài domain GitHub Pages.
   */

  if (url.origin !== self.location.origin) {
    return;
  }


  /*
   * HTML + JavaScript + CSS
   *
   * NETWORK FIRST.
   *
   * Đây là phần quan trọng nhất:
   * luôn thử lấy code mới từ GitHub trước.
   */

  const isCriticalFile =

    request.mode === 'navigate' ||

    url.pathname.endsWith('/index.html') ||

    url.pathname.endsWith('/app.js') ||

    url.pathname.endsWith('/style.css');


  if (isCriticalFile) {

    event.respondWith(

      fetch(
        request,
        {
          cache: 'no-store'
        }
      )
        .then((networkResponse) => {

          if (
            networkResponse &&
            networkResponse.ok
          ) {

            const clone =
              networkResponse.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {

                cache.put(
                  request,
                  clone
                );

              });

          }

          return networkResponse;

        })
        .catch(async () => {

          /*
           * Nếu mất mạng mới dùng cache.
           */

          const cached =
            await caches.match(request);

          if (cached) {
            return cached;
          }

          /*
           * Navigation fallback.
           */

          if (
            request.mode === 'navigate'
          ) {

            return caches.match(
              './index.html'
            );

          }

          throw new Error(
            'Network unavailable and no cache found.'
          );

        })

    );

    return;

  }


  /*
   * DATA JSON / SEED
   *
   * NETWORK FIRST
   *
   * để dữ liệu xổ số mới không bị cache cũ.
   */

  if (
    url.pathname.includes('/data/')
  ) {

    event.respondWith(

      fetch(
        request,
        {
          cache: 'no-store'
        }
      )
        .then((networkResponse) => {

          if (
            networkResponse &&
            networkResponse.ok
          ) {

            const clone =
              networkResponse.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {

                cache.put(
                  request,
                  clone
                );

              });

          }

          return networkResponse;

        })
        .catch(() => {

          return caches.match(
            request
          );

        })

    );

    return;

  }


  /*
   * ICON / MANIFEST / FILE TĨNH
   *
   * CACHE FIRST
   *
   * Các file này ít thay đổi,
   * ưu tiên cache để app tải nhanh.
   */

  event.respondWith(

    caches
      .match(request)
      .then((cached) => {

        if (cached) {
          return cached;
        }


        return fetch(request)
          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.ok
            ) {

              const clone =
                networkResponse.clone();

              caches
                .open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    request,
                    clone
                  );

                });

            }

            return networkResponse;

          });

      })

  );

});


/* =========================================================================
   MESSAGE - FORCE UPDATE
   ========================================================================= */

self.addEventListener('message', (event) => {

  if (
    event.data &&
    event.data.type === 'SKIP_WAITING'
  ) {

    self.skipWaiting();

  }

});


console.log(
  '[SW V2.1] Service Worker loaded'
);
