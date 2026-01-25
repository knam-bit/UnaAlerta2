/**
 * @file QueueUtils.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags queue, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Utilitários para gerenciamento de fila de sincronização (Offline-First).
 * Garante que dados coletados em campo (sem rede) sejam processados sequencialmente.
 */
function QueueUtils() {
  console.log('Running logic for QueueUtils...');

  const CACHE = CacheService.getScriptCache();
  const QUEUE_KEY = 'OFFLINE_SYNC_QUEUE';
  const LOCK = LockService.getScriptLock();

  return {
    /**
     * Adiciona item à fila de processamento.
     * @param {Object} payload Dados da ação (ex: nova denúncia, leitura de sensor)
     */
    enqueue: function(payload) {
      try {
        LOCK.waitLock(30000); // Evita condições de corrida
        
        let queue = JSON.parse(CACHE.get(QUEUE_KEY) || '[]');
        payload.enqueuedAt = new Date().toISOString();
        queue.push(payload);
        
        CACHE.put(QUEUE_KEY, JSON.stringify(queue), 21600); // 6 horas
        console.log(`Item enfileirado. Tamanho atual: ${queue.length}`);
        
      } catch (e) {
        console.error('Erro ao enfileirar item:', e);
        throw e;
      } finally {
        LOCK.releaseLock();
      }
    },

    /**
     * Retorna e remove o próximo item da fila.
     */
    dequeue: function() {
      try {
        LOCK.waitLock(30000);
        let queue = JSON.parse(CACHE.get(QUEUE_KEY) || '[]');
        
        if (queue.length === 0) return null;
        
        const item = queue.shift();
        CACHE.put(QUEUE_KEY, JSON.stringify(queue), 21600);
        
        return item;
      } finally {
        LOCK.releaseLock();
      }
    },
    
    peek: function() {
      let queue = JSON.parse(CACHE.get(QUEUE_KEY) || '[]');
      return queue.length > 0 ? queue[0] : null;
    }
  };
}