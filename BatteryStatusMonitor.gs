/**
 * @file BatteryStatusMonitor.gs
 * @project Monitoramento Lago Paranoá
 * @category mobile
 * @tags battery_status, mobile, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Monitora estado da bateria de dispositivos em campo.
 * Permite ajustar estratégia de sync (BackgroundSync) para economizar energia.
 */
function BatteryStatusMonitor() {
  console.log('Running logic for BatteryStatusMonitor...');

  return {
    /**
     * Avalia se deve permitir sincronização pesada baseada na bateria.
     * @param {number} level Nível da bateria (0.0 a 1.0)
     * @param {boolean} charging Está carregando?
     */
    shouldSync: function(level, charging) {
      // Se estiver carregando, sempre sincroniza
      if (charging) return true;
      
      // Se bateria < 20%, adia tarefas pesadas de upload (imagens)
      if (level < 0.2) {
        console.warn("Bateria crítica. Sync adiado.");
        return false;
      }
      
      return true;
    },

    logStatus: function(deviceId, status) {
      // Armazena telemetria de uso do app em campo
      console.log(`Device ${deviceId}: ${Math.round(status.level * 100)}%`);
    }
  };
}