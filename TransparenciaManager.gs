/**
 * @file TransparenciaManager.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags transparencia, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function TransparenciaManager() {
  // Limites de transparência (Disco de Secchi) em metros
  const MIN_SECCHI_DEPTH = 1.0; 

  return {
    recordSecchiMeasurement: function(depthMeters, geoCoords) {
      if (depthMeters < MIN_SECCHI_DEPTH) {
        console.error('Alerta Limnológico: Turbidez alta detectada.');
      }
      // Lógica de persistência
      console.log(`Secchi Disk: ${depthMeters}m at ${geoCoords}`);
    },
    
    getEutrophicationRisk: function(transparencyArray) {
      // Cálculo simples de tendência
      const avg = transparencyArray.reduce((src, val) => src + val, 0) / transparencyArray.length;
      return avg < 1.5 ? 'HIGH_RISK' : 'STABLE';
    },

    /**
     * Detecta efeito de Histerese (Resiliência Tensionada)
     * Contexto: Relatorio.md - 4.1. Histerese e a "Bomba Interna" de Nutrientes
     * Verifica se a recuperação biológica (Clorofila) está atrasada em relação à redução de carga de P.
     */
    detectHysteresisEffects: function(externalLoadReductionPercent, currentChlorophyllLevel) {
        // Se houver redução de carga externa mas a clorofila continuar alta
        if (externalLoadReductionPercent > 30 && currentChlorophyllLevel > 20) {
            console.warn('ALERTA DE HISTERESE: O sistema não está respondendo à redução da carga externa.');
            console.info('Causa provável: Carga Interna de Fósforo (Sedimento) dominante.');
            return 'HYSTERESIS_ACTIVE';
        }
        return 'RESPONSIVE_SYSTEM';
    },

    /**
     * Avalia risco de liberação de Fósforo do sedimento (Carga Interna)
     * Contexto: Relatorio.md - 4.1. Histerese e a "Bomba Interna" de Nutrientes
     */
    analyzeInternalLoadRisk: function(dissolvedOxygenMgL, depthMeters, season, sedimentFePRatio) {
      // Na seca (maio-setembro), ocorre estratificação térmica
      const isStratificationSeason = ['MAY', 'JUN', 'JUL', 'AUG', 'SEP'].includes(season);
      
      // Estimativa de Potencial Redox baseada em OD via tabela de referência (Relatorio.md - 4.1)
      // < 2.0 mg/L OD correlaciona com Redox < 200mV -> Redução de Fe(III) para Fe(II)
      const isRedoxCritical = dissolvedOxygenMgL < 2.0;

      // Razão Molar Fe:P (Ferro deve ser abundante para "segurar" o P)
      // Relatorio Seção 4.1: Razão < 10-15 indica saturação dos sítios de adsorção
      const isSedimentSaturated = sedimentFePRatio && sedimentFePRatio < 15;

      // Se houver anoxia (< 2mg/L) no fundo, o Ferro reduz [Fe(III) -> Fe(II)] e libera Fósforo
      if (isStratificationSeason && depthMeters > 10 && (isRedoxCritical || isSedimentSaturated)) {
        console.warn('ALERTA LIMNOLÓGICO CRÍTICO: Risco de Carga Interna (Release Redox).');
        console.warn('Mecanismo: Dissolução de óxidos de ferro no sedimento libera P adsorvido (Bomba Interna).');
        
        if (isSedimentSaturated) {
             console.error(`AGRAVANTE GEOQUÍMICO: Baixa razão Fe:P (${sedimentFePRatio}). Alta mobilidade de Fósforo.`);
        }

        // Contexto: Relatorio.md - 8. Recomendações (Manejo da Carga Interna)
        console.info('Recomendação Técnica: Avaliar aplicação de capping (Lantânio/Argila) ou aeração hipolimnética.');
        
        // Estimativa de fluxo de P (mg/m²/dia) baseada em literatura para lagos eutróficos (Steinman et al., 2004)
        const estimatedPFlux = isSedimentSaturated ? 15.0 : 5.0; 
        console.info(`Estimativa de Fluxo de P Interno: ${estimatedPFlux} mg/m²/dia`);

        return 'HIGH_INTERNAL_LOAD_RISK';
      }
      return 'STABLE_SEDIMENT';
    },

    /**
     * Calcula necessidade de capping químico (Inativação de Fósforo)
     * Contexto: Relatorio.md - 8. Recomendações
     */
    calculateChemicalCappingNeeds: function(internalLoadLevel, sedimentAreaHa) {
       if(internalLoadLevel === 'HIGH_INTERNAL_LOAD_RISK') {
          console.info(`Recomendação Técnica: Aplicação de capping com argila modificada (Lantânio) em ${sedimentAreaHa} hectares.`);
          console.info('Objetivo: Travar o P no sedimento independente do Redox.');
          return 'CAPPING_REQUIRED';
       }
       return 'NO_ACTION';
    },

    /**
     * Monitoramento de Espécies Invasoras e Toxinas
     * Contexto: Relatorio.md - 5.1. A Hegemonia de Cylindrospermopsis raciborskii
     */
    analyzeCyanobacteriaRisk: function(speciesDiscoveryList, nitrogenPhosphorusRatio) {
      const INVASIVE_SPECIES = 'Cylindrospermopsis raciborskii'; // ou Raphidiopsis
      const hasInvasive = speciesDiscoveryList.some(s => s.name === INVASIVE_SPECIES);

      if (hasInvasive) {
        console.warn(`ALERTA BIOLÓGICO: Presença de ${INVASIVE_SPECIES} detectada.`);
        
        // Espécie possui plasticidade fenotípica e "consumo de luxo" de P
        if (nitrogenPhosphorusRatio > 20) {
           console.warn('Risco Elevado: Monitorar saxitoxinas e cilindrospermopsinas.');
           console.warn('Contexto Relatorio.md 5.1: Espécie adaptada a baixa luminosidade e N variado.');
        }
        return 'TOXIC_BLOOM_RISK';
      }
      return 'LOW_RISK';
    },

    /**
     * Calcula o risco metabólico do lago (Autotrofia vs Heterotrofia)
     * Contexto: Relatorio.md - 4.3 Metabolismo
     */
    calculateMetabolicRisk: function(productionRate, respirationRate) {
        if (productionRate > respirationRate * 1.5) {
            console.warn('ALERTA: Autotrofia líquida alta. Acúmulo de biomassa algal iminente.');
            return 'BLOOM_POTENTIAL';
        }
        return 'BALANCED';
    },

    /**
     * Avalia ressuspensão eólica e bioturbação
     * Contexto: Relatorio.md - Tabela 2: Mecanismos de Carga Interna
     */
    analyzeSedimentDisturbance: function(windSpeedKmH, depthMeters, fishStock) {
       // Ressuspensão por ondas em áreas rasas (Ex: Lago Norte)
       if (depthMeters < 3 && windSpeedKmH > 20) {
         console.warn('ALERTA FÍSICO: Ressuspensão de sedimentos por ação eólica em áreas rasas.');
         return 'WIND_RESUSPENSION';
       }
       
       // Biomassa de peixes zooplanctívoros (ex: Tilápias) revolvendo o fundo
       if (fishStock && fishStock.bioturbationRisk === 'HIGH') {
         console.warn('ALERTA BIOLÓGICO: Bioturbação excessiva por Tilápias/Carpas.');
         console.info('Recomendação (Rel. Seção 8): Biomanipulação (Top-down) com introdução de piscívoros nativos.');
         return 'BIOTURBATION_RISK';
       }
       return 'STABLE';
    }
  };
}