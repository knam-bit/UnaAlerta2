/**
 * @file ConscientizacaoService.gs
 * @project Monitoramento Lago Paranoá
 * @category sociedade
 * @tags conscientizacao, sociedade, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function ConscientizacaoService() {
  // Implementação lógica para sociedade
  console.log('Running logic for ConscientizacaoService...');

  return {
      /**
       * Gera campanha sobre contaminação por fibras sintéticas
       * Contexto: Relatorio.md - 6.1 Microplásticos (Lavagem de roupas)
       */
      generateMicroplasticCampaign: function() {
          const message = {
              title: "O Lago começa na sua Máquina de Lavar",
              body: "Fibras de roupas sintéticas não são retidas totalmente pela ETE. Use filtros ou prefira tecidos naturais.",
              context: "Relatório Seção 6.1: Microplásticos no Sedimento."
          };
          console.log(`Campanha Gerada: ${message.title}`);
          return message;
      },

      /**
       * Módulo educativo sobre Histerese (A "Memória" do Lago)
       * Contexto: Relatorio.md - 4.1 Histerese e a "Bomba Interna"
       * Explica por que a água continua verde mesmo após melhorias no tratamento de esgoto.
       */
      explainHysteresisEffect: function() {
          return {
             title: "Por que o lago demora a limpar?",
             concept: "Memória Química (Histerese)",
             explanation: "Décadas de poluição acumularam fósforo na lama do fundo (sedimento). Mesmo cortando o esgoto hoje, esse estoque antigo continua alimentando as algas.",
             analogy: "É como uma conta bancária: paramos de depositar (poluição), mas o saldo (nutrientes no fundo) ainda rende juros (algas).",
             action: "Necessidade de dragagem ou aplicação de argila (Phoslock) para 'trancar' o fósforo no fundo."
          };
      },

      /**
       * Alerta sobre uso excessivo de fertilizantes em jardins
       * Contexto: Relatorio.md - 3.1 Lago Norte e Eutrofização Localizada
       */
      generateFertilizerAlert: function(neighborhood, currentNP_Ratio) {
          if (neighborhood === 'LAGO_NORTE' || neighborhood === 'LAGO_SUL') {
              console.warn('Alerta Educativo: Minimize uso de NPK nos jardins próximos à orla.');
              console.warn('Motivo: O runoff carrega nutrientes diretamente para o lago.');
              
              if (currentNP_Ratio && currentNP_Ratio < 10) {
                 console.info('DICA DE OURO: O lago já tem muito Nitrogênio. Evite adubos ricos em Fósforo (O "P" do NPK).'); 
                 console.info('Contexto: O fósforo é o gatilho para os blooms de cianobactérias.');
              }
          }
      },
      
      /**
       * Campanha sobre descarte de fármacos e disruptores endócrinos
       * Contexto: Relatorio.md - 6.2 Micropoluentes (Fármacos)
       */
      generatePharmaDisposalCampaign: function() {
          const message = {
              title: "Remédio Vencido: O Lago não é Lixeira",
              body: "Antibióticos e hormônios descartados na pia/vaso não são removidos pela ETE e afetam a reprodução dos peixes.",
              action: "Entregue medicamentos vencidos em farmácias com logística reversa.",
              context: "Relatório Seção 6.2: Micropoluentes e poluição invisível."
          };
          console.log(`Campanha Gerada: ${message.title}`);
          return message;
      }
  };
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConscientizacaoService;
}