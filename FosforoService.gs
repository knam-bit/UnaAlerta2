/**
 * @file FosforoService.gs
 * @project Monitoramento Lago Paranoá
 * @category limnologia
 * @tags fosforo, limnologia, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * FosforoService.gs
 * Serviço especializado na dinâmica biogeoquímica do Fósforo (P).
 * Responsável por calcular a Carga Interna (Internal Load) e riscos de Eutrofização.
 * 
 * Base Científica: Seções 4.1 (Carga Interna) e 8.1.2 do Relatório.
 */

var FosforoService = {
  
  CONSTANTS: {
    // Limites baseados no CONAMA 357/2005 e literatura de lagos tropicais
    LIMITES: {
      EUTROFICO: 30,      // µg/L (Limite Classe 2)
      HIPEREUTROFICO: 100 // µg/L (Risco crítico de blooms)
    },
    // Taxas de liberação de P do sedimento (mg/m²/dia)
    // Baseado na redução de Fe(III) -> Fe(II) em anoxia (Seção 4.1)
    FLUXO_ANOXICO_BASE: 12.0, 
    FLUXO_OXICO_BASE: 0.5,
    COEFICIENTE_ARRHENIUS: 1.07 // Fator de correção de temperatura (teta)
  },

  /**
   * Calcula a Carga Interna de Fósforo (Internal Load) liberada pelos sedimentos.
   * Representa a "memória química" do lago mencionada no relatório.
   * 
   * @param {number} sedimentP_mg_kg - Concentração de P no sedimento (mg/kg)
   * @param {boolean} isAnoxic - Se a interface sedimento-água está anóxica (OD < 1 mg/L)
   * @param {number} temperature_C - Temperatura da água no fundo (ºC)
   * @return {number} Taxa de liberação estimada em mg/m²/dia
   */
  calculateInternalLoad: function(sedimentP_mg_kg, isAnoxic, temperature_C) {
    if (sedimentP_mg_kg == null || temperature_C == null) {
      console.warn("FosforoService: Dados insuficientes para cálculo de carga interna.");
      return 0;
    }

    // Seleciona taxa base dependendo do estado redox (anoxia solubiliza Fe e libera P)
    var baseRate = isAnoxic ? this.CONSTANTS.FLUXO_ANOXICO_BASE : this.CONSTANTS.FLUXO_OXICO_BASE;

    // Fator de correção pela riqueza do sedimento (normalizado para 1000 mg/kg como referência)
    var sedimentFactor = sedimentP_mg_kg / 1000;

    // Correção por temperatura (metabolismo bacteriano/cinética química)
    // Referência de 20ºC
    var tempFactor = Math.pow(this.CONSTANTS.COEFICIENTE_ARRHENIUS, (temperature_C - 20));

    var releaseRate = baseRate * sedimentFactor * tempFactor;

    return parseFloat(releaseRate.toFixed(2));
  },

  /**
   * Avalia o risco de eutrofização com base na concentração de P na coluna d'água.
   * Dispara alertas para o sistema de notificação.
   * 
   * @param {number} totalPhosphorus_ug_L - Fósforo Total em µg/L
   * @return {Object} Objeto de risco com status, mensagem e recomendação
   */
  checkEutrophicationRisk: function(totalPhosphorus_ug_L) {
    var assessment = {
      concentration: totalPhosphorus_ug_L,
      riskLevel: 'BAIXO',
      alert: false,
      recommendation: 'Manter monitoramento mensal de rotina.'
    };

    if (totalPhosphorus_ug_L > this.CONSTANTS.LIMITES.HIPEREUTROFICO) { // > 100 µg/L
      assessment.riskLevel = 'CRÍTICO';
      assessment.alert = true;
      assessment.recommendation = 'ALTO RISCO DE BLOOM. Acionar protocolo de emergência. Verificar ETEs e drenagem.';
    } else if (totalPhosphorus_ug_L > this.CONSTANTS.LIMITES.EUTROFICO) { // > 30 µg/L
      assessment.riskLevel = 'ALERTA';
      assessment.alert = true;
      assessment.recommendation = 'Estado Eutrófico (acima CONAMA Cl.2). Aumentar frequência de amostragem.';
    }

    return assessment;
  }
};