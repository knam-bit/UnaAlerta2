/**
 * @file ManifestManager.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags manifest, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Gera dinamicamente o manifesto PWA (Progressive Web App).
 * Define padrões de display "standalone" para experiência nativa mobile.
 */
function ManifestManager() {
  console.log('Running logic for ManifestManager...');

  return {
    getManifest: function() {
      return {
        short_name: "MonitorParanoá",
        name: "Monitoramento Lago Paranoá - Civil & Científico",
        description: "Aplicação para monitoramento de indicadores limnológicos e governança hídrica do DF.",
        start_url: "?source=pwa",
        display: "standalone",
        background_color: "#E0F7FA", // Azul claro (água)
        theme_color: "#006064", // Cíano escuro
        icons: [
          {
            src: "https://www.gstatic.com/images/icons/material/system/2x/water_black_48dp.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://www.gstatic.com/images/icons/material/system/2x/water_black_48dp.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        categories: ["education", "productivity", "utilities"]
      };
    }
  };
}