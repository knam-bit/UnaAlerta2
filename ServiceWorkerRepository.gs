/**
 * @file ServiceWorkerRepository.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags service_worker, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function ServiceWorkerRepository() {
  const CACHE_NAME = 'lago-paranoa-v1';
  
  return {
    getManifest: function() {
      return {
        name: "Monitoramento Lago Paranoá",
        short_name: "LagoApp",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#005b96"
      };
    },

    getSwScript: function() {
      // Retorna o script do Service Worker para ser servido via HtmlService
      return `
        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open('${CACHE_NAME}').then((cache) => {
              return cache.addAll(['/', '/index.html', '/offline.html']);
            })
          );
        });
        
        self.addEventListener('fetch', (event) => {
          event.respondWith(
            caches.match(event.request).then((response) => {
              return response || fetch(event.request);
            })
          );
        });
      `;
    }
  };
}