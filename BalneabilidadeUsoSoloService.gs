/**
 * @file BalneabilidadeUsoSoloService.gs
 * @project LAGO_PARANOA - Recursos Hídricos
 * @category qualidade-agua
 * @tags balneabilidade, uso-solo, precipitacao, poluicao-difusa
 * @architecture Environmental Quality Assessment Engine
 * @description Avaliação de balneabilidade, impacto do uso do solo e poluição difusa.
 * Corresponde aos gráficos 9, 11 e 12 do colab.py.
 * @context CONAMA 274/2000 (Balneabilidade) e gestão de bacias hidrográficas
 */

// ============================================================================
// CONSTANTES - LEGISLAÇÃO E PARÂMETROS
// ============================================================================

const BALNEABILIDADE_CONSTANTS = {
  // CONAMA 274/2000 - Limites de Balneabilidade
  LIMITES_CONAMA_274: {
    EXCELENTE: {
      E_COLI: 200,           // UFC/100mL (80% das amostras)
      ENTEROCOCOS: 25,
      descricao: 'Própria para banho - Excelente'
    },
    MUITO_BOA: {
      E_COLI: 400,
      ENTEROCOCOS: 50,
      descricao: 'Própria para banho - Muito Boa'
    },
    SATISFATORIA: {
      E_COLI: 800,
      ENTEROCOCOS: 100,
      descricao: 'Própria para banho - Satisfatória'
    },
    IMPROPRIA: {
      E_COLI: Infinity,
      ENTEROCOCOS: Infinity,
      descricao: 'Imprópria para banho'
    }
  },
  
  // Critérios adicionais de interdição
  CRITERIOS_INTERDICAO: {
    valorMaximo: 2500,       // UFC/100mL - Valor máximo em qualquer amostra
    incidenciaAltaEstendida: 3,  // Semanas consecutivas impróprias
    floracaoCianobacterias: 50000, // células/mL
    phMinimo: 6.0,
    phMaximo: 9.0,
    residuosSolidos: true,
    oleoVisivel: true
  },
  
  // Pontos de monitoramento oficiais do Lago Paranoá
  PONTOS_MONITORAMENTO: [
    { id: 'PLS', nome: 'Pontão Lago Sul', lat: -15.826, lng: -47.876, tipo: 'PRAIA' },
    { id: 'P21', nome: 'Pier 21', lat: -15.811, lng: -47.873, tipo: 'PIER' },
    { id: 'PVP', nome: 'Prainha Vila Planalto', lat: -15.789, lng: -47.856, tipo: 'PRAIA' },
    { id: 'EDB', nome: 'Ermida Dom Bosco', lat: -15.798, lng: -47.827, tipo: 'PRAIA' },
    { id: 'GS', nome: 'Gilberto Salomão', lat: -15.807, lng: -47.854, tipo: 'PIER' },
    { id: 'DN', nome: 'Deck Norte', lat: -15.739, lng: -47.871, tipo: 'PIER' }
  ],
  
  // Uso do solo na bacia
  CATEGORIAS_USO_SOLO: {
    URBANO: { codigo: 'URB', impacto: 'ALTO', cor: '#7f8c8d' },
    AGRICOLA: { codigo: 'AGR', impacto: 'MEDIO', cor: '#f39c12' },
    VEGETACAO_NATIVA: { codigo: 'VEG', impacto: 'BAIXO', cor: '#27ae60' },
    SOLO_EXPOSTO: { codigo: 'EXP', impacto: 'ALTO', cor: '#e74c3c' },
    AGUA: { codigo: 'H2O', impacto: 'NENHUM', cor: '#3498db' }
  }
};

// ============================================================================
// 1. AVALIAÇÃO DE BALNEABILIDADE
// ============================================================================

/**
 * Avalia a balneabilidade de um ponto de monitoramento.
 * Para grafico_09_balneabilidade.png do colab.py.
 * Metodologia: CONAMA 274/2000
 * 
 * @param {string} pontoId - ID do ponto de monitoramento
 * @param {Array<Object>} amostras - Últimas 5 semanas de coletas
 * @return {Object} Classificação de balneabilidade
 */
function avaliarBalneabilidade(pontoId, amostras) {
  const ponto = BALNEABILIDADE_CONSTANTS.PONTOS_MONITORAMENTO.find(p => p.id === pontoId);
  
  if (!ponto) {
    return { erro: `Ponto ${pontoId} não encontrado` };
  }
  
  if (!amostras || amostras.length === 0) {
    amostras = gerarAmostrasPadrao_(pontoId);
  }
  
  // Análise estatística das últimas 5 semanas
  const valores = amostras.map(a => a.eColi);
  const percentil80 = calcularPercentil_(valores, 80);
  const valorMaximo = Math.max(...valores);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  
  // Classificação CONAMA 274/2000
  const classificacao = classificarBalneabilidade_(percentil80, valorMaximo);
  
  // Verificar critérios adicionais de interdição
  const criteriosInterdicao = verificarCriteriosInterdicao_(amostras);
  
  // Status final
  let statusFinal = classificacao.categoria;
  let motivoInterdicao = null;
  
  if (criteriosInterdicao.interditado) {
    statusFinal = 'IMPRÓPRIA';
    motivoInterdicao = criteriosInterdicao.motivos;
  }
  
  // Tendência
  const tendencia = analisarTendenciaBalneabilidade_(amostras);
  
  return {
    ponto: {
      id: pontoId,
      nome: ponto.nome,
      coordenadas: { lat: ponto.lat, lng: ponto.lng },
      tipo: ponto.tipo
    },
    
    estatisticas: {
      numeroAmostras: amostras.length,
      percentil80: Math.round(percentil80),
      valorMaximo: valorMaximo,
      media: Math.round(media),
      unidade: 'UFC/100mL (E. coli)'
    },
    
    classificacao: {
      categoria: statusFinal,
      categoriaOriginal: classificacao.categoria,
      descricao: classificacao.descricao,
      propriaParaBanho: classificacao.propria && !criteriosInterdicao.interditado,
      cor: classificacao.cor,
      emoji: classificacao.emoji
    },
    
    interdicao: {
      ativa: criteriosInterdicao.interditado,
      motivos: motivoInterdicao
    },
    
    tendencia: tendencia,
    
    recomendacoes: gerarRecomendacoesBalneabilidade_(statusFinal, tendencia),
    
    dataAvaliacao: new Date().toISOString(),
    metodo: 'CONAMA 274/2000'
  };
}

/**
 * Avalia todos os pontos de monitoramento.
 */
function avaliarTodosOsPontos() {
  const pontos = BALNEABILIDADE_CONSTANTS.PONTOS_MONITORAMENTO;
  const resultados = [];
  
  pontos.forEach(ponto => {
    const avaliacao = avaliarBalneabilidade(ponto.id);
    resultados.push({
      ponto: ponto.nome,
      proprio: avaliacao.classificacao.propriaParaBanho,
      categoria: avaliacao.classificacao.categoria,
      percentil80: avaliacao.estatisticas.percentil80
    });
  });
  
  // Estatísticas gerais
  const proprios = resultados.filter(r => r.proprio).length;
  const improprios = resultados.length - proprios;
  
  return {
    pontos: resultados,
    resumo: {
      totalPontos: resultados.length,
      proprios: proprios,
      improprios: improprios,
      percentualProprio: Math.round((proprios / resultados.length) * 100) + '%'
    },
    
    dadosParaGrafico: resultados.map(r => ({
      nome: r.ponto,
      proprio: r.proprio ? (100 - r.categoria === 'EXCELENTE' ? 90 : 70) : 0,
      improprio: r.proprio ? (r.categoria === 'EXCELENTE' ? 10 : 30) : 100
    })),
    
    timestamp: new Date().toISOString()
  };
}

function calcularPercentil_(valores, percentil) {
  const sorted = [...valores].sort((a, b) => a - b);
  const indice = Math.ceil((percentil / 100) * sorted.length) - 1;
  return sorted[Math.max(0, indice)];
}

function classificarBalneabilidade_(percentil80, valorMaximo) {
  const limites = BALNEABILIDADE_CONSTANTS.LIMITES_CONAMA_274;
  const maxPermitido = BALNEABILIDADE_CONSTANTS.CRITERIOS_INTERDICAO.valorMaximo;
  
  if (valorMaximo > maxPermitido) {
    return { 
      categoria: 'IMPRÓPRIA', 
      descricao: 'Valor máximo excedido', 
      propria: false,
      cor: '#DC2626',
      emoji: '🚫'
    };
  }
  
  if (percentil80 <= limites.EXCELENTE.E_COLI) {
    return { 
      categoria: 'EXCELENTE', 
      descricao: limites.EXCELENTE.descricao, 
      propria: true,
      cor: '#059669',
      emoji: '🏊'
    };
  }
  
  if (percentil80 <= limites.MUITO_BOA.E_COLI) {
    return { 
      categoria: 'MUITO_BOA', 
      descricao: limites.MUITO_BOA.descricao, 
      propria: true,
      cor: '#10B981',
      emoji: '✅'
    };
  }
  
  if (percentil80 <= limites.SATISFATORIA.E_COLI) {
    return { 
      categoria: 'SATISFATÓRIA', 
      descricao: limites.SATISFATORIA.descricao, 
      propria: true,
      cor: '#FBBF24',
      emoji: '⚠️'
    };
  }
  
  return { 
    categoria: 'IMPRÓPRIA', 
    descricao: limites.IMPROPRIA.descricao, 
    propria: false,
    cor: '#DC2626',
    emoji: '🚫'
  };
}

function verificarCriteriosInterdicao_(amostras) {
  const motivos = [];
  const criterios = BALNEABILIDADE_CONSTANTS.CRITERIOS_INTERDICAO;
  
  // Valor máximo excedido
  if (amostras.some(a => a.eColi > criterios.valorMaximo)) {
    motivos.push('Valor máximo de E. coli excedido (>2500 UFC/100mL)');
  }
  
  // Floração de cianobactérias
  if (amostras.some(a => a.cianobacterias > criterios.floracaoCianobacterias)) {
    motivos.push('Floração de cianobactérias detectada');
  }
  
  // pH fora dos limites
  if (amostras.some(a => a.ph < criterios.phMinimo || a.ph > criterios.phMaximo)) {
    motivos.push('pH fora dos limites aceitáveis');
  }
  
  // Resíduos sólidos visíveis
  if (amostras.some(a => a.residuosSolidos === true)) {
    motivos.push('Presença de resíduos sólidos visíveis');
  }
  
  // Óleo visível
  if (amostras.some(a => a.oleoVisivel === true)) {
    motivos.push('Presença de óleo ou combustível na água');
  }
  
  return {
    interditado: motivos.length > 0,
    motivos: motivos
  };
}

function analisarTendenciaBalneabilidade_(amostras) {
  if (amostras.length < 3) return { tendencia: 'DADOS_INSUFICIENTES' };
  
  const ultimas = amostras.slice(-3).map(a => a.eColi);
  const primeiras = amostras.slice(0, 3).map(a => a.eColi);
  
  const mediaUltimas = ultimas.reduce((a, b) => a + b, 0) / ultimas.length;
  const mediaPrimeiras = primeiras.reduce((a, b) => a + b, 0) / primeiras.length;
  
  const variacao = ((mediaUltimas - mediaPrimeiras) / mediaPrimeiras) * 100;
  
  if (variacao > 20) {
    return { 
      tendencia: 'DETERIORANDO', 
      variacao: Math.round(variacao) + '%',
      alerta: '⚠️ Qualidade piorando nas últimas semanas'
    };
  }
  if (variacao < -20) {
    return { 
      tendencia: 'MELHORANDO', 
      variacao: Math.round(variacao) + '%',
      mensagem: '✅ Qualidade melhorando'
    };
  }
  
  return { tendencia: 'ESTÁVEL', variacao: Math.round(variacao) + '%' };
}

function gerarRecomendacoesBalneabilidade_(status, tendencia) {
  const recomendacoes = [];
  
  if (status === 'IMPRÓPRIA') {
    recomendacoes.push({
      acao: 'Interditar área para banho',
      urgencia: 'IMEDIATA',
      responsavel: 'IBRAM/ADASA'
    });
    recomendacoes.push({
      acao: 'Identificar fonte de contaminação',
      urgencia: 'ALTA',
      responsavel: 'Fiscalização ambiental'
    });
  }
  
  if (tendencia.tendencia === 'DETERIORANDO') {
    recomendacoes.push({
      acao: 'Aumentar frequência de monitoramento',
      urgencia: 'ALTA',
      responsavel: 'Equipe técnica'
    });
    recomendacoes.push({
      acao: 'Verificar lançamentos clandestinos na área',
      urgencia: 'MÉDIA',
      responsavel: 'Fiscalização'
    });
  }
  
  if (recomendacoes.length === 0) {
    recomendacoes.push({
      acao: 'Manter monitoramento de rotina',
      urgencia: 'NORMAL',
      responsavel: 'Equipe técnica'
    });
  }
  
  return recomendacoes;
}

function gerarAmostrasPadrao_(pontoId) {
  // Dados simulados baseados em padrões reais
  const padroes = {
    'PLS': [180, 220, 150, 280, 200],   // Pontão - Bom
    'P21': [350, 400, 300, 420, 380],   // Pier 21 - Moderado
    'PVP': [950, 1100, 850, 1200, 1050], // Prainha - Problemático
    'EDB': [120, 150, 100, 160, 130],   // Ermida - Excelente
    'GS': [480, 520, 450, 550, 500],    // Gilberto Salomão - Moderado
    'DN': [150, 180, 130, 200, 160]     // Deck Norte - Bom
  };
  
  const valores = padroes[pontoId] || [300, 350, 280, 400, 320];
  
  return valores.map((eColi, i) => ({
    data: new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    eColi: eColi + Math.round((Math.random() - 0.5) * 100),
    ph: 7.5 + (Math.random() - 0.5) * 0.5,
    cianobacterias: pontoId === 'PVP' ? 35000 : 5000,
    residuosSolidos: pontoId === 'PVP' && Math.random() > 0.7,
    oleoVisivel: false
  }));
}

// ============================================================================
// 2. RELAÇÃO PRECIPITAÇÃO x TURBIDEZ (POLUIÇÃO DIFUSA)
// ============================================================================

/**
 * Analisa relação entre precipitação e turbidez.
 * Para grafico_11_precipitacao_turbidez.png do colab.py.
 * Demonstra o efeito da poluição difusa por carreamento.
 * 
 * @param {Array<Object>} dados - Array de {data, precipitacao, turbidez}
 * @return {Object} Análise de correlação e eventos críticos
 */
function analisarPrecipitacaoTurbidez(dados) {
  if (!dados) {
    dados = gerarDadosPrecipitacaoTurbidez_();
  }
  
  // Correlação
  const precipitacao = dados.map(d => d.precipitacao);
  const turbidez = dados.map(d => d.turbidez);
  const correlacao = calcularCorrelacaoPearson_(precipitacao, turbidez);
  
  // Identificar eventos de poluição difusa
  const eventosCriticos = identificarEventosPoluicaoDifusa_(dados);
  
  // Lag temporal (turbidez atrasada em relação à chuva)
  const lag = calcularLagOptimo_(precipitacao, turbidez);
  
  // Carga de sedimentos estimada
  const cargaSedimentos = estimarCargaSedimentos_(dados);
  
  // Sazonalidade
  const sazonalidade = analisarSazonalidadePoluicaoDifusa_(dados);
  
  return {
    correlacao: {
      r: correlacao.r,
      r2: correlacao.r2,
      significativo: correlacao.pValue < 0.05,
      interpretacao: correlacao.r > 0.6 
        ? 'Forte associação entre chuva e turbidez'
        : 'Associação moderada ou fraca'
    },
    
    lagTemporal: {
      dias: lag,
      interpretacao: `Pico de turbidez ocorre ~${lag} dia(s) após eventos de chuva`
    },
    
    eventosCriticos: eventosCriticos,
    cargaSedimentos: cargaSedimentos,
    sazonalidade: sazonalidade,
    
    dadosParaGrafico: {
      dias: dados.map((_, i) => i + 1),
      precipitacao: precipitacao,
      turbidez: turbidez,
      limiteConama: 40 // NTU
    },
    
    recomendacoes: gerarRecomendacoesPoluicaoDifusa_(correlacao, eventosCriticos),
    
    timestamp: new Date().toISOString()
  };
}

function calcularCorrelacaoPearson_(x, y) {
  const n = x.length;
  const mediaX = x.reduce((a, b) => a + b, 0) / n;
  const mediaY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerador = 0, denomX = 0, denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mediaX;
    const dy = y[i] - mediaY;
    numerador += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const r = numerador / Math.sqrt(denomX * denomY);
  const r2 = r * r;
  
  // Teste de significância (aproximado)
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = 2 * (1 - normalCDF_(Math.abs(t)));
  
  return {
    r: Math.round(r * 100) / 100,
    r2: Math.round(r2 * 100) / 100,
    pValue: Math.round(pValue * 1000) / 1000
  };
}

function normalCDF_(z) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1.0 + sign * y);
}

function identificarEventosPoluicaoDifusa_(dados) {
  const eventos = [];
  const limiteAlto = 40; // NTU - limite CONAMA
  
  for (let i = 1; i < dados.length; i++) {
    const anterior = dados[i - 1];
    const atual = dados[i];
    
    // Evento: chuva ontem + turbidez alta hoje
    if (anterior.precipitacao > 20 && atual.turbidez > limiteAlto) {
      eventos.push({
        dia: i + 1,
        precipitacaoAntecedente: anterior.precipitacao,
        turbidezResultante: atual.turbidez,
        excedeLimite: atual.turbidez > limiteAlto,
        classificacao: atual.turbidez > 80 ? 'CRÍTICO' : 'ALTO'
      });
    }
  }
  
  return {
    total: eventos.length,
    eventos: eventos,
    frequencia: Math.round((eventos.length / dados.length) * 100) + '%'
  };
}

function calcularLagOptimo_(precipitacao, turbidez) {
  // Teste de correlação com diferentes lags (0-3 dias)
  let melhorLag = 0;
  let melhorCorr = 0;
  
  for (let lag = 0; lag <= 3; lag++) {
    const precLag = precipitacao.slice(0, -lag || precipitacao.length);
    const turbLag = turbidez.slice(lag);
    
    const n = Math.min(precLag.length, turbLag.length);
    if (n < 5) continue;
    
    const corr = calcularCorrelacaoPearson_(precLag.slice(0, n), turbLag.slice(0, n));
    
    if (corr.r > melhorCorr) {
      melhorCorr = corr.r;
      melhorLag = lag;
    }
  }
  
  return melhorLag;
}

function estimarCargaSedimentos_(dados) {
  // Modelo simplificado: Carga = Σ(Turbidez × Vazão × fator)
  const fatorConversao = 0.0015; // g/L por NTU (aproximado)
  const vazaoMedia = 500; // L/s (tributário típico)
  
  let cargaTotal = 0;
  let diasCriticos = 0;
  
  dados.forEach(d => {
    const cargaDia = d.turbidez * vazaoMedia * fatorConversao * 86400 / 1000; // kg/dia
    cargaTotal += cargaDia;
    if (d.turbidez > 40) diasCriticos++;
  });
  
  return {
    cargaMensal: Math.round(cargaTotal / 1000 * 10) / 10, // ton/mês
    diasCriticos: diasCriticos,
    percentualCritico: Math.round((diasCriticos / dados.length) * 100) + '%',
    unidade: 'ton/mês'
  };
}

function analisarSazonalidadePoluicaoDifusa_(dados) {
  // Simular dados mensais
  return {
    periodoChuvoso: {
      meses: 'Outubro a Março',
      turbidezMedia: 45,
      frequenciaCritica: '35%'
    },
    periodoSeco: {
      meses: 'Abril a Setembro',
      turbidezMedia: 15,
      frequenciaCritica: '5%'
    },
    interpretacao: 'Poluição difusa concentra-se na estação chuvosa devido ao escoamento superficial'
  };
}

function gerarRecomendacoesPoluicaoDifusa_(correlacao, eventos) {
  const recomendacoes = [];
  
  if (correlacao.r > 0.6) {
    recomendacoes.push({
      area: 'Controle de Erosão',
      acao: 'Implementar bacias de sedimentação em áreas de drenagem',
      prioridade: 'ALTA'
    });
  }
  
  if (eventos.total > 10) {
    recomendacoes.push({
      area: 'Infraestrutura Verde',
      acao: 'Criar jardins de chuva e wetlands nas áreas urbanas',
      prioridade: 'MÉDIA'
    });
  }
  
  recomendacoes.push({
    area: 'Monitoramento',
    acao: 'Intensificar coletas durante eventos pluviométricos',
    prioridade: 'CONTÍNUA'
  });
  
  return recomendacoes;
}

function gerarDadosPrecipitacaoTurbidez_() {
  const dados = [];
  
  // 30 dias de dados simulados
  const precipitacao = [0, 0, 15, 45, 8, 0, 0, 0, 25, 60, 35, 5, 0, 0, 0, 
                        0, 0, 0, 12, 28, 55, 40, 15, 0, 0, 0, 0, 8, 22, 48];
  
  const turbidez = [12, 11, 18, 45, 38, 25, 18, 14, 22, 65, 58, 42, 28, 20, 16,
                    14, 12, 11, 15, 32, 68, 72, 55, 35, 22, 18, 15, 18, 28, 52];
  
  for (let i = 0; i < 30; i++) {
    dados.push({
      dia: i + 1,
      data: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      precipitacao: precipitacao[i],
      turbidez: turbidez[i]
    });
  }
  
  return dados;
}

// ============================================================================
// 3. ANÁLISE DE USO E OCUPAÇÃO DO SOLO
// ============================================================================

/**
 * Analisa o impacto do uso do solo na qualidade da água por sub-bacia.
 * Para grafico_12_uso_solo.png do colab.py.
 * 
 * @param {Object} dadosSubBacias - Dados de uso do solo por sub-bacia
 * @return {Object} Análise de impacto e correlações
 */
function analisarImpactoUsoSolo(dadosSubBacias) {
  if (!dadosSubBacias) {
    dadosSubBacias = getDadosUsoSoloPadrao_();
  }
  
  const analises = [];
  
  for (const [bacia, dados] of Object.entries(dadosSubBacias)) {
    // Calcular índice de preservação
    const indicePreservacao = calcularIndicePreservacao_(dados.usoSolo);
    
    // Estimar impacto na qualidade da água
    const impactoEstimado = estimarImpactoQualidadeAgua_(dados.usoSolo);
    
    // Correlação com IQA medido
    const correlacaoIQA = correlacionarComIQA_(dados.usoSolo.urbano, dados.iqaMedio);
    
    analises.push({
      bacia: bacia,
      area: dados.area,
      usoSolo: {
        urbano: dados.usoSolo.urbano,
        agricola: dados.usoSolo.agricola,
        vegetacao: dados.usoSolo.vegetacao,
        soloExposto: dados.usoSolo.soloExposto
      },
      indicePreservacao: indicePreservacao,
      impactoEstimado: impactoEstimado,
      iqaMedio: dados.iqaMedio,
      correlacaoUrbanizacaoIQA: correlacaoIQA
    });
  }
  
  // Correlação geral urbanização x IQA
  const urbanizacao = analises.map(a => a.usoSolo.urbano);
  const iqas = analises.map(a => a.iqaMedio);
  const correlacaoGeral = calcularCorrelacaoPearson_(urbanizacao, iqas);
  
  // Ranking de qualidade
  const ranking = analises
    .sort((a, b) => b.iqaMedio - a.iqaMedio)
    .map((a, i) => ({ posicao: i + 1, bacia: a.bacia, iqa: a.iqaMedio }));
  
  return {
    subBacias: analises,
    
    correlacaoGeral: {
      parametros: 'Área Urbanizada × IQA',
      r: correlacaoGeral.r,
      r2: correlacaoGeral.r2,
      interpretacao: correlacaoGeral.r < -0.5 
        ? 'Correlação negativa significativa: mais urbanização = menor qualidade'
        : 'Correlação fraca ou não significativa'
    },
    
    ranking: ranking,
    
    dadosParaGrafico: {
      bacias: analises.map(a => a.bacia.replace('_', '\n')),
      urbano: urbanizacao,
      agricola: analises.map(a => a.usoSolo.agricola),
      vegetacao: analises.map(a => a.usoSolo.vegetacao),
      soloExposto: analises.map(a => a.usoSolo.soloExposto),
      iqa: iqas,
      regressao: calcularRegressaoLinear_(urbanizacao, iqas)
    },
    
    recomendacoesPorBacia: gerarRecomendacoesUsoSolo_(analises),
    
    timestamp: new Date().toISOString()
  };
}

function calcularIndicePreservacao_(usoSolo) {
  // Índice baseado em pesos (vegetação positivo, urbano/exposto negativo)
  const indice = usoSolo.vegetacao * 1.0 - usoSolo.urbano * 0.5 - usoSolo.soloExposto * 0.8 + 50;
  
  return {
    valor: Math.round(Math.max(0, Math.min(100, indice))),
    classificacao: indice > 60 ? 'BOM' : indice > 40 ? 'REGULAR' : 'RUIM'
  };
}

function estimarImpactoQualidadeAgua_(usoSolo) {
  // Modelo empírico de impacto
  const impactoUrbano = usoSolo.urbano * 0.8;
  const impactoAgricola = usoSolo.agricola * 0.4;
  const impactoExposto = usoSolo.soloExposto * 0.6;
  const mitigacaoVegetacao = usoSolo.vegetacao * 0.5;
  
  const impactoLiquido = impactoUrbano + impactoAgricola + impactoExposto - mitigacaoVegetacao;
  
  return {
    valor: Math.round(impactoLiquido),
    nivel: impactoLiquido > 50 ? 'ALTO' : impactoLiquido > 25 ? 'MODERADO' : 'BAIXO',
    contribuições: {
      urbano: `${Math.round(impactoUrbano)} (${usoSolo.urbano}% da área)`,
      agricola: `${Math.round(impactoAgricola)}`,
      soloExposto: `${Math.round(impactoExposto)}`,
      vegetacao: `-${Math.round(mitigacaoVegetacao)} (mitigação)`
    }
  };
}

function correlacionarComIQA_(areaUrbanizada, iqaMedio) {
  // Relação esperada: IQA ≈ 90 - 0.7 × %Urbanizado
  const iqaEsperado = 90 - 0.7 * areaUrbanizada;
  const diferenca = iqaMedio - iqaEsperado;
  
  return {
    iqaEsperado: Math.round(iqaEsperado),
    iqaMedido: iqaMedio,
    diferenca: Math.round(diferenca),
    situacao: diferenca > 5 ? 'ACIMA_ESPERADO' : diferenca < -5 ? 'ABAIXO_ESPERADO' : 'DENTRO_ESPERADO'
  };
}

function calcularRegressaoLinear_(x, y) {
  const n = x.length;
  const mediaX = x.reduce((a, b) => a + b, 0) / n;
  const mediaY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerador = 0, denominador = 0;
  for (let i = 0; i < n; i++) {
    numerador += (x[i] - mediaX) * (y[i] - mediaY);
    denominador += (x[i] - mediaX) ** 2;
  }
  
  const inclinacao = numerador / denominador;
  const intercecao = mediaY - inclinacao * mediaX;
  
  return {
    inclinacao: Math.round(inclinacao * 100) / 100,
    intercecao: Math.round(intercecao * 100) / 100,
    equacao: `IQA = ${Math.round(intercecao)} + ${Math.round(inclinacao * 100) / 100} × Urbanização`
  };
}

function gerarRecomendacoesUsoSolo_(analises) {
  const recomendacoes = {};
  
  analises.forEach(a => {
    const recs = [];
    
    if (a.usoSolo.urbano > 60) {
      recs.push('Implementar infraestrutura verde (parques lineares, biovaletas)');
    }
    if (a.usoSolo.soloExposto > 5) {
      recs.push('Recuperar áreas degradadas com revegetação');
    }
    if (a.indicePreservacao.classificacao === 'RUIM') {
      recs.push('Criar APPs (Áreas de Preservação Permanente) ao longo dos córregos');
    }
    if (a.impactoEstimado.nivel === 'ALTO') {
      recs.push('Intensificar fiscalização de lançamentos industriais e domésticos');
    }
    
    if (recs.length === 0) {
      recs.push('Manter gestão atual e monitoramento periódico');
    }
    
    recomendacoes[a.bacia] = recs;
  });
  
  return recomendacoes;
}

function getDadosUsoSoloPadrao_() {
  return {
    'RIACHO_FUNDO': {
      area: 228.0, // km²
      usoSolo: { urbano: 72, agricola: 8, vegetacao: 15, soloExposto: 5 },
      iqaMedio: 42
    },
    'GAMA': {
      area: 157.0,
      usoSolo: { urbano: 58, agricola: 15, vegetacao: 20, soloExposto: 7 },
      iqaMedio: 55
    },
    'BANANAL': {
      area: 129.0,
      usoSolo: { urbano: 35, agricola: 25, vegetacao: 32, soloExposto: 8 },
      iqaMedio: 68
    },
    'TORTO': {
      area: 102.0,
      usoSolo: { urbano: 28, agricola: 18, vegetacao: 48, soloExposto: 6 },
      iqaMedio: 78
    },
    'SOBRADINHO': {
      area: 144.0,
      usoSolo: { urbano: 45, agricola: 22, vegetacao: 28, soloExposto: 5 },
      iqaMedio: 62
    }
  };
}

// ============================================================================
// 4. ENDPOINTS PARA COLAB.PY
// ============================================================================

/**
 * Fornece dados de balneabilidade para o colab.py.
 */
function getBalneabilidadeDataForColab() {
  const resultado = avaliarTodosOsPontos();
  return {
    pontos: resultado.dadosParaGrafico.map(d => d.nome),
    proprio: resultado.dadosParaGrafico.map(d => d.proprio),
    improprio: resultado.dadosParaGrafico.map(d => d.improprio),
    limiteExcelente: 80
  };
}

/**
 * Fornece dados de precipitação x turbidez para o colab.py.
 */
function getPrecipitacaoTurbidezDataForColab() {
  const resultado = analisarPrecipitacaoTurbidez();
  return resultado.dadosParaGrafico;
}

/**
 * Fornece dados de uso do solo para o colab.py.
 */
function getUsoSoloDataForColab() {
  const resultado = analisarImpactoUsoSolo();
  return resultado.dadosParaGrafico;
}

// ============================================================================
// EXPORTS
// ============================================================================

const BalneabilidadeService = {
  avaliarBalneabilidade,
  avaliarTodosOsPontos,
  analisarPrecipitacaoTurbidez,
  analisarImpactoUsoSolo,
  getBalneabilidadeDataForColab,
  getPrecipitacaoTurbidezDataForColab,
  getUsoSoloDataForColab,
  CONSTANTS: BALNEABILIDADE_CONSTANTS
};
