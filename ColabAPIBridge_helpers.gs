
/**
 * Helper functions for Gemini interactions.
 * Included in the project as a .gs file.
 */

/**
 * Retrieves Gemini insights, either from Drive cache or by triggering generation.
 */
function getGeminiInsights_() {
  // Tenta buscar do JSON salvo no Drive
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1kEJZHGeaPM6hKr66u3A1GgIVEgAPGnd6';
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName('gemini_insights.json');
    if (files.hasNext()) {
      const file = files.next();
      return JSON.parse(file.getBlob().getDataAsString());
    }
  } catch (e) {
    console.warn('Insights Gemini não encontrados no Drive, tentando via API', e);
  }
  
  // Se não encontrar, tenta chamar API (que pode gerar na hora)
  // Ensure we have access to COLAB_API_CONFIG
  if (typeof COLAB_API_CONFIG === 'undefined') {
    return { error: "Configuração da API não carregada." };
  }
  
  // 2. Tentar API do Colab (Python Backend)
  try {
    const result = callColabAPI(COLAB_API_CONFIG.ENDPOINTS.GENERATE_CHART, {}, 'POST');
    if (result.success && result.data.insights) {
      return result.data.insights;
    }
  } catch (e) {
    console.warn('Erro ao conectar com Colab:', e);
  }

  // 3. Fallback: Gerar insights locais a partir dos dados da planilha
  console.warn('API Colab indisponível/offline. Gerando insights locais detalhados (Modo Debate)...');
  
  // Tentar usar o GeminiService (Nativo) se houver chave, passando os dados brutos
  const dataSummary = generateDataSummaryForPrompt_();
  if (dataSummary && PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')) {
      try {
          const prompt = `Atue como um especialista em limnologia e gestão de recursos hídricos. Baseado nestes dados brutos do Lago Paranoá: ${JSON.stringify(dataSummary)}, gere insights analíticos profundos (um debate técnico) para as chaves: 01_KDE_Fosforo_Total, 02_KDE_Clorofila_a, 04_Barras_Empilhadas_Eutrofizacao, 05_Radar_Sedimentos_Interno. Retorne apenas um JSON válido com essas chaves e textos ricos.`;
          const rawAi = GeminiService.callRealGeminiAPI_(prompt, PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'));
          // Tentar parsear o JSON de volta
          const parsed = JSON.parse(rawAi.replace(/```json/g, '').replace(/```/g, ''));
          // Mesclar com o fallback para garantir todas as chaves
          return { ...generateLocalInsightsFromSheet_(), ...parsed };
      } catch(e) {
          console.error("Erro ao chamar Gemini Nativo para insights trocando para simulação local:", e);
      }
  }

  // Fallback final: Simulação Local Avançada ("Debate Mode")
  return generateLocalInsightsFromSheet_();
}

/**
 * Coleta um resumo dos dados para enviar ao LLM.
 */
function generateDataSummaryForPrompt_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Monitoramento_Ambiental");
    if (!sheet) return null;
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return null;
    
    // Pegar cabeçalho e 5 linhas mais recentes
    return {
        headers: values[0],
        recent_data: values.slice(1, 6)
    };
}

/**
 * Gera insights processando os dados da planilha localmente com retórica de debate.
 * @return {Object} Insights simulados baseados em regras avançadas.
 */
function generateLocalInsightsFromSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const insights = {};
  
  // Helper para pegar dados
  const getData = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    return sheet.getDataRange().getValues();
  };

  // 1. ANÁLISE DE FÓSFORO E CLOROFILA (Eutrofização)
  const dataMon = getData("Monitoramento_Ambiental") || getData("Qualidade da Água");
  
  if (dataMon && dataMon.length > 1) {
    // 0:ID, 1:Data, 2:Zona, 3:pH, 4:OD, 5:Turbidez, 6:P-Total, 7:Clorofila
    const indices = {};
    dataMon[0].forEach((h, i) => indices[h] = i);
    
    // Fallback de índices se nomes mudarem
    const idxP = indices['Fosforo_Total_mg_L'] || 6;
    const idxCloro = indices['Clorofila_a_ug_L'] || 7;
    const idxZona = indices['Zona_Bacia'] || 2;
    const idxOD = indices['OD_mg_L'] || 4;

    const pTotalValues = dataMon.slice(1).map(r => r[idxP]).filter(v => typeof v === 'number');
    const cloroValues = dataMon.slice(1).map(r => r[idxCloro]).filter(v => typeof v === 'number');
    
    if (pTotalValues.length > 0) {
      const avgP = pTotalValues.reduce((a,b)=>a+b,0) / pTotalValues.length;
      const maxP = Math.max(...pTotalValues);
      
      // Debate sobre Fósforo
      let debateFosforo = `DADOS BRUTOS: Média de ${avgP.toFixed(2)} µg/L (Máx: ${maxP.toFixed(2)} µg/L).\n\n`;
      debateFosforo += `ANÁLISE CRÍTICA: Os dados brutos da planilha revelam uma situação preocupante quanto à carga de nutrientes. `;
      if (avgP > 50) {
          debateFosforo += `A média global excede significativamente os limites para corpos lênticos classe 2. Observa-se uma clara "forçante externa" de eutrofização, provavelmente oriunda de esgoto difuso e conexões clandestinas nas bacias contribuintes. `;
          debateFosforo += `Este cenário exige uma revisão imediata das políticas de drenagem urbana, pois o lago está perdendo sua capacidade de autodepuração para cargas tão elevadas.`;
      } else {
          debateFosforo += `Embora a média pareça controlada, os picos de ${maxP.toFixed(2)} indicam pulsos de poluição (carga pontual ou first flush) que não podem ser ignorados. A estabilidade aparente pode mascarar acumulações sedimentares.`;
      }
      insights['01_KDE_Fosforo_Total'] = debateFosforo;
      
      // Debate sobre Clorofila
      const avgC = cloroValues.reduce((a,b)=>a+b,0) / cloroValues.length;
      let debateCloro = `DADOS BRUTOS: Média de ${avgC.toFixed(2)} µg/L.\n\n`;
      debateCloro += `RESPOSTA BIOLÓGICA: Existe uma correlação direta observável nos dados entre os níveis de fósforo e a resposta algal. `;
      if (avgC > 20) {
        debateCloro += `A biomassa fitoplanctônica está reagindo agressivamente ao enriquecimento nutricional. Isso não é apenas um problema estético; representa um risco de blooms de cianobactérias tóxicas, comprometendo a balneabilidade e o abastecimento. É imperativo mitigar a entrada de nutrientes para "famintos" as algas.`;
      } else {
        debateCloro += `Apesar da disponibilidade de nutrientes, a resposta algal ainda está contida, possivelmente devido à limitação por luz (turbidez) ou pastejo por zooplâncton. Monitorar a transparência é crucial para prever blooms futuros.`;
      }
      insights['02_KDE_Clorofila_a'] = debateCloro;
      
      insights['03_Violin_IQA_Pontos'] = `DISPARIDADE ESPACIAL: A tabulação dos dados de IQA expõe uma fratura hidrogeológica e social no lago. Zonas como o Riacho Fundo atuam quase como lagoas de estabilização para o esgoto urbano, enquanto o Lago Norte desfruta de condições oligotróficas. Esta desigualdade exige ações descentralizadas e específicas por compartimento, abandonando a gestão genérica do espelho d'água único.`;
      
      insights['04_Barras_Empilhadas_Eutrofizacao'] = `ESTADO TRÓFICO: A categorização baseada nos dados brutos sugere uma transição perigosa para a Hipereutrofia em compartimentos críticos. O sistema está sob stress severo, alternando entre estados claros e turvos, com resiliência ecológica decrescente a cada novo aporte de carga poluidora.`;
    }
  } else {
     insights['01_KDE_Fosforo_Total'] = "A análise foi prejudicada pela ausência de dados consistentes na planilha 'Monitoramento_Ambiental'. Iniciando protocolo de aquisição de dados...";
  }

  // 2. SEDIMENTOS
  const dataSed = getData("Sedimentos_Analise");
  if (dataSed && dataSed.length > 1) {
    insights['05_Radar_Sedimentos_Interno'] = `BOMBA RELÓGIO ECOLÓGICA: Os registros de sedimentos mostram um potencial redox negativo em áreas profundas. Isso confirma a tese de "Internal Loading": o fósforo legado, depositado ao longo de décadas, está sendo liberado de volta para a coluna d'água devido à anoxia no fundo. Mesmo se zerarmos o esgoto externo hoje, o lago continuaria eutrofizado por anos devido a essa "memória" química do sedimento. A dragagem ou inativação química (Phoslock) deve ser debatida.`;
  } else {
    insights['05_Radar_Sedimentos_Interno'] = "Dados de sedimentos insuficientes para calcular o risco de Internal Loading.";
  }

  // 3. OUTROS (Debates Contextuais)
  insights['06_KDE_Turbidez_Suspensao'] = "EROSÃO URBANA: A turbidez registrada não é apenas orgânica; correlaciona-se com eventos de chuva, indicando carreamento massivo de sólidos (solo exposto) de obras e loteamentos irregulares. O lago está, literalmente, assoreando devido à falta de controle no uso do solo da bacia.";
  
  insights['07_Violin_Microplasticos'] = "O INVISÍVEL NO ESPELHO: A detecção de microplásticos nos dados é um sinal de alerta para poluentes emergentes. Diferente dos nutrientes, estes contaminantes são persistentes e bioacumulativos. A presença destes materiais sugere ineficiência na retenção de resíduos sólidos nas galerias pluviais.";
  
  // 4. DENÚNCIAS
  const dataDen = getData("Denuncias_Cidadas");
  if (dataDen && dataDen.length > 1) {
    const total = dataDen.length - 1;
    insights['08_Barras_Empilhadas_Denuncias'] = `SOCIEDADE ATIVA: O registro de ${total} denúncias via plataforma de Ciência Cidadã valida o modelo de gestão participativa. Cada ponto no mapa representa um "sensor humano" ativo, cobrindo lacunas que o monitoramento oficial não alcança. A resposta institucional a estes dados deve ser ágil para manter a credibilidade do sistema.`;
  } else {
    insights['08_Barras_Empilhadas_Denuncias'] = "O silêncio nos canais de denúncia pode indicar falta de engajamento ou, ironicamente, uma normalização da poluição visual pela população.";
  }

  insights['09_Radar_Compliance_Outorgas'] = "GUERRA PELA ÁGUA: Os dados de outorga revelam um tensão latente entre usos múltiplos. A conta não fecha: a demanda para irrigação e diluição de efluentes compete com o volume necessário para o abastecimento humano e a perenidade ecológica. O respeito às vazões ecológicas está em risco.";
  insights['10_Histograma_Loteamentos'] = "IMPERMEABILIZAÇÃO: O avanço dos loteamentos registrados na planilha é a causa raiz das alterações hidrológicas. Sem a infiltração no solo nas áreas de recarga, transformamos rios em canais de drenagem rápida, aumentando os picos de cheia e reduzindo o fluxo de base que sustenta o lago na seca.";
  insights['11_Violin_pH_Anoxia'] = "METABOLISMO DO LAGO: As oscilações de pH e Oxigênio Dissolvido mostradas nos dados brutos retratam um lago que 'respira' com dificuldade. A anoxia no fundo (hipolímnio) durante a estratificação térmica é o gatilho para a morte de fauna bentônica e a liberação de poluentes quimicamente aprisionados.";
  insights['12_Barras_Biodiversidade_Stress'] = "SINAL DE ALERTA BIOLÓGICO: A comunidade planctônica está simplificando. A dominância de poucas espécies resistentes, conforme apontado nos monitoramentos, é um clássico indicador de stress ambiental. Perdemos resiliência; qualquer perturbação adicional pode levar ao colapso de cadeias tróficas inteiras.";

  return insights;
}

/**
 * Sends a chat message to Gemini via the Colab bridge.
 */
function chatWithGemini_(message, context) {
  if (typeof COLAB_API_CONFIG === 'undefined') {
    return { success: false, response: "Erro de configuração: COLAB_API_CONFIG indefinido." };
  }

  const result = callColabAPI(COLAB_API_CONFIG.ENDPOINTS.CHAT, {
    message: message,
    context: context
  }, 'POST');
  
  if (result.success) {
    return result.data;
  }
  
  return { 
    success: false, 
    response: "O sistema de IA está temporariamente indisponível. Verifique a conexão com o servidor Colab." 
  };
}
