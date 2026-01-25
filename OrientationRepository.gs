/**
 * @file OrientationRepository.gs
 * @project Monitoramento Lago Paranoá
 * @category mobile
 * @tags orientation, mobile, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Repositório para dados de orientação de dispositivos.
 * Útil para registrar direção de fotos de denúncias (Azimute).
 */
function OrientationRepository() {
  console.log('Running logic for OrientationRepository...');
  
  return {
    /**
     * Salva metadados de orientação junto com registros de campo.
     * @param {number} alpha Rotação Z (Bússola/Azimute)
     * @param {number} beta Rotação X (Inclinação frente/trás)
     * @param {number} gamma Rotação Y (Inclinação esq/dir)
     */
    logOrientation: function(recordId, alpha, beta, gamma) {
      // Normaliza Azimute (0-360)
      const heading = (360 - alpha) % 360;
      
      console.log(`Registro ${recordId}: Orientação ${heading.toFixed(2)}° N`);
      
      // Retorna objeto enrichido
      return {
        recordId: recordId,
        heading: heading,
        tilt: beta,
        roll: gamma
      };
    },
    
    getCardinalDirection: function(alpha) {
      const heading = (360 - alpha) % 360;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const index = Math.round(((heading %= 360) < 0 ? heading + 360 : heading) / 45) % 8;
      return dirs[index];
    }
  };
}