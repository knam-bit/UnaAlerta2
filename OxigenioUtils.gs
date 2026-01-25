/**
 * @file OxigenioUtils.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags oxigenio, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function OxigenioUtils() {
  // Implementação lógica para limnologia
  console.log('Running logic for OxigenioUtils...');

  return {
    /**
     * Avalia o risco de Anoxia no Hipolímnio (Fundo do lago)
     * Contexto: Relatorio.md - 4.1. Histerese e a "Bomba Interna" de Nutrientes
     */
    assessAnoxiaRisk: function(surfaceTemp, bottomTemp, depthMeters) {
      const deltaTemp = surfaceTemp - bottomTemp;
      // Estratificação forte impede mistura e reposição de oxigênio no fundo
      // Seção 4.1: Delta T > 1.5ºC já isola o fundo no Paranoá
      const isStratified = deltaTemp > 1.5 && depthMeters > 8; 

      if (isStratified) {
        console.warn(`ALERTA DE ESTRATIFICAÇÃO: Delta T de ${deltaTemp.toFixed(1)}°C.`);
        console.warn('Risco: Esgotamento de oxigênio no fundo (Anoxia) e redução de Ferro.');
        return 'HIGH_ANOXIA_RISK';
      }
      return 'MIXED_COLUMN';
    },

    /**
     * Estima o tempo para anoxia total baseado na Demanda Hipolimnética de Oxigênio (HOD)
     * Contexto: Relatorio.md - 4.3 Metabolismo e Respiração Ecossistêmica
     */
    predictAnoxiaOnset: function(initialDO, trophicState, waterTemp) {
        // Taxas de consumo típicas em lagos tropicais eutrofizados (g O2/m³/dia)
        // Mais alto no Paranoá devido à carga orgânica do Riacho Fundo
        let consumptionRate = 0.1; 
        
        if (trophicState === 'EUTROPHIC' || trophicState === 'HYPEREUTROPHIC') {
             consumptionRate = 0.5; // Alta respiração bacteriana
             if (waterTemp > 24) consumptionRate *= 1.5; // Metabolismo acelerado no calor
        }

        const daysToAnoxia = initialDO / consumptionRate;
        
        if (daysToAnoxia < 5) {
             console.error(`CRÍTICO: Anoxia prevista em ${daysToAnoxia.toFixed(1)} dias se a estratificação persistir.`);
             console.warn('Consequência: Liberação de P e Amônia (Carga Interna).');
             return 'RAPID_DEPLETION';
        }
        
        return 'SLOW_DEPLETION';
    },

    /**
     * Estima a demanda de oxigênio baseada na carga orgânica (Metabolismo)
     * Contexto: Relatorio.md - 4.3 Metabolismo e Carga Orgânica Alóctone
     */
    calculateHypolimneticOxygenDemand: function(organicCarbonLoad, eutrophicationLevel) {
      // Se há muito Carbono Orgânico (COD/COP) vindo do Riacho Fundo ou ETEs
      if (organicCarbonLoad === 'HIGH' || eutrophicationLevel === 'EUTROPHIC') {
         console.error('ALERTA METABÓLICO: Respiração excede produção no fundo.');
         console.info('Consequência: Aceleração da liberação de P do sedimento.');
         return 'CRITICAL_OXYGEN_DEPLETION';
      }
      return 'STABLE';
    }
  };
}