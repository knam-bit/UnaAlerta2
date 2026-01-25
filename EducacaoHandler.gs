/**
 * @file EducacaoHandler.gs
 * @project Monitoramento Lago Paranoá
 * @category sociedade
 * @tags educacao, sociedade, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function EducacaoHandler() {
  // Implementação lógica para sociedade
  console.log('Running logic for EducacaoHandler...');

  return {
    /**
     * Módulo educativo sobre fertilizantes em jardins domésticos
     * Contexto: Relatorio.md - 3.1 Lago Norte e Eutrofização Localizada
     */
    assessGardenImpact: function(hasLawn, fertilizerFrequency) {
      if (hasLawn && fertilizerFrequency === 'MONTHLY') {
        console.warn('EDUCAÇÃO AMBIENTAL: O excesso de NPK no seu jardim vai parar no lago via chuva.');
        console.info('Dica: Use adubo orgânico de liberação lenta e reduza a frequência na estação chuvosa.');
        console.info('Impacto: Estimula o crescimento de algas nas margens (efeito visual imediato).');
        return 'HIGH_NUTRIENT_RUNOFF_RISK';
      }
      return 'LOW_IMPACT';
    },

    /**
     * Educação sobre "Risco Duplo" em áreas de recarga (Sobradinho/Colorado)
     * Contexto: Relatorio.md - 2.1 Arcabouço Geológico e Tabela 1 (Permeabilidade)
     */
    teachAquiferRecharge: function(soilType) {
        if (soilType.includes('LATOSSOLO')) {
            return {
                message: "Você mora sobre uma 'esponja' natural.",
                riskExplanation: "O solo vermelho (Latossolo) absorve água muito rápido (>60mm/h). Se você usar fossa séptica, o esgoto chega rápido no lençol freático que alimenta o lago.",
                action: "Conecte-se à rede de esgoto ou use fossas ecológicas impermeáveis."
            };
        }
        return null;
    },

    /**
     * Alerta sobre riscos de contato com C. raciborskii
     * Contexto: Relatorio.md - 5.1 A Hegemonia de Cylindrospermopsis
     */
    explainCyanobacteriaRisks: function(waterAppearance) {
        if (waterAppearance === 'GREEN_SOUP' || waterAppearance === 'SCUM') {
            return {
                alert: "Perigo: 'Sopa de Ervilha'",
                science: "Isso não é sujeira comum, são cianobactérias (Cylindrospermopsis).",
                healthRisk: "Podem liberar toxinas que afetam o fígado e o sistema nervoso (Neurotoxinas/Hepatotoxinas).",
                recommendation: "Não nade, não deixe pets beberem e evite comer peixes dessa área."
            };
        }
        return { status: "SAFE_FOR_CONTACT" };
    },

    /**
     * Workshop sobre Microplásticos e Lavagem de Roupas
     * Contexto: Relatorio.md - 6.1 Microplásticos nos Sedimentos
     */
    provideLaundryTips: function() {
       return {
         title: "O Lago na sua Lavanderia",
         tips: [
           "Use filtros de fiapos externos na saída da máquina.",
           "Prefira roupas de fibras naturais (algodão) vs sintéticas (poliéster).",
           "Lave roupas com carga cheia para reduzir o atrito e quebra de fibras."
         ],
         scientificBasis: "Relatório Seção 6.1: Sedimentos do lago acumulam fibras que ETEs não removem."
       };
    }
  };
}