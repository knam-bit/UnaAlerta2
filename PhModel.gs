/**
 * @file PhModel.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags ph, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function PhModel() {
  const PARANOA_PH_MIN = 6.0;
  const PARANOA_PH_MAX = 9.0; // Conama Resolution 357/2005

  return {
    /**
     * Avalia se o pH está dentro dos padrões de balneabilidade.
     * @param {number} phValue - Valor medido.
     * @return {string} Status da qualidade.
     */
    evaluateQuality: function(phValue) {
      if (!phValue) return 'INVALID_READING';
      if (phValue < PARANOA_PH_MIN || phValue > PARANOA_PH_MAX) {
        console.warn(`Alerta: pH ${phValue} fora dos limites limnológicos.`);
        return 'CRITICAL';
      }
      return 'NORMAL';
    },

    /**
     * Persiste leitura no histórico (Simulado).
     */
    logReading: function(timestamp, location, value) {
      // Implementação de SpreadsheetApp.openById(...).appendRow(...) seria aqui
      console.log(`[PhModel] Registrado: ${timestamp} | ${location} | pH: ${value}`);
      return true;
    }
  };
}