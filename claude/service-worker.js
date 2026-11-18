/*
 * Service Worker — Guide Motobécane 50 VLC (hors ligne)
 *
 * Stratégie volontairement simple, adaptée à un site statique sans build :
 *  - Le "shell" (HTML/CSS/JS/icônes) est mis en cache à l'installation.
 *  - Les pages (navigation) : réseau en priorité, cache en secours si hors ligne.
 *  - Les fichiers statiques du site : cache en priorité (réponse immédiate),
 *    avec une mise à jour en arrière-plan (stale-while-revalidate).
 *  - Tout le reste (polices Google Fonts, etc.) : laissé au réseau normal,
 *    sans bloquer l'installation si une ressource externe est inaccessible.
 *
 * Incrémenter CACHE_VERSION à chaque changement notable de index.html/app.js/
 * styles.css pour forcer la mise à jour du cache chez les utilisateurs.
 */

const CACHE_VERSION = 'v13';
const CACHE_NAME = `mob50vlc-shell-${CACHE_VERSION}`;

const SHELL_FILES = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll échouerait entièrement si UNE seule ressource est injoignable :
      // on ajoute donc chaque fichier individuellement et on ignore les échecs
      // (ex. pas de réseau pendant l'installation pour une ressource secondaire).
      return Promise.all(
        SHELL_FILES.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pré-cache échoué pour', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('mob50vlc-shell-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Permet à la page de demander l'activation immédiate d'une nouvelle version
// (voir le bandeau "nouvelle version" dans app.js).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation (ouverture/rechargement d'une page) : réseau d'abord,
  // cache du shell en secours si hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Fichiers du site (CSS/JS/icônes/manifest) : cache d'abord pour la rapidité
  // et le hors-ligne, avec rafraîchissement silencieux en arrière-plan.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached); // hors ligne et pas déjà en cache : rien à faire de plus
        return cached || networkFetch;
      })
    );
    return;
  }

  // Ressources externes (polices Google Fonts, etc.) : comportement réseau normal.
});
