/**
 * @file ViewportController.gs
 * @project Monitoramento Lago Paranoá
 * @category mobile
 * @tags viewport, mobile, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Controlador de meta-informações de Viewport e UI Responsiva.
 * Fornece configurações para o renderizador de templates HTML.
 */
function ViewportController() {
  console.log('Running logic for ViewportController...');

  return {
    /**
     * Retorna configurações de viewport para injetar no <head>.
     * Garante escala correta em dispositivos móveis (Mobile-First).
     */
    getMetaConfig: function() {
      return {
        // Updated for modern devices (Notch/Dynamic Island support)
        viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
        themeColor: "#006064",
        mobileWebAppCapable: "yes",
        appleMobileWebAppStatusBarStyle: "black-translucent"
      };
    },
    
    /**
     * Determina se deve servir versão 'Lite' baseada no User-Agent (detectado no client/doGet).
     */
    isMobileClient: function(userAgent) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    }
  };
}