/**
 * @file CacheService.gs
 * @project Monitoramento Lago Paranoá
 * @category offline
 * @tags cache, offline, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Serviço de Cache para otimização de performance (Mobile-First).
 * Reduz latência na recuperação de relatórios pesados (HTML/JSON).
 */
function CacheServiceWrapper() { // Renamed to avoid conflict with built-in Class
  console.log('Running logic for CacheService...');
  
  const cache = CacheService.getScriptCache();

  return {
    getOrSet: function(key, callback, expirationInSeconds = 600) {
      const cached = cache.get(key);
      if (cached) {
        console.log(`Cache hit for ${key}`);
        return JSON.parse(cached);
      }
      
      console.log(`Cache miss for ${key}. Fetching/Computing...`);
      const result = callback();
      
      if (result) {
        cache.put(key, JSON.stringify(result), expirationInSeconds);
      }
      return result;
    },
    
    invalidate: function(key) {
      cache.remove(key);
    }
  };
}