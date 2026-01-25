/**
 * @file SedimentosMicroplasticosService.gs
 * @project LAGO_PARANOA - Recursos Hídricos
 * @category sedimentologia
 * @tags sedimentos, microplasticos, antropoceno, carga-interna
 * @architecture Scientific Data Processing Engine
 * @description Análise geoquímica de sedimentos e contaminantes do Antropoceno.
 * Corresponde aos gráficos 6-8 do colab.py (microplásticos, oxigênio, carga interna).
 * @context Relatorio.md - Seções 4.1 (Bomba Interna) e 6.1 (Marcadores Antropoceno)
 */

// ============================================================================
// CONSTANTES CIENTÍFICAS - SEDIMENTOLOGIA
// ============================================================================

const SEDIMENTO_CONSTANTS = {
  // Taxas de sedimentação média (cm/ano) - baseado em estudos do Lago Paranoá
  TAXA_SEDIMENTACAO: 0.5, // ~0.5 cm/ano (Cronologia Pb-210)
  
  // Limites de contaminação por microplásticos
  MICROPLASTICOS: {
    BACKGROUND: 100,          // partículas/kg sedimento seco (pré-industrial)
    MODERADO: 500,           // limite de atenção
    ALTO: 1000,              // contaminação alta
    CRITICO: 2500,           // contaminação crítica
    UNIDADE: 'partículas/kg sedimento seco'
  },
  
  // Parâmetros geoquímicos para carga interna de P
  GEOQUIMICA: {
    FOSFORO_SEDIMENTO_ALTO: 800,   // mg/kg - Risco de liberação
    NITROGENIO_SEDIMENTO_ALTO: 5000, // mg/kg
    FERRO_OXIDO_CRITICO: 0.5,      // % - Se Fe(III) < 0.5%, P não adsorve
    OXIGENO_ANOXIA: 2.0,           // mg/L - Limite de anoxia
    TEMPERATURA_CRITICA: 25        // °C - Acelera liberação
  },
  
  // Profundidades de amostragem típicas (cm)
  PROFUNDIDADES_PADRAO: [0, 5, 10, 15, 20, 25, 30, 35, 40],
  
  // Marcadores estratigráficos do Antropoceno no Paranoá
  MARCADORES_ANTROPOCENO: {
    '1959': 'Construção Brasília - Início urbanização',
    '1978': 'Pico crise ambiental - Eutrofização severa',
    '1993': 'Início operação ETEs Sul/Norte',
    '2002': 'Introdução massiva embalagens plásticas',
    '2017': 'Programa despoluição e dragagem'
  }
};

// ============================================================================
// 1. ANÁLISE DE MICROPLÁSTICOS
// ============================================================================

/**
 * Analisa perfil vertical de microplásticos nos sedimentos.
 * Para grafico_06_microplasticos.png do colab.py.
 * 
 * @param {Array<Object>} amostras - Array de {profundidade: number, concentracao: number, tipo: string[]}
 * @return {Object} Análise completa com interpretação geológica
 */
function analisarPerfilMicroplasticos(amostras) {
  if (!amostras || amostras.length === 0) {
    amostras = gerarDadosMicroplasticosSimulados_();
  }
  
  // Ordenar por profundidade (superfície primeiro)
  const ordenadas = amostras.sort((a, b) => a.profundidade - b.profundidade);
  
  // Estatísticas gerais
  const concentracoes = ordenadas.map(a => a.concentracao);
  const maxConcentracao = Math.max(...concentracoes);
  const minConcentracao = Math.min(...concentracoes);
  const mediaConcentracao = concentracoes.reduce((a, b) => a + b, 0) / concentracoes.length;
  
  // Análise estratigráfica
  const analiseEstratigraficaResult = analisarEstratigrafia_(ordenadas);
  
  // Identificar a transição pré/pós plástico
  const transicaoPlastico = identificarTransicaoPlastico_(ordenadas);
  
  // Determinar risco por camada
  const riscosPorCamada = ordenadas.map(a => ({
    profundidade: a.profundidade,
    concentracao: a.concentracao,
    risco: classificarRiscoMicroplastico_(a.concentracao),
    dataEstimada: estimarDataCamada_(a.profundidade),
    tiposDominantes: a.tipos || ['polietileno', 'polipropileno']
  }));
  
  // Calcular tendência histórica
  const tendencia = calcularTendenciaMicroplasticos_(ordenadas);
  
  return {
    resumo: {
      totalCamadas: ordenadas.length,
      concentracaoMaxima: maxConcentracao,
      concentracaoMinima: minConcentracao,
      concentracaoMedia: Math.round(mediaConcentracao),
      unidade: SEDIMENTO_CONSTANTS.MICROPLASTICOS.UNIDADE
    },
    
    analiseEstratigrafica: analiseEstratigraficaResult,
    transicaoPlastico: transicaoPlastico,
    riscosPorCamada: riscosPorCamada,
    tendencia: tendencia,
    
    conclusao: gerarConclusaoMicroplasticos_(ordenadas, transicaoPlastico),
    
    dadosParaGrafico: {
      profundidades: ordenadas.map(a => a.profundidade),
      concentracoes: ordenadas.map(a => a.concentracao),
      limiteContaminacao: SEDIMENTO_CONSTANTS.MICROPLASTICOS.ALTO
    },
    
    timestamp: new Date().toISOString()
  };
}

function analisarEstratigrafia_(amostras) {
  const camadas = [];
  
  for (let i = 0; i < amostras.length; i++) {
    const prof = amostras[i].profundidade;
    const conc = amostras[i].concentracao;
    
    let caracterizacao;
    let periodoHistorico;
    
    // Correlacionar profundidade com período histórico
    if (prof <= 5) {
      periodoHistorico = '2015-Presente';
      caracterizacao = 'Camada superficial ativa - deposição recente';
    } else if (prof <= 15) {
      periodoHistorico = '1995-2015';
      caracterizacao = 'Era do consumo de massa - plásticos onipresentes';
    } else if (prof <= 25) {
      periodoHistorico = '1975-1995';
      caracterizacao = 'Transição - início dos polímeros descartáveis';
    } else if (prof <= 35) {
      periodoHistorico = '1959-1975';
      caracterizacao = 'Primórdios de Brasília - baixa contaminação';
    } else {
      periodoHistorico = 'Pré-1959';
      caracterizacao = 'Sedimento pré-Brasília - linha de base natural';
    }
    
    camadas.push({
      profundidade: prof,
      concentracao: conc,
      periodoHistorico: periodoHistorico,
      caracterizacao: caracterizacao,
      marcadores: identificarMarcadoresNaProfundidade_(prof)
    });
  }
  
  return camadas;
}

function identificarMarcadoresNaProfundidade_(profundidade) {
  const marcadores = [];
  const taxa = SEDIMENTO_CONSTANTS.TAXA_SEDIMENTACAO;
  const anoAtual = new Date().getFullYear();
  const anoEstimado = Math.round(anoAtual - (profundidade / taxa));
  
  for (const [ano, evento] of Object.entries(SEDIMENTO_CONSTANTS.MARCADORES_ANTROPOCENO)) {
    if (Math.abs(parseInt(ano) - anoEstimado) <= 5) {
      marcadores.push({ ano: ano, evento: evento });
    }
  }
  
  return marcadores;
}

function identificarTransicaoPlastico_(amostras) {
  // Buscar onde a concentração cai abaixo do nível de background
  for (let i = 0; i < amostras.length - 1; i++) {
    if (amostras[i].concentracao > SEDIMENTO_CONSTANTS.MICROPLASTICOS.BACKGROUND * 2 &&
        amostras[i + 1].concentracao < SEDIMENTO_CONSTANTS.MICROPLASTICOS.BACKGROUND * 2) {
      return {
        profundidade: amostras[i].profundidade,
        dataEstimada: estimarDataCamada_(amostras[i].profundidade),
        descricao: 'Horizonte de transição para Era do Plástico',
        significado: 'Marcador estratigráfico do Antropoceno'
      };
    }
  }
  
  return {
    profundidade: 30,
    dataEstimada: '~1965',
    descricao: 'Transição gradual - sem limite abrupto',
    significado: 'Introdução progressiva de polímeros sintéticos'
  };
}

function classificarRiscoMicroplastico_(concentracao) {
  const limites = SEDIMENTO_CONSTANTS.MICROPLASTICOS;
  
  if (concentracao >= limites.CRITICO) {
    return { nivel: 'CRÍTICO', cor: '#FF0000', impacto: 'Bioacumulação na cadeia trófica provável' };
  }
  if (concentracao >= limites.ALTO) {
    return { nivel: 'ALTO', cor: '#FF6600', impacto: 'Ingestão por organismos bentônicos confirmada' };
  }
  if (concentracao >= limites.MODERADO) {
    return { nivel: 'MODERADO', cor: '#FFCC00', impacto: 'Contaminação detectável, monitorar' };
  }
  return { nivel: 'BAIXO', cor: '#00CC00', impacto: 'Níveis próximos ao background natural' };
}

function estimarDataCamada_(profundidade) {
  const anoAtual = new Date().getFullYear();
  const taxa = SEDIMENTO_CONSTANTS.TAXA_SEDIMENTACAO;
  const anosAtras = profundidade / taxa;
  return `~${Math.round(anoAtual - anosAtras)}`;
}

function calcularTendenciaMicroplasticos_(amostras) {
  // Comparar camadas superiores com inferiores
  const superior = amostras.filter(a => a.profundidade <= 10);
  const inferior = amostras.filter(a => a.profundidade >= 30);
  
  const mediaSuperior = superior.reduce((a, b) => a + b.concentracao, 0) / superior.length || 0;
  const mediaInferior = inferior.reduce((a, b) => a + b.concentracao, 0) / inferior.length || 0;
  
  const fatorAumento = mediaInferior > 0 ? mediaSuperior / mediaInferior : Infinity;
  
  return {
    fatorAumento: Math.round(fatorAumento * 10) / 10,
    interpretacao: fatorAumento > 10 
      ? 'Aumento exponencial - acumulação acelerada'
      : fatorAumento > 3
        ? 'Aumento significativo ao longo das décadas'
        : 'Contaminação estável ou em declínio',
    projecao: mediaSuperior * 1.5,
    projecaoAno: new Date().getFullYear() + 10
  };
}

function gerarConclusaoMicroplasticos_(amostras, transicao) {
  const superficial = amostras[0]?.concentracao || 0;
  const limites = SEDIMENTO_CONSTANTS.MICROPLASTICOS;
  
  let conclusao = '📋 CONCLUSÃO DA ANÁLISE DE MICROPLÁSTICOS:\n\n';
  
  if (superficial >= limites.CRITICO) {
    conclusao += '🚨 CONTAMINAÇÃO CRÍTICA detectada nas camadas superficiais.\n';
    conclusao += 'Os níveis de microplásticos excedem significativamente os limites seguros.\n';
    conclusao += 'Recomenda-se avaliação de bioacumulação na fauna aquática.\n';
  } else if (superficial >= limites.ALTO) {
    conclusao += '⚠️ CONTAMINAÇÃO ALTA identificada no perfil sedimentar.\n';
    conclusao += 'O registro estratigráfico confirma acumulação crescente desde ~1960.\n';
  } else {
    conclusao += '✅ Níveis dentro de parâmetros aceitáveis.\n';
  }
  
  conclusao += `\n📍 Horizonte de transição plástico: ${transicao.profundidade}cm (${transicao.dataEstimada})\n`;
  conclusao += 'Este marcador representa a assinatura geológica do Antropoceno no Lago Paranoá.';
  
  return conclusao;
}

function gerarDadosMicroplasticosSimulados_() {
  // Dados baseados em estudos de lagos urbanos brasileiros
  return [
    { profundidade: 0, concentracao: 1250, tipos: ['polietileno', 'poliéster', 'polipropileno'] },
    { profundidade: 5, concentracao: 980, tipos: ['polietileno', 'polipropileno'] },
    { profundidade: 10, concentracao: 720, tipos: ['polietileno', 'PVC'] },
    { profundidade: 15, concentracao: 480, tipos: ['polietileno'] },
    { profundidade: 20, concentracao: 280, tipos: ['polietileno'] },
    { profundidade: 25, concentracao: 150, tipos: ['polietileno'] },
    { profundidade: 30, concentracao: 80, tipos: ['nylon'] },
    { profundidade: 35, concentracao: 45, tipos: [] },
    { profundidade: 40, concentracao: 20, tipos: [] }
  ];
}

// ============================================================================
// 2. CARGA INTERNA DE NUTRIENTES (BOMBA INTERNA)
// ============================================================================

/**
 * Calcula a carga interna de fósforo liberada dos sedimentos.
 * Para grafico_08_carga_interna.png do colab.py.
 * Baseado em: Relatorio.md - Seção 4.1 "Bomba Interna" de Nutrientes
 * 
 * @param {Object} params - Parâmetros do sistema
 * @return {Object} Balanço de fósforo e projeções
 */
function calcularCargaInterna(params) {
  params = params || getParametrosPadrao_();
  
  const {
    fosforoSedimento,     // mg/kg - Concentração de P no sedimento
    oxigenioFundo,        // mg/L - OD no hipolímnio
    temperaturaFundo,     // °C
    areaHipoliminio,      // m² - Área do hipolímnio em contato com sedimento
    cargaExterna,         // ton/ano - Aporte pelos rios
    profundidadeMedia     // m
  } = params;
  
  // Determinar se há anoxia
  const isAnoxic = oxigenioFundo < SEDIMENTO_CONSTANTS.GEOQUIMICA.OXIGENO_ANOXIA;
  
  // Taxa de liberação base (mg P/m²/dia) - condições aeróbicas
  let taxaLiberacao = 0.5;
  
  if (isAnoxic) {
    // Em condições anóxicas, Fe(III) reduz a Fe(II), liberando P adsorvido
    // Contexto: Seção 4.1 - "Dissociative reduction of Fe oxides"
    taxaLiberacao = calculateAnoxicRelease_(fosforoSedimento, temperaturaFundo);
  }
  
  // Carga interna diária (kg/dia)
  const cargaDiaria = (taxaLiberacao * areaHipoliminio) / 1000000;
  
  // Período típico de estratificação no DF (dias/ano)
  const diasEstratificacao = estimarDiasEstratificacao_(profundidadeMedia);
  
  // Carga interna anual (ton/ano)
  const cargaInternaAnual = (cargaDiaria * diasEstratificacao) / 1000;
  
  // Carga total (interna + externa)
  const cargaTotal = cargaExterna + cargaInternaAnual;
  
  // Proporção da carga interna
  const proporcaoInterna = (cargaInternaAnual / cargaTotal) * 100;
  
  // Análise do paradoxo do Lago Paranoá
  const paradoxo = analisarParadoxoRecuperacao_(cargaExterna, cargaInternaAnual);
  
  // Projeção e recomendações
  const projecao = projetarRecuperacao_(cargaInternaAnual, cargaExterna, fosforoSedimento);
  
  return {
    diagnostico: {
      condicoesHipolimnio: isAnoxic ? 'ANÓXICO' : 'ÓXICO',
      taxaLiberacao: Math.round(taxaLiberacao * 100) / 100,
      unidadeTaxa: 'mg P/m²/dia',
      diasEstratificacao: diasEstratificacao
    },
    
    balanco: {
      cargaExterna: Math.round(cargaExterna * 10) / 10,
      cargaInterna: Math.round(cargaInternaAnual * 10) / 10,
      cargaTotal: Math.round(cargaTotal * 10) / 10,
      proporcaoInterna: Math.round(proporcaoInterna) + '%',
      unidade: 'ton P/ano'
    },
    
    paradoxoRecuperacao: paradoxo,
    
    projecao: projecao,
    
    dadosParaGrafico: gerarDadosHistoricosCarga_(cargaExterna, cargaInternaAnual),
    
    recomendacoes: gerarRecomendacoesCargaInterna_(isAnoxic, proporcaoInterna, fosforoSedimento),
    
    referencias: {
      secaoRelatorio: '4.1 - Histerese e a "Bomba Interna" de Nutrientes',
      conceito: 'Internal P Loading from anoxic sediments'
    }
  };
}

function calculateAnoxicRelease_(fosforoSedimento, temperatura) {
  // Modelo empírico baseado em Søndergaard et al. (2003) e dados tropicais
  // Taxa base para lagos eutróficos tropicais: 2-10 mg/m²/dia
  
  const baseRate = 2.0;
  
  // Fator de concentração de P no sedimento
  const factorP = fosforoSedimento / SEDIMENTO_CONSTANTS.GEOQUIMICA.FOSFORO_SEDIMENTO_ALTO;
  
  // Fator de temperatura (Q10 ~ 2)
  const factorTemp = Math.pow(2, (temperatura - 20) / 10);
  
  // Taxa ajustada
  const taxaAjustada = baseRate * Math.min(factorP, 2.5) * factorTemp;
  
  // Log de alerta
  if (taxaAjustada > 5) {
    console.warn(`⚠️ ALERTA: Taxa de liberação de P alta: ${taxaAjustada.toFixed(1)} mg/m²/dia`);
  }
  
  return taxaAjustada;
}

function estimarDiasEstratificacao_(profundidade) {
  // Lagos rasos (<10m) no cerrado: ~120-180 dias
  // Lagos mais profundos: 180-240 dias
  
  if (profundidade < 8) return 150;
  if (profundidade < 15) return 180;
  return 210;
}

function analisarParadoxoRecuperacao_(cargaExterna, cargaInterna) {
  // Paradoxo: Mesmo com redução da carga externa, o lago não melhora
  // devido à liberação contínua do "estoque" no sedimento
  
  const proporcaoInterna = cargaInterna / (cargaExterna + cargaInterna);
  
  if (proporcaoInterna > 0.5) {
    return {
      detectado: true,
      severidade: 'ALTA',
      explicacao: 'A carga interna supera a carga externa. O lago está "devolvendo" o fósforo acumulado das décadas anteriores.',
      implicacao: 'Reduzir apenas a carga externa terá efeito limitado. É necessário intervir nos sedimentos.',
      solucoesPotenciais: [
        'Dragagem seletiva de sedimentos (custoso, usado em 2017)',
        'Injeção de oxigênio no hipolímnio (Hypolimnetic aeration)',
        'Imobilização química de P com sais de alumínio ou ferro',
        'Biomanipulação da cadeia trófica'
      ]
    };
  }
  
  return {
    detectado: proporcaoInterna > 0.3,
    severidade: proporcaoInterna > 0.3 ? 'MODERADA' : 'BAIXA',
    explicacao: 'Carga externa ainda domina o balanço de nutrientes.',
    implicacao: 'Foco deve ser na redução de aportes externos (ETEs, poluição difusa).'
  };
}

function projetarRecuperacao_(cargaInterna, cargaExterna, fosforoSedimento) {
  // Tempo médio para exaustão do estoque de P no sedimento
  // Depende da taxa de liberação e da capacidade de renovação
  
  const estoqueTotal = fosforoSedimento * 50000; // kg (assumindo área x profundidade ativa)
  const perdaAnual = cargaInterna * 1000; // kg/ano
  
  const anosParaExaustao = estoqueTotal / perdaAnual;
  
  // Cenários
  const cenarios = {
    semIntervencao: {
      anosRecuperacao: Math.round(anosParaExaustao * 1.5),
      descricao: 'Esperar exaustão natural do estoque de P'
    },
    comReducaoExterna50: {
      anosRecuperacao: Math.round(anosParaExaustao * 0.8),
      descricao: 'Reduzir carga externa em 50%'
    },
    comDragagem: {
      anosRecuperacao: Math.round(anosParaExaustao * 0.3),
      descricao: 'Dragagem + redução de carga externa'
    }
  };
  
  return {
    anosParaExaustaoNatural: Math.round(anosParaExaustao),
    cenarios: cenarios,
    recomendacao: anosParaExaustao > 20 
      ? 'Intervenção ativa recomendada (dragagem ou tratamento)'
      : 'Monitoramento com redução de carga externa pode ser suficiente'
  };
}

function gerarDadosHistoricosCarga_(cargaExternaAtual, cargaInternaAtual) {
  // Simular evolução histórica do balanço de P
  const anos = ['2020', '2021', '2022', '2023', '2024', '2025'];
  
  // Tendência: carga externa diminuindo, interna aumentando
  const dados = anos.map((ano, i) => {
    const fatorExterno = 1 - (i * 0.05); // Redução gradual
    const fatorInterno = 1 + (i * 0.08); // Aumento gradual
    
    return {
      ano: ano,
      cargaExterna: Math.round(cargaExternaAtual * fatorExterno * 10) / 10,
      cargaInterna: Math.round(cargaInternaAtual * fatorInterno * 10) / 10,
      cargaTotal: Math.round((cargaExternaAtual * fatorExterno + cargaInternaAtual * fatorInterno) * 10) / 10
    };
  });
  
  return dados;
}

function gerarRecomendacoesCargaInterna_(isAnoxic, proporcaoInterna, fosforoSedimento) {
  const recomendacoes = [];
  
  if (isAnoxic) {
    recomendacoes.push({
      prioridade: 1,
      acao: 'Oxigenação do hipolímnio',
      descricao: 'Instalar sistema de aeração para prevenir condições anóxicas',
      eficaciaEstimada: '40-60% redução de liberação de P'
    });
  }
  
  if (proporcaoInterna > 50) {
    recomendacoes.push({
      prioridade: 1,
      acao: 'Avaliação de intervenção nos sedimentos',
      descricao: 'Considerar dragagem ou tratamento químico (capeamento)',
      eficaciaEstimada: '70-90% se combinado com redução de carga externa'
    });
  }
  
  if (fosforoSedimento > SEDIMENTO_CONSTANTS.GEOQUIMICA.FOSFORO_SEDIMENTO_ALTO) {
    recomendacoes.push({
      prioridade: 2,
      acao: 'Monitoramento intensivo do sedimento',
      descricao: 'Estabelecer programa de análise geoquímica semestral',
      eficaciaEstimada: 'Permite adequar estratégia de manejo'
    });
  }
  
  recomendacoes.push({
    prioridade: 3,
    acao: 'Manutenção da redução de carga externa',
    descricao: 'Continuar fiscalização de ETEs e controle de erosão',
    eficaciaEstimada: 'Essencial para recuperação de longo prazo'
  });
  
  return recomendacoes;
}

function getParametrosPadrao_() {
  return {
    fosforoSedimento: 800,      // mg/kg
    oxigenioFundo: 1.5,         // mg/L (anóxico)
    temperaturaFundo: 24,       // °C
    areaHipoliminio: 15000000,  // m² (~15 km²)
    cargaExterna: 30,           // ton/ano (após melhorias ETEs)
    profundidadeMedia: 12       // m
  };
}

// ============================================================================
// 3. PERFIL DE OXIGÊNIO POR PROFUNDIDADE
// ============================================================================

/**
 * Analisa perfil vertical de oxigênio dissolvido.
 * Para grafico_07_oxigenio_profundidade.png do colab.py.
 * 
 * @param {Array<Object>} perfis - Perfis de diferentes zonas {zona: string, dados: [{prof, od}]}
 * @return {Object} Análise de estratificação e riscos
 */
function analisarPerfilOxigenio(perfis) {
  if (!perfis) {
    perfis = gerarPerfisOxigenioPadrao_();
  }
  
  const analises = perfis.map(perfil => {
    const dados = perfil.dados;
    
    // Identificar termoclina/oxiclina
    const camadas = identificarCamadas_(dados);
    
    // Calcular déficit de oxigênio
    const deficit = calcularDeficitOxigenio_(dados);
    
    // Avaliar risco de anoxia
    const riscoAnoxia = avaliarRiscoAnoxia_(dados, camadas);
    
    return {
      zona: perfil.zona,
      camadas: camadas,
      deficit: deficit,
      riscoAnoxia: riscoAnoxia,
      od_superficie: dados[0]?.od || 0,
      od_fundo: dados[dados.length - 1]?.od || 0,
      classificacao: classificarZonaPorOD_(dados)
    };
  });
  
  return {
    perfis: analises,
    estratificacaoGeral: avaliarEstratificacaoGeral_(analises),
    alertas: gerarAlertasOxigenio_(analises),
    
    dadosParaGrafico: {
      zonas: perfis.map(p => p.zona),
      profundidades: perfis[0]?.dados.map(d => d.profundidade) || [],
      series: perfis.map(p => ({
        nome: p.zona,
        valores: p.dados.map(d => d.od)
      })),
      limites: {
        anoxia: 2,
        classe2: 5
      }
    },
    
    timestamp: new Date().toISOString()
  };
}

function identificarCamadas_(dados) {
  const camadas = {
    epilimnio: { inicio: 0, fim: 0, odMedio: 0 },
    metalimnio: { inicio: 0, fim: 0, gradiente: 0 },
    hipolimnio: { inicio: 0, fim: 0, odMedio: 0 }
  };
  
  // Buscar gradiente máximo (termoclina/oxiclina)
  let maxGradiente = 0;
  let profGradienteMax = 0;
  
  for (let i = 0; i < dados.length - 1; i++) {
    const gradiente = (dados[i].od - dados[i + 1].od) / 
                      (dados[i + 1].profundidade - dados[i].profundidade);
    
    if (gradiente > maxGradiente) {
      maxGradiente = gradiente;
      profGradienteMax = dados[i].profundidade;
    }
  }
  
  // Definir limites das camadas
  camadas.epilimnio.fim = profGradienteMax > 0 ? profGradienteMax : 4;
  camadas.metalimnio.inicio = camadas.epilimnio.fim;
  camadas.metalimnio.fim = camadas.metalimnio.inicio + 4;
  camadas.metalimnio.gradiente = maxGradiente;
  camadas.hipolimnio.inicio = camadas.metalimnio.fim;
  camadas.hipolimnio.fim = dados[dados.length - 1]?.profundidade || 20;
  
  // Calcular OD médio por camada
  camadas.epilimnio.odMedio = calcularODMedioCamada_(dados, 0, camadas.epilimnio.fim);
  camadas.hipolimnio.odMedio = calcularODMedioCamada_(dados, camadas.hipolimnio.inicio, camadas.hipolimnio.fim);
  
  return camadas;
}

function calcularODMedioCamada_(dados, profInicio, profFim) {
  const camada = dados.filter(d => d.profundidade >= profInicio && d.profundidade <= profFim);
  if (camada.length === 0) return 0;
  return Math.round(camada.reduce((a, b) => a + b.od, 0) / camada.length * 10) / 10;
}

function calcularDeficitOxigenio_(dados) {
  // Deficit = OD saturação - OD atual (integrado na coluna d'água)
  const odSaturacao = 8.5; // mg/L a ~24°C
  
  let deficit = 0;
  for (let i = 0; i < dados.length - 1; i++) {
    const espessura = dados[i + 1].profundidade - dados[i].profundidade;
    const odMedio = (dados[i].od + dados[i + 1].od) / 2;
    deficit += (odSaturacao - odMedio) * espessura;
  }
  
  return {
    valor: Math.round(deficit * 10) / 10,
    unidade: 'g O₂/m²',
    interpretacao: deficit > 30 ? 'ALTO' : deficit > 15 ? 'MODERADO' : 'BAIXO'
  };
}

function avaliarRiscoAnoxia_(dados, camadas) {
  const odFundo = dados[dados.length - 1]?.od || 0;
  const limite = SEDIMENTO_CONSTANTS.GEOQUIMICA.OXIGENO_ANOXIA;
  
  if (odFundo < limite) {
    return {
      nivel: 'CRÍTICO',
      atual: true,
      odFundo: odFundo,
      mensagem: 'Condições anóxicas ATIVAS no hipolímnio',
      consequencias: [
        'Liberação de P do sedimento (Carga Interna)',
        'Liberação de amônia (NH4+)',
        'Acúmulo de H2S (gás sulfídrico)',
        'Mortandade de peixes bentônicos'
      ]
    };
  }
  
  if (odFundo < 4) {
    return {
      nivel: 'ALTO',
      atual: false,
      odFundo: odFundo,
      mensagem: 'Risco iminente de anoxia',
      diasEstimados: Math.round((odFundo - limite) / 0.3)
    };
  }
  
  return {
    nivel: 'BAIXO',
    atual: false,
    odFundo: odFundo,
    mensagem: 'Coluna d\'água bem oxigenada'
  };
}

function classificarZonaPorOD_(dados) {
  const odSuperficie = dados[0]?.od || 0;
  const odFundo = dados[dados.length - 1]?.od || 0;
  
  if (odFundo >= 5 && odSuperficie >= 7) return 'OLIGOTRÓFICO';
  if (odFundo >= 3 && odSuperficie >= 6) return 'MESOTRÓFICO';
  if (odFundo >= 1) return 'EUTRÓFICO';
  return 'HIPEREUTRÓFICO';
}

function avaliarEstratificacaoGeral_(analises) {
  const estratificadas = analises.filter(a => 
    a.camadas.metalimnio.gradiente > 0.5 || 
    a.od_superficie - a.od_fundo > 3
  );
  
  return {
    zonasEstratificadas: estratificadas.map(a => a.zona),
    proporcao: Math.round((estratificadas.length / analises.length) * 100) + '%',
    periodo: 'Típico do período chuvoso (out-mar) no Cerrado'
  };
}

function gerarAlertasOxigenio_(analises) {
  const alertas = [];
  
  analises.forEach(a => {
    if (a.riscoAnoxia.nivel === 'CRÍTICO') {
      alertas.push({
        zona: a.zona,
        tipo: 'ANOXIA_ATIVA',
        mensagem: `🚨 ${a.zona}: Anoxia detectada (OD fundo: ${a.od_fundo} mg/L)`,
        urgencia: 'IMEDIATA'
      });
    }
    if (a.deficit.interpretacao === 'ALTO') {
      alertas.push({
        zona: a.zona,
        tipo: 'DEFICIT_ALTO',
        mensagem: `⚠️ ${a.zona}: Déficit de O₂ elevado (${a.deficit.valor} ${a.deficit.unidade})`,
        urgencia: 'MONITORAR'
      });
    }
  });
  
  return alertas;
}

function gerarPerfisOxigenioPadrao_() {
  return [
    {
      zona: 'LAGO_NORTE',
      dados: [
        { profundidade: 0, od: 8.5 }, { profundidade: 2, od: 8.2 },
        { profundidade: 4, od: 7.8 }, { profundidade: 6, od: 7.2 },
        { profundidade: 8, od: 6.5 }, { profundidade: 10, od: 5.8 },
        { profundidade: 12, od: 5.2 }, { profundidade: 14, od: 4.5 },
        { profundidade: 16, od: 3.8 }, { profundidade: 18, od: 3.2 },
        { profundidade: 20, od: 2.5 }
      ]
    },
    {
      zona: 'RIACHO_FUNDO',
      dados: [
        { profundidade: 0, od: 6.5 }, { profundidade: 2, od: 5.8 },
        { profundidade: 4, od: 4.5 }, { profundidade: 6, od: 3.2 },
        { profundidade: 8, od: 2.5 }, { profundidade: 10, od: 1.8 },
        { profundidade: 12, od: 1.2 }, { profundidade: 14, od: 0.8 },
        { profundidade: 16, od: 0.5 }, { profundidade: 18, od: 0.3 },
        { profundidade: 20, od: 0.2 }
      ]
    },
    {
      zona: 'BARRAGEM',
      dados: [
        { profundidade: 0, od: 9.0 }, { profundidade: 2, od: 8.8 },
        { profundidade: 4, od: 8.5 }, { profundidade: 6, od: 8.0 },
        { profundidade: 8, od: 7.5 }, { profundidade: 10, od: 7.0 },
        { profundidade: 12, od: 6.5 }, { profundidade: 14, od: 6.0 },
        { profundidade: 16, od: 5.5 }, { profundidade: 18, od: 5.0 },
        { profundidade: 20, od: 4.5 }
      ]
    }
  ];
}

// ============================================================================
// 4. ENDPOINTS PARA COLAB.PY
// ============================================================================

/**
 * Fornece dados de microplásticos para o colab.py.
 */
function getMicroplasticosDataForColab() {
  const analise = analisarPerfilMicroplasticos();
  return analise.dadosParaGrafico;
}

/**
 * Fornece dados de carga interna para o colab.py.
 */
function getCargaInternaDataForColab() {
  const analise = calcularCargaInterna();
  return {
    balanco: analise.balanco,
    historico: analise.dadosParaGrafico,
    paradoxo: analise.paradoxoRecuperacao
  };
}

/**
 * Fornece perfis de oxigênio para o colab.py.
 */
function getOxigenioPerfilDataForColab() {
  const analise = analisarPerfilOxigenio();
  return analise.dadosParaGrafico;
}

// ============================================================================
// EXPORTS
// ============================================================================

const SedimentosService = {
  analisarPerfilMicroplasticos,
  calcularCargaInterna,
  analisarPerfilOxigenio,
  getMicroplasticosDataForColab,
  getCargaInternaDataForColab,
  getOxigenioPerfilDataForColab,
  CONSTANTS: SEDIMENTO_CONSTANTS
};
