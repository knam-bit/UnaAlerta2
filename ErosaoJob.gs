/**
 * @file ErosaoJob.gs
 * @project Monitoramento Lago Paranoá
 * @category hidrogeologia
 * @tags erosao, hidrogeologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function ErosaoJob() {
  // Implementação lógica para hidrogeologia
  console.log('Running logic for ErosaoJob...');

  return {
    /**
     * Estima carga de sedimentos (Yield) baseada na USLE (Equação Universal de Perda de Solo)
     * Contexto: Relatorio.md - 2.2 Pedogênese e Erosão em Loteamentos
     */
    estimateSedimentYield: function(rainfallIntensity, soilErodibility, coverManagementFactor, season) {
      // Seção 2.2: Risco crítico no "Verão Brasiliense" (chuvas torrenciais de nov-mar)
      const isWetSeason = ['NOV', 'DEC', 'JAN', 'FEB', 'MAR'].includes(season);

      // Fator C (Cover) alto quando se remove o Cerrado para loteamento
      // Intensidade > 25 mm/h caracteriza chuvas erosivas comuns no DF
      if (coverManagementFactor > 0.5 && isWetSeason && rainfallIntensity > 25) { 
          console.warn('ALERTA DE EROSÃO CRÍTICA: Solo exposto sob chuvas torrenciais de verão.');
          console.warn('Risco: Transporte massivo de sedimentos para a calha do Ribeirão Sobradinho (Classe V).');
          return 'EXTREME_SEDIMENT_LOAD';
      }

      if (coverManagementFactor > 0.5) { 
          console.warn('ALERTA DE EROSÃO: Solo exposto.');
          return 'HIGH_SEDIMENT_LOAD';
      }
      return 'LOW_RISK';
    },

    /**
     * Avalia transporte de Fósforo Associado ao Sedimento
     * Contexto: Relatorio.md - 2.2 e 4.1 (Fósforo adsorvido em óxidos de ferro)
     */
    assessPhosphorusTransport: function(sedimentLoadKg, soilIronContent) {
        // Latossolos Vermelhos são ricos em Fe e Al, que prendem o P
        if (soilIronContent === 'HIGH_FE_OXIDES') {
            console.info(`Carga de P Particulado estimada: ${sedimentLoadKg * 0.001} kg (Estimativa).`);
            console.warn('Nota: Este Fósforo ficará inerte até encontrar condições anóxicas no fundo do lago.');
            return 'PARTICULATE_P_LOAD';
        }
        return 'DISSOLVED_LOAD_ONLY';
    }
  };
}