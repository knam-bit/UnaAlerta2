/**
 * @file IndexedDbModel.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags indexed_db, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Definição de schemas para o banco de dados local (IndexedDB).
 * Sincroniza a estrutura de dados esperada pelo Client-side PWA.
 */
function IndexedDbModel() {
  console.log('Running logic for IndexedDbModel...');

  return {
    getDbSchema: function() {
      // Retorna configuração para ser enviada ao front-end na inicialização
      return {
        dbName: 'MonitorParanoaDB',
        version: 1,
        stores: [
          {
            name: 'denuncias',
            keyPath: 'id',
            autoIncrement: true,
            indexes: ['status', 'timestamp']
          },
          {
            name: 'leituras_sensor',
            keyPath: 'timestamp',
            indexes: ['tipo', 'sincronizado']
          },
          {
            name: 'offline_queue',
            keyPath: 'uuid',
            indexes: ['retryCount']
          }
        ]
      };
    }
  };
}