/**
 * @file DenunciaUtils.gs
 * @project Monitoramento Lago Paranoá
 * @category sociedade
 * @tags denuncia, sociedade, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function DenunciaUtils() {
  // Implementação lógica para sociedade
  console.log('Running logic for DenunciaUtils...');

  return {
    /**
     * Categoriza denúncias para o MPDFT/ADASA
     * Contexto: Relatorio.md - 7.1 Deficiências na Fiscalização
     */
    categorizeComplaint: function(description, location) {
      description = description.toUpperCase();
      
      if (description.includes('CHEIRO DE ESGOTO') || description.includes('BUEIRO')) {
        // Seção 3.2: Ligações clandestinas em drenagem pluvial
        return {
           type: 'SANEAMENTO_CLANDESTINO',
           targetAgency: 'ADASA',
           severity: 'HIGH',
           note: 'Possível ligação de esgoto na rede pluvial (Crime Ambiental).'
        };
      }
      
      if (description.includes('PEIXES MORTOS') || description.includes('ÁGUA VERDE')) {
        // Seção 5.1: Bloom de cianobactérias e anoxia
        return {
           type: 'DESEQUILIBRIO_ECOLOGICO',
           targetAgency: 'IBRAM',
           severity: 'CRITICAL',
           note: 'Potencial floração de Cylindrospermopsis ou anoxia por carga interna.'
        };
      }

      if (description.includes('CERCA') || description.includes('MURO NA ÁGUA')) {
         // Seção 7.3: Conflito da Orla
         return {
            type: 'OCUPACAO_IRREGULAR',
            targetAgency: 'DF_LEGAL',
            severity: 'MEDIUM',
            note: 'Violação de APP e restrição de acesso público (Projeto Orla).'
         };
      }
      
      return { type: 'GENERAL_INQUIRY', targetAgency: 'OUVIDORIA' };
    },

    /**
     * Enriquece a denúncia com contexto hidrogeológico para priorização
     * Contexto: Relatorio.md - 2.1 e 2.2 (Vulnerabilidade de Aquíferos)
     */
    enrichComplaintContext: function(baseComplaint, soilType, zone) {
        // Se a denúncia de esgoto ocorre em área de recarga (Latossolo Vermelho/Sobradinho)
        if (baseComplaint.type === 'SANEAMENTO_CLANDESTINO') {
            const isRechargeZone = soilType === 'LATOSSOLO' && (zone === 'SOBRADINHO' || zone === 'GRANDE_COLORADO');
            
            if (isRechargeZone) {
                console.error('PRIORIDADE MÁXIMA: Risco Duplo (Contaminação Direta de Aquífero Freático).');
                baseComplaint.severity = 'CRITICAL_AQUIFER_RISK';
                baseComplaint.note += ' [CONTEXTO: Área de Recarga de Alta Permeabilidade - Relatório Seção 2.1]';
            }
        }
        return baseComplaint;
    }
  };
}