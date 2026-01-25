/**
 * @file RecargaUtils.gs
 * @project Monitoramento Lago Paranoá
 * @category hidrogeologia
 * @tags recarga, hidrogeologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function RecargaUtils() {
  // Implementação lógica para hidrogeologia
  
  return {
    /**
     * Calcula o déficit de recarga em zonas de Latossolo
     * Contexto: Relatorio.md - 2.1 Arcabouço Geológico (Domínio Poroso)
     */
    calculateRechargeDeficit: function(annualRainfallMm, sealingFactor) {
      // Em condições naturais (Cerrado), recarga é ~30-40% da chuva
      const naturalRecharge = annualRainfallMm * 0.35;
      const currentRecharge = annualRainfallMm * 0.35 * (1 - sealingFactor);
      
      const deficit = naturalRecharge - currentRecharge;
      
      if (sealingFactor > 0.6) {
        console.error(`ALERTA HIDROGEOLÓGICO: Perda de ${deficit.toFixed(0)}mm de recarga anual.`);
        console.warn('Impacto: Rebaixamento do lençol freático e redução do fluxo de base para o Lago.');
      }
      
      return deficit;
    },

    /**
     * Avalia vulnerabilidade do aquífero à contaminação vertical
     * Contexto: Relatorio.md - 2.2 Pedogênese e Tabela 1 (Permeabilidade)
     */
    assessVerticalTransportRisk: function(soilType, sanitationType) {
      // Dados da Tabela 1: Taxas de infiltração reais da Bacia Norte
      const SOIL_STATS = {
         'LATOSSOLO_VERMELHO_PONTO_05': { kv: 3.3e-4, desc: 'Extrema (~120 mm/h)' }, // Ponto 05 Relatório
         'LATOSSOLO_VERMELHO': { kv: 1.2e-4, desc: 'Muito Alta (~60 mm/h)' },        // Ponto 02 Relatório
         'LATOSSOLO_AMARELO': { kv: 5.0e-5, desc: 'Alta (~57 mm/h)' }                // Ponto 06 Relatório
      };

      const soilProps = SOIL_STATS[soilType] || { kv: 1.0e-6, desc: 'Baixa' };

      // Latossolos têm alta permeabilidade (> 10^-4 m/s), facilitando transporte de contaminantes
      // Contexto: Risco Duplo em áreas de expansão como Sobradinho/Colorado (Seção 2.1)
      if (soilProps.kv >= 5.0e-5) {
         if (sanitationType === 'SEPTIC_TANK') {
            console.warn(`RISCO DUPLO (Geo-Sanitário): Solo com Kv ${soilProps.desc} + Fossas.`);
            
            if (soilType.includes('LATOSSOLO_VERMELHO')) {
                 console.error('CRÍTICO: Área de recarga prioritária (Domínio Poroso). Proibir fossas imediatamente.');
            }
            
            console.warn('Consequência: Pluma de contaminação rápida atingindo o aquífero livre (Nitrato/Patógenos).');
            return 'HIGH_VULNERABILITY';
         } else if (sanitationType === 'STORM_DRAIN_CONNECTION') {
             // Caso de ligação clandestina na drenagem
             console.error('CRÍTICO: Bypass do filtro natural do solo. Injeção direta no tributário.');
             return 'EXTREME_RISK';
         }
      }
      return 'MODERATE_RISK';
    }
  };
}