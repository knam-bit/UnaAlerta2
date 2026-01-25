/**
 * @file CianobacteriasRepository.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags cianobacterias, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

var CianobacteriasRepository = {
  
  // Base de dados das principais espécies do Paranoá (Seção 5.1)
  SPECIES_DB: {
    'Cylindrospermopsis raciborskii': { // aka Raphidiopsis raciborskii
      type: 'Filamentosa',
      toxins: ['Saxitoxinas', 'Cilindrospermopsinas'],
      traits: ['Plasticidade Fenotípica', 'Vacúolos de Gás', 'Consumo de Luxo de P'],
      risk_threshold: 20000 // células/mL
    },
    'Microcystis aeruginosa': {
      type: 'Colonial',
      toxins: ['Microcistinas'],
      traits: ['Colônias mucilaginosas', 'Resistência UV'],
      risk_threshold: 20000 
    }
  },

  /**
   * Analisa quais estratégias adaptativas estão favorecendo a dominância da espécie
   * dadas as condições ambientais atuais. (Seção 5.1 do Relatório)
   * 
   * @param {string} speciesName - Nome da espécie
   * @param {number} lightIntensity - Intensidade luminosa (µE/m²/s) ou Transparência Secchi
   * @param {number} nutrientConcentration - Fósforo Total (µg/L)
   * @return {Object} Análise de estratégias ativas
   */
  analyzeAdaptationStrategies: function(speciesName, lightIntensity, nutrientConcentration) {
    // Normaliza nomes (reclassificação taxonômica mencionada no relatório)
    if (speciesName.includes('Raphidiopsis')) speciesName = 'Cylindrospermopsis raciborskii';
    
    var species = this.SPECIES_DB[speciesName];
    if (!species) return { error: 'Espécie não monitorada.' };

    var analysis = {
      species: speciesName,
      dominanceLink: [],
      note: ''
    };

    // Lógica de "Plasticidade Fenotípica" e "Eco-fisiologia" (Seção 5.1)
    if (speciesName === 'Cylindrospermopsis raciborskii') {
      // Baixa luz (turbidez alta) -> Ecótipo de sombra
      if (lightIntensity < 1.0) { // Secchi < 1m
        analysis.dominanceLink.push('Adaptação à baixa luminosidade (Sombra)');
      } else {
        analysis.dominanceLink.push('Tolerância à alta irradiância');
      }

      // Baixo nutriente na água -> Consumo de reservas internas
      if (nutrientConcentration < 20) {
        analysis.dominanceLink.push('Consumo de Luxo (Uso de estoques intracelulares de P)');
      }

      analysis.dominanceLink.push('Regulação de posição na coluna d\'água (Vacúolos)');
    }

    return analysis;
  },

  /**
   * Avalia o risco toxicológico para usos específicos da água.
   * 
   * @param {string} speciesStrain - Cepa ou espécie identificada
   * @param {number} cellCount - Contagem de células/mL
   * @param {string} waterUseType - 'ABASTECIMENTO' ou 'RECREACAO'
   * @return {Object} Avaliação de risco sanitário
   */
  assessToxicityRisk: function(speciesName, cellCount, waterUseType) {
    var species = this.SPECIES_DB[speciesName] || { toxins: ['Desconhecida'] };
    var limit = (waterUseType === 'ABASTECIMENTO') ? 10000 : 50000;

    var risk = {
      isRisk: false,
      level: 'MONITORAMENTO',
      potentialToxins: species.toxins,
      action: 'Manter rotina.'
    };

    if (cellCount > limit) {
      risk.isRisk = true;
      risk.level = 'ALTO';
      risk.action = (waterUseType === 'ABASTECIMENTO') 
        ? 'ALERTA: Risco de neurotoxinas/hepatotoxinas na captação. Adsorção (Carvão Ativado) necessária.'
        : 'INTERDIÇÃO: Balneabilidade imprópria. Contato primário proibido.';
    }

    return risk;
  }
};