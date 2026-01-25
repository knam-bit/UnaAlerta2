/**
 * @file StorageHandler.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags storage, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Controlador de persistência de dados no back-end (Spreadsheet/Drive).
 * Recebe dados do SyncView/Offline Manager.
 */
function StorageHandler() {
  console.log('Running logic for StorageHandler...');

  return {
    /**
     * Salva dados de formulários ou sensores.
     * @param {string} table Nome da "tabela" (aba da planilha ou arquivo JSON)
     * @param {Object} data Objeto de dados
     */
    save: function(table, data) {
      const timestamp = new Date();
      console.log(`Persistindo em [${table}]:`, JSON.stringify(data));
      
      // Simula validação de integridade para dados de 'Saneamento'
      if (table === 'saneamento' && !data.location) {
        throw new Error("Dados de saneamento exigem geolocalização (Seção 3.2).");
      }

      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        // Maps generic names to specific sheets if necessary
        const sheetName = table === 'monitoramento' ? "Monitoramento_Ambiental" : table;
        const sheet = ss.getSheetByName(sheetName);
        
        if (!sheet) throw new Error(`Tabela/Aba '${sheetName}' não encontrada.`);

        // Detects if data is Array (direct row) or Object (needs mapping upstream or basic values)
        const rowData = Array.isArray(data) ? data : Object.values(data);
        
        sheet.appendRow(rowData);
        
        return { success: true, timestamp: timestamp, id: Utilities.getUuid() };
      } catch (e) {
        console.error("Storage Error:", e);
        throw e;
      }
    },

    /**
     * Recupera histórico para visualização offline.
     */
    fetchHistory: function(table) {
      // Retorna dados cacheados ou do banco
      return [
        { date: '2023-10-01', value: 10, metric: 'Turbidez' },
        { date: '2023-10-02', value: 12, metric: 'Turbidez' }
      ];
    }
  };
}