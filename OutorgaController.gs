/**
 * @file OutorgaController.gs
 * @project Monitoramento Lago Paranoá
 * @category governanca
 * @tags outorga, governanca, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function OutorgaController() {
  // Implementação lógica para governanca
  console.log('Running logic for OutorgaController...');

  return {
    /**
     * Monitora conformidade de uso de água superficial
     * Contexto: Relatorio.md - 7.1 Gestão de Outorgas e Captação Ilegal
     */
    monitorUsageCompliance: function(userType, declaredUsage, actualConsumption) {
       // Contexto: Irrigação de jardins e campos de golfe no Lago Norte
       if (actualConsumption > declaredUsage * 1.2) {
           console.warn(`INFRAÇÃO DETECTADA: Usuário ${userType} excedeu limite de outorga.`);
           if (userType === 'CLUBE_ESPORTIVO' || userType === 'CONDOMINIO') {
               console.warn('Agravante: Uso não prioritário (irrigação) prejudicando balanço hídrico.');
           }
           return 'VIOLATION_DETECTED';
       }
       return 'COMPLIANT';
    },

    /**
     * Verifica validade temporal da outorga (Achado da CPI)
     * Contexto: Relatorio.md - 7.1 "Caixa Preta" e Outorgas Vencidas
     */
    checkExpiration: function(licenseExpiryDate) {
        const today = new Date();
        if (new Date(licenseExpiryDate) < today) {
            console.error('FALHA DE GOVERNANÇA: Operação com outorga vencida.');
            console.warn('Ação: Notificar ADASA imediatamente conforme recomendações da CPI.');
            return 'EXPIRED_LICENSE';
        }
        return 'VALID_LICENSE';
    },

    /**
     * Audita a integridade da telemetria (Hidrometria)
     * Contexto: Relatorio.md - 7.1 Deficiências na Fiscalização ("Dados Caixa Preta")
     * Detecta "apagões" propositais de dados para mascarar consumo excessivo.
     */
    auditTelemetryIntegrity: function(telemetrySeries) {
        // Verifica gaps de dados que indicam desligamento de equipamento ou falha de transmissão
        const gaps = telemetrySeries.filter(reading => reading.status === 'MISSING').length;
        const totalReadings = telemetrySeries.length;
        
        // Tolerância de 15% para falhas técnicas reais
        if ((gaps / totalReadings) > 0.15) {
            console.error('ALERTA DE FISCALIZAÇÃO: Hidrometria intermitente (>15% de falhas).');
            console.warn('Suspeita: Manipulação de dados de captação ou equipamento inoperante.');
            return 'DATA_INTEGRITY_FAIL';
        }
        return 'RELIABLE_DATA';
    },

    /**
     * Aplica restrições sazonais de captação em áreas críticas
     * Contexto: Relatorio.md - 2.1 Fluxo de Base e Estiagem (Maio-Setembro)
     */
    applySeasonalRestrictions: function(month, userType, aquiferZone) {
       const isDrySeason = month >= 5 && month <= 9; // Maio a Setembro
       const isRechargeArea = aquiferZone === 'DOMINIO_POROSO_LATOSSOLO';
       
       // Restrição severa para irrigação suntuária (Golf/Jardins) na seca em áreas de recarga
       // O aquífero precisa manter o fluxo de base para o lago
       if (isDrySeason && isRechargeArea && userType === 'IRRIGATION_LEISURE') {
           console.warn('REGULAÇÃO: Suspensão temporária de outorga para irrigação de lazer.');
           console.info('Motivo: Preservação do fluxo de base (baseflow) crítico para o Lago Paranoá.');
           return 'RESTRICTED_USAGE';
       }
       return 'STANDARD_ALLOCATION';
    }
  };
}