/**
 * @file MobilizacaoController.gs
 * @project Monitoramento Lago Paranoá
 * @category Ciência Cidadã
 * @tags mobilizacao, denuncias, triagem
 * @description Coordena ações de ciência cidadã para preencher lacunas de monitoramento oficial.
 * @context Relatorio.md - Seção 7.3 (Controle Social) e 8 (Monitoramento Integrado)
 */

function MobilizacaoController() {
  /**
   * Coordena ações de ciência cidadã para preencher lacunas de monitoramento oficial.
   * @param {Array<Object>} citizenReports Denúncias ou dados coletados por cidadãos
   * @return {Object} Priorização de fiscalização
   */
  this.triagemDenuncias = function(citizenReports) {
    // Referência: Seção 7.1 - Governo falha na fiscalização; Sociedade deve atuar.
    const priorities = citizenReports.filter(r => 
      r.type === 'SEWAGE_SMELL_IN_DRAIN' || 
      r.type === 'ALGAL_BLOOM_VISUAL' ||
      r.type === 'DEAD_FISH' ||
      r.type === 'ILLEGAL_DISCHARGE'
    );
    
    const actionPlan = {
      totalReports: citizenReports.length,
      highPriority: priorities.length,
      action: priorities.length > 0 ? 'ALERT_ADASA_IBRAM' : 'LOG_DATA',
      narrative: 'Sociedade civil preenchendo o vazio de dados deixado pelo monitoramento oficial.'
    };

    Logger.log('🚨 Mobilização - Ação de Controle Social:', actionPlan);
    return actionPlan;
  };
  
  Logger.log('✅ MobilizacaoController carregado. Ciência Cidadã ativa.');
}