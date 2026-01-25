/**
 * @file LimnologiaAnalyticsService.gs
 * @project LAGO_PARANOA - Recursos Hídricos
 * @category limnologia
 * @tags analytics, estatistica, ciencia-dados, integracao-colab
 * @architecture Server-Side Analytics Engine
 * @description Motor de análises estatísticas avançadas para dados limnológicos.
 * Corresponde à complexidade do colab.py com análises IQA, correlação e séries temporais.
 * @context Integração científica com módulo Python Colab para visualizações avançadas.
 */

// ============================================================================
// CONSTANTES CIENTÍFICAS - LIMITES CONAMA 357/2005 e 274/2000
// ============================================================================
const LIMNOLOGIA_CONSTANTS = {
  // Parâmetros de Eutrofização (Classe 2 - Lagos)
  LIMITES_CONAMA: {
    FOSFORO_TOTAL: { max: 30, unit: 'µg/L', classe: 2 },
    CLOROFILA_A: { max: 10, unit: 'µg/L', classe: 2 },
    NITROGENIO_TOTAL: { max: 1270, unit: 'µg/L', classe: 2 },
    OXIGENIO_DISSOLVIDO: { min: 5.0, unit: 'mg/L', classe: 2 },
    PH: { min: 6.0, max: 9.0, unit: '-', classe: 2 },
    TURBIDEZ: { max: 40, unit: 'NTU', classe: 2 },
    COLIFORMES: { max: 1000, unit: 'NMP/100mL', classe: 2 },
    SECCHI: { min: 1.0, unit: 'm', classe: 2 }
  },
  
  // Estados Tróficos (Carlson modificado para Trópicos)
  ESTADOS_TROFICOS: {
    ULTRAOLIGOTRÓFICO: { P: 8, Chl: 1.17, Secchi: 5.4 },
    OLIGOTRÓFICO: { P: 19, Chl: 3.24, Secchi: 2.4 },
    MESOTRÓFICO: { P: 52, Chl: 11.03, Secchi: 1.2 },
    EUTRÓFICO: { P: 120, Chl: 30.55, Secchi: 0.68 },
    SUPEREUTRÓFICO: { P: 233, Chl: 69.05, Secchi: 0.42 },
    HIPEREUTRÓFICO: { P: Infinity, Chl: Infinity, Secchi: 0 }
  },
  
  // Zonas do Lago Paranoá (coordenadas aproximadas)
  ZONAS: {
    RIACHO_FUNDO: { id: 'RF', lat: -15.865, lng: -47.966, troficidade: 'EUTRÓFICO' },
    GAMA: { id: 'GA', lat: -15.875, lng: -47.952, troficidade: 'EUTRÓFICO' },
    BANANAL: { id: 'BA', lat: -15.842, lng: -47.865, troficidade: 'MESOTRÓFICO' },
    TORTO: { id: 'TO', lat: -15.745, lng: -47.888, troficidade: 'MESOTRÓFICO' },
    LAGO_NORTE: { id: 'LN', lat: -15.730, lng: -47.865, troficidade: 'OLIGOTRÓFICO' },
    BARRAGEM: { id: 'BR', lat: -15.795, lng: -47.825, troficidade: 'OLIGOTRÓFICO' }
  },
  
  // Pesos para cálculo do IQA (CETESB)
  PESOS_IQA: {
    OD: 0.17, DBO: 0.10, COLIFORMES: 0.15, PH: 0.12, NITROGENIO: 0.10,
    FOSFORO: 0.10, TEMPERATURA: 0.10, TURBIDEZ: 0.08, SOLIDOS: 0.08
  }
};

// ============================================================================
// 1. CÁLCULO DO ÍNDICE DE QUALIDADE DA ÁGUA (IQA) - CETESB
// ============================================================================

/**
 * Calcula o Índice de Qualidade da Água usando metodologia CETESB.
 * Produz resultado compatível com gráfico radar do colab.py (grafico_02_iqa_radar.png).
 * 
 * @param {Object} parametros - Objeto com parâmetros limnológicos medidos
 * @param {number} parametros.od - Oxigênio Dissolvido (mg/L)
 * @param {number} parametros.dbo - Demanda Bioquímica de Oxigênio (mg/L)
 * @param {number} parametros.coliformes - Coliformes Termotolerantes (NMP/100mL)
 * @param {number} parametros.ph - pH
 * @param {number} parametros.nitrogenio - Nitrogênio Total (mg/L)
 * @param {number} parametros.fosforo - Fósforo Total (mg/L)
 * @param {number} parametros.turbidez - Turbidez (NTU)
 * @param {number} parametros.temperatura - Variação de Temperatura (°C)
 * @param {number} parametros.solidos - Sólidos Totais (mg/L)
 * @return {Object} Resultado do IQA com valor, categoria e subíndices
 */
function calcularIQA(parametros) {
  const subindices = {};
  const pesos = LIMNOLOGIA_CONSTANTS.PESOS_IQA;
  
  // Curvas de qualidade CETESB (simplificadas)
  subindices.OD = calcularSubindiceOD(parametros.od);
  subindices.DBO = calcularSubindiceDBO(parametros.dbo);
  subindices.COLIFORMES = calcularSubindiceColiformes(parametros.coliformes);
  subindices.PH = calcularSubindicepH(parametros.ph);
  subindices.NITROGENIO = calcularSubindiceNitrogenio(parametros.nitrogenio);
  subindices.FOSFORO = calcularSubindiceFosforo(parametros.fosforo);
  subindices.TURBIDEZ = calcularSubindiceTurbidez(parametros.turbidez);
  subindices.TEMPERATURA = calcularSubindiceTemperatura(parametros.temperatura);
  subindices.SOLIDOS = calcularSubindiceSolidos(parametros.solidos);
  
  // IQA = Π (qi ^ wi) - Produto ponderado
  let iqaValue = 1;
  for (const param in pesos) {
    const peso = pesos[param];
    const valor = subindices[param];
    
    if (valor === undefined || valor === null) {
      console.warn(`⚠️ Subíndice não calculado para: ${param}. Usando valor padrão 50.`);
      iqaValue *= Math.pow(50, peso);
      continue;
    }
    
    // Evitar NaN em Math.pow(negativo, fracionario)
    const base = Math.max(0, Math.min(100, valor));
    iqaValue *= Math.pow(base, peso);
  }
  
  const iqaValueRounded = Math.round(iqaValue * 100) / 100;
  const categoria = classificarIQAServico(iqaValueRounded);
  
  // Garantir que categoria tem a estrutura correta
  if (!categoria || typeof categoria !== 'object') {
    console.error('❌ classificarIQA retornou valor inválido:', categoria);
    return {
      valor: iqaValueRounded,
      categoria: { nivel: 'ERRO', cor: '#000000', emoji: '❌' },
      subindices: subindices,
      timestamp: new Date().toISOString(),
      metodo: 'CETESB_PONDERADO',
      erro: 'Categoria não classificada corretamente'
    };
  }
  
  return {
    valor: iqaValueRounded,
    categoria: {
      nivel: categoria.nivel,
      cor: categoria.cor,
      emoji: categoria.emoji
    },
    subindices: subindices,
    timestamp: new Date().toISOString(),
    metodo: 'CETESB_PONDERADO'
  };
}


// Funções auxiliares de subíndices (curvas simplificadas)
function calcularSubindiceOD(od) {
  if (od >= 8) return 90;
  if (od >= 6) return 70 + (od - 6) * 10;
  if (od >= 4) return 50 + (od - 4) * 10;
  if (od >= 2) return 20 + (od - 2) * 15;
  return Math.max(0, od * 10);
}

function calcularSubindiceDBO(dbo) {
  if (dbo <= 2) return 90;
  if (dbo <= 4) return 80 - (dbo - 2) * 10;
  if (dbo <= 8) return 60 - (dbo - 4) * 7.5;
  if (dbo <= 15) return 30 - (dbo - 8) * 3;
  return Math.max(0, 30 - dbo);
}

function calcularSubindiceColiformes(coliformes) {
  if (coliformes <= 50) return 95;
  if (coliformes <= 200) return 80;
  if (coliformes <= 1000) return 60;
  if (coliformes <= 4000) return 40;
  if (coliformes <= 10000) return 20;
  return 5;
}

function calcularSubindicepH(ph) {
  if (ph >= 7 && ph <= 7.5) return 95;
  if (ph >= 6.5 && ph <= 8.5) return 80;
  if (ph >= 6 && ph <= 9) return 60;
  return 30;
}

function calcularSubindiceNitrogenio(n) {
  if (n <= 0.5) return 95;
  if (n <= 2) return 80 - (n - 0.5) * 10;
  if (n <= 5) return 65 - (n - 2) * 8;
  if (n <= 10) return 41 - (n - 5) * 5;
  return Math.max(5, 16 - n);
}

function calcularSubindiceFosforo(p) {
  if (p <= 0.02) return 95;
  if (p <= 0.05) return 80;
  if (p <= 0.1) return 60;
  if (p <= 0.25) return 40;
  if (p <= 0.5) return 20;
  return 5;
}

function calcularSubindiceTurbidez(turb) {
  if (turb <= 10) return 90;
  if (turb <= 25) return 75;
  if (turb <= 40) return 60;
  if (turb <= 80) return 40;
  if (turb <= 150) return 20;
  return 5;
}

function calcularSubindiceTemperatura(deltaT) {
  if (deltaT <= 2) return 95;
  if (deltaT <= 5) return 80;
  if (deltaT <= 10) return 50;
  return 20;
}

function calcularSubindiceSolidos(st) {
  if (st <= 100) return 90;
  if (st <= 250) return 75;
  if (st <= 500) return 55;
  if (st <= 750) return 35;
  return 15;
}

function classificarIQAServico(valor) {
  if (valor >= 80) return { nivel: 'ÓTIMA', cor: '#0066FF', emoji: '🌟' };
  if (valor >= 52) return { nivel: 'BOA', cor: '#00CC00', emoji: '✅' };
  if (valor >= 37) return { nivel: 'ACEITÁVEL', cor: '#FFCC00', emoji: '⚠️' };
  if (valor >= 20) return { nivel: 'RUIM', cor: '#FF6600', emoji: '🔶' };
  return { nivel: 'PÉSSIMA', cor: '#FF0000', emoji: '🚨' };
}

// ============================================================================
// 2. ÍNDICE DE ESTADO TRÓFICO (IET) - CARLSON MODIFICADO PARA TRÓPICOS
// ============================================================================

/**
 * Calcula o Índice de Estado Trófico (IET) - metodologia CETESB para lagos tropicais.
 * Dados para gráfico de eutrofização do colab.py (grafico_01_eutrofizacao.png).
 * 
 * @param {number} fosforoTotal - Fósforo Total (µg/L)
 * @param {number} clorofilaA - Clorofila-a (µg/L)
 * @param {number} transparenciaSecchi - Profundidade do Disco de Secchi (m)
 * @return {Object} Estado trófico detalhado
 */
function calcularIET(fosforoTotal, clorofilaA, transparenciaSecchi) {
  // IET(PT) = 10 * (6 - (1.77 - 0.36 * ln(PT)) / ln(2)) - Lamparelli (2004) Reservatórios
  const ietPT = 10 * (6 - (1.77 - 0.36 * Math.log(fosforoTotal)) / Math.log(2));
  
  // IET(CL) = 10 * (6 - (0.92 - 0.34 * ln(CL)) / ln(2)) - Lamparelli (2004) Reservatórios
  const ietCL = 10 * (6 - (0.92 - 0.34 * Math.log(clorofilaA)) / Math.log(2));
  
  // IET(S) = 10 * (6 - ln(S) / ln(2)) - Secchi
  const ietS = 10 * (6 - Math.log(transparenciaSecchi) / Math.log(2));
  
  // IET médio (para lagos)
  const ietMedio = (ietPT + ietCL) / 2;
  
  const classificacao = classificarIET(ietMedio);
  
  return {
    ietFosforo: Math.round(ietPT * 10) / 10,
    ietClorofila: Math.round(ietCL * 10) / 10,
    ietSecchi: Math.round(ietS * 10) / 10,
    ietMedio: Math.round(ietMedio * 10) / 10,
    classificacao: classificacao,
    limitesConama: {
      fosforoExcedente: fosforoTotal > LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA.FOSFORO_TOTAL.max,
      clorofilaExcedente: clorofilaA > LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA.CLOROFILA_A.max
    },
    recomendacoes: gerarRecomendacoesIET(classificacao.estado, fosforoTotal, clorofilaA)
  };
}

function classificarIET(iet) {
  if (iet <= 47) return { 
    estado: 'ULTRAOLIGOTRÓFICO', 
    cor: '#0000FF', 
    risco: 'MUITO BAIXO',
    descricao: 'Corpos d\'água limpos com alta transparência e baixa produtividade'
  };
  if (iet <= 52) return { 
    estado: 'OLIGOTRÓFICO', 
    cor: '#00AAFF', 
    risco: 'BAIXO',
    descricao: 'Corpos d\'água limpos com baixa concentração de nutrientes'
  };
  if (iet <= 59) return { 
    estado: 'MESOTRÓFICO', 
    cor: '#00FF00', 
    risco: 'MODERADO',
    descricao: 'Produtividade intermediária com possíveis implicações na qualidade'
  };
  if (iet <= 63) return { 
    estado: 'EUTRÓFICO', 
    cor: '#FFAA00', 
    risco: 'ALTO',
    descricao: 'Alta produtividade relacionada ao enriquecimento por nutrientes'
  };
  if (iet <= 67) return { 
    estado: 'SUPEREUTRÓFICO', 
    cor: '#FF6600', 
    risco: 'MUITO ALTO',
    descricao: 'Alta produtividade com florações de algas frequentes'
  };
  return { 
    estado: 'HIPEREUTRÓFICO', 
    cor: '#FF0000', 
    risco: 'CRÍTICO',
    descricao: 'Florações tóxicas frequentes e mortandade de peixes'
  };
}

function gerarRecomendacoesIET(estado, fosforo, clorofila) {
  const recomendacoes = [];
  
  if (estado === 'HIPEREUTRÓFICO' || estado === 'SUPEREUTRÓFICO') {
    recomendacoes.push('⚠️ CRÍTICO: Interditar atividades de balneabilidade');
    recomendacoes.push('🚰 Intensificar monitoramento de cianobactérias tóxicas');
    recomendacoes.push('🔬 Ativar tratamento especial na ETA (carvão ativado)');
  }
  
  if (fosforo > 30) {
    recomendacoes.push(`📉 Reduzir aporte de fósforo (atual: ${fosforo}µg/L, limite: 30µg/L)`);
    recomendacoes.push('🏭 Verificar eficiência das ETEs (Riacho Fundo, Gama)');
  }
  
  if (clorofila > 10) {
    recomendacoes.push(`🦠 Alerta de biomassa algal alta (${clorofila}µg/L)`);
    recomendacoes.push('🔍 Identificar espécies dominantes (C. raciborskii?)');
  }
  
  if (recomendacoes.length === 0) {
    recomendacoes.push('✅ Manter monitoramento de rotina');
  }
  
  return recomendacoes;
}

// ============================================================================
// 3. ANÁLISE DE CORRELAÇÃO ENTRE PARÂMETROS
// ============================================================================

/**
 * Calcula matriz de correlação de Pearson entre parâmetros limnológicos.
 * Para geração do heatmap no colab.py (grafico_04_correlacao_heatmap.png).
 * 
 * @param {Array<Object>} serieHistorica - Array de objetos com medições
 * @return {Object} Matriz de correlação com significância estatística
 */
function calcularMatrizCorrelacao(serieHistorica) {
  const parametros = ['fosforo', 'nitrogenio', 'clorofila', 'od', 'ph', 
                      'turbidez', 'temperatura', 'condutividade'];
  
  const matriz = {};
  const significancia = {};
  
  for (const p1 of parametros) {
    matriz[p1] = {};
    significancia[p1] = {};
    
    for (const p2 of parametros) {
      // Extrair valores de cada parâmetro
      const valores1 = serieHistorica.map(m => m[p1]).filter(v => v !== null && v !== undefined);
      const valores2 = serieHistorica.map(m => m[p2]).filter(v => v !== null && v !== undefined);
      
      if (valores1.length >= 3 && valores2.length >= 3) {
        const resultado = calcularPearson(valores1, valores2);
        matriz[p1][p2] = Math.round(resultado.r * 100) / 100;
        significancia[p1][p2] = resultado.pValue < 0.05 ? 'SIGNIFICATIVO' : 'NS';
      } else {
        matriz[p1][p2] = null;
        significancia[p1][p2] = 'DADOS_INSUFICIENTES';
      }
    }
  }
  
  // Identificar correlações mais fortes
  const correlacoesCriticas = identificarCorrelacoesCriticas(matriz);
  
  return {
    matriz: matriz,
    significancia: significancia,
    correlacoesCriticas: correlacoesCriticas,
    n: serieHistorica.length,
    metodo: 'PEARSON',
    timestamp: new Date().toISOString()
  };
}

/**
 * Calcula coeficiente de correlação de Pearson.
 */
function calcularPearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return { r: 0, pValue: 1 };
  
  // Médias
  const mediaX = x.reduce((a, b) => a + b, 0) / n;
  const mediaY = y.reduce((a, b) => a + b, 0) / n;
  
  // Covariância e desvios padrão
  let somaXY = 0, somaX2 = 0, somaY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mediaX;
    const dy = y[i] - mediaY;
    somaXY += dx * dy;
    somaX2 += dx * dx;
    somaY2 += dy * dy;
  }
  
  // r = Cov(X,Y) / (Sx * Sy)
  const r = somaXY / Math.sqrt(somaX2 * somaY2);
  
  // Teste t para significância
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = 2 * (1 - tDistCDF(Math.abs(t), n - 2)); // Aproximação
  
  return { r: isNaN(r) ? 0 : r, pValue: isNaN(pValue) ? 1 : pValue };
}

function tDistCDF(t, df) {
  // Aproximação simplificada da distribuição t
  const x = df / (df + t * t);
  return 1 - 0.5 * Math.pow(x, df / 2);
}

function identificarCorrelacoesCriticas(matriz) {
  const criticas = [];
  const params = Object.keys(matriz);
  
  for (let i = 0; i < params.length; i++) {
    for (let j = i + 1; j < params.length; j++) {
      const r = matriz[params[i]][params[j]];
      if (r !== null && Math.abs(r) > 0.7) {
        criticas.push({
          par: `${params[i]} × ${params[j]}`,
          correlacao: r,
          tipo: r > 0 ? 'POSITIVA' : 'NEGATIVA',
          interpretacao: interpretarCorrelacao(params[i], params[j], r)
        });
      }
    }
  }
  
  return criticas.sort((a, b) => Math.abs(b.correlacao) - Math.abs(a.correlacao));
}

function interpretarCorrelacao(p1, p2, r) {
  const interpretacoes = {
    'fosforo_clorofila': 'Aumento de P estimula crescimento algal (Bottom-Up)',
    'fosforo_od': 'P elevado leva a maior respiração e menor OD',
    'clorofila_od': 'Florações causam supersaturação diurna e depleção noturna',
    'turbidez_fosforo': 'P associado a partículas em suspensão',
    'temperatura_od': 'Solubilidade do O2 diminui com temperatura'
  };
  
  const chave = [p1, p2].sort().join('_');
  return interpretacoes[chave] || 'Correlação requer análise contextual';
}

// ============================================================================
// 4. ANÁLISE DE SÉRIES TEMPORAIS
// ============================================================================

/**
 * Analisa tendências em séries temporais de parâmetros limnológicos.
 * Para grafico_03_serie_temporal.png e grafico_10_tendencia_historica.png.
 * 
 * @param {Array<Object>} dados - Array com {data: Date, valor: number}
 * @param {string} parametro - Nome do parâmetro
 * @return {Object} Análise de tendência (Mann-Kendall) e sazonalidade
 */
function analisarSerieTemporal(dados, parametro) {
  // Ordenar por data
  const ordenados = dados.sort((a, b) => new Date(a.data) - new Date(b.data));
  const valores = ordenados.map(d => d.valor);
  const n = valores.length;
  
  if (n < 5) {
    return { erro: 'Dados insuficientes para análise de tendência (mínimo: 5)' };
  }
  
  // Estatísticas descritivas
  const media = valores.reduce((a, b) => a + b, 0) / n;
  const desvPadrao = Math.sqrt(valores.map(v => Math.pow(v - media, 2)).reduce((a, b) => a + b, 0) / n);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  
  // Teste de Mann-Kendall para tendência
  const mannKendall = calcularMannKendall(valores);
  
  // Análise de sazonalidade (meses de chuva vs seca para o DF)
  const sazonalidade = analisarSazonalidade(ordenados);
  
  // Regressão linear para projeção
  const regressao = calcularRegressaoLinear(valores);
  
  return {
    estatisticasDescritivas: {
      n: n,
      media: Math.round(media * 100) / 100,
      desvPadrao: Math.round(desvPadrao * 100) / 100,
      minimo: minimo,
      maximo: maximo,
      coefVariacao: Math.round((desvPadrao / media) * 100) + '%'
    },
    tendencia: {
      direcao: mannKendall.tendencia,
      significancia: mannKendall.pValue < 0.05 ? 'SIGNIFICATIVA' : 'NÃO_SIGNIFICATIVA',
      pValue: mannKendall.pValue,
      taxaVariacao: regressao.inclinacao,
      r2: regressao.r2
    },
    sazonalidade: sazonalidade,
    projecao: {
      proximos6Meses: Math.round((regressao.intercecao + regressao.inclinacao * (n + 6)) * 100) / 100,
      proximos12Meses: Math.round((regressao.intercecao + regressao.inclinacao * (n + 12)) * 100) / 100
    },
    alerta: gerarAlertaTendencia(parametro, mannKendall.tendencia, valores[n-1])
  };
}

/**
 * Teste de Mann-Kendall para detecção de tendência.
 */
function calcularMannKendall(valores) {
  const n = valores.length;
  let S = 0;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (valores[j] > valores[i]) S++;
      else if (valores[j] < valores[i]) S--;
    }
  }
  
  // Variância de S
  const varS = (n * (n - 1) * (2 * n + 5)) / 18;
  
  // Estatística Z
  let Z;
  if (S > 0) Z = (S - 1) / Math.sqrt(varS);
  else if (S < 0) Z = (S + 1) / Math.sqrt(varS);
  else Z = 0;
  
  // p-value aproximado (Normal)
  const pValue = 2 * (1 - normalCDF(Math.abs(Z)));
  
  let tendencia;
  if (Z > 1.96) tendencia = 'CRESCENTE';
  else if (Z < -1.96) tendencia = 'DECRESCENTE';
  else tendencia = 'SEM_TENDÊNCIA';
  
  return {
    S: S,
    Z: Math.round(Z * 100) / 100,
    pValue: Math.round(pValue * 1000) / 1000,
    tendencia: tendencia
  };
}

function normalCDF(z) {
  // Aproximação de Abramowitz e Stegun
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1.0 + sign * y);
}

function calcularRegressaoLinear(valores) {
  const n = valores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const mediaX = (n - 1) / 2;
  const mediaY = valores.reduce((a, b) => a + b, 0) / n;
  
  let numerador = 0, denominador = 0;
  for (let i = 0; i < n; i++) {
    numerador += (x[i] - mediaX) * (valores[i] - mediaY);
    denominador += (x[i] - mediaX) ** 2;
  }
  
  const inclinacao = numerador / denominador;
  const intercecao = mediaY - inclinacao * mediaX;
  
  // R²
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicao = intercecao + inclinacao * x[i];
    ssRes += (valores[i] - predicao) ** 2;
    ssTot += (valores[i] - mediaY) ** 2;
  }
  const r2 = 1 - (ssRes / ssTot);
  
  return {
    inclinacao: Math.round(inclinacao * 100) / 100,
    intercecao: Math.round(intercecao * 100) / 100,
    r2: Math.round(r2 * 100) / 100
  };
}

function analisarSazonalidade(dados) {
  // Meses de chuva no DF: Out-Mar | Seca: Abr-Set
  const chuva = [], seca = [];
  
  dados.forEach(d => {
    const mes = new Date(d.data).getMonth() + 1;
    if (mes >= 10 || mes <= 3) chuva.push(d.valor);
    else seca.push(d.valor);
  });
  
  if (chuva.length === 0 || seca.length === 0) {
    return { disponivel: false };
  }
  
  const mediaChuva = chuva.reduce((a, b) => a + b, 0) / chuva.length;
  const mediaSeca = seca.reduce((a, b) => a + b, 0) / seca.length;
  
  return {
    disponivel: true,
    mediaChuva: Math.round(mediaChuva * 100) / 100,
    mediaSeca: Math.round(mediaSeca * 100) / 100,
    diferenca: Math.round((mediaChuva - mediaSeca) * 100) / 100,
    percentualVariacao: Math.round(((mediaChuva - mediaSeca) / mediaSeca) * 100) + '%',
    interpretacao: mediaChuva > mediaSeca 
      ? 'Valores maiores no período chuvoso (out-mar)' 
      : 'Valores maiores no período seco (abr-set)'
  };
}

function gerarAlertaTendencia(parametro, tendencia, valorAtual) {
  const limites = LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA;
  
  if (parametro === 'fosforo' && tendencia === 'CRESCENTE' && valorAtual > 20) {
    return {
      nivel: 'ALTO',
      mensagem: '⚠️ Tendência crescente de fósforo - Risco de eutrofização',
      acao: 'Intensificar monitoramento de efluentes'
    };
  }
  
  if (parametro === 'od' && tendencia === 'DECRESCENTE' && valorAtual < 6) {
    return {
      nivel: 'CRÍTICO',
      mensagem: '🚨 Tendência decrescente de OD - Risco de anoxia',
      acao: 'Verificar estratificação térmica e carga orgânica'
    };
  }
  
  return { nivel: 'MONITORAMENTO', mensagem: 'Sem alertas críticos' };
}

// ============================================================================
// 5. MAPA DE RISCO AMBIENTAL INTEGRADO
// ============================================================================

/**
 * Calcula mapa de risco ambiental por zona do lago.
 * Para grafico_05_mapa_risco.png no colab.py.
 * 
 * @param {Object} dadosPorZona - Objeto com dados de cada zona
 * @return {Object} Mapa de risco com índices por categoria
 */
function calcularMapaRisco(dadosPorZona) {
  const zonas = LIMNOLOGIA_CONSTANTS.ZONAS;
  const resultado = {};
  
  for (const [nomeZona, configZona] of Object.entries(zonas)) {
    const dados = dadosPorZona[nomeZona] || {};
    
    // Índices de risco individuais (0-100)
    const riscoEutrofizacao = calcularRiscoEutrofizacao(dados);
    const riscoContaminacao = calcularRiscoContaminacao(dados);
    const riscoSedimentos = calcularRiscoSedimentos(dados);
    const riscoCianobacterias = calcularRiscoCianobacterias(dados);
    
    // Índice de risco integrado (ponderado)
    const riscoIntegrado = Math.round(
      riscoEutrofizacao * 0.30 +
      riscoContaminacao * 0.25 +
      riscoSedimentos * 0.20 +
      riscoCianobacterias * 0.25
    );
    
    resultado[nomeZona] = {
      coordenadas: { lat: configZona.lat, lng: configZona.lng },
      riscoEutrofizacao: riscoEutrofizacao,
      riscoContaminacao: riscoContaminacao,
      riscoSedimentos: riscoSedimentos,
      riscoCianobacterias: riscoCianobacterias,
      riscoIntegrado: riscoIntegrado,
      classificacao: classificarRiscoIntegrado(riscoIntegrado),
      acoesPrioritarias: gerarAcoesPrioritarias(nomeZona, { 
        riscoEutrofizacao, riscoContaminacao, riscoSedimentos, riscoCianobacterias 
      })
    };
  }
  
  return {
    mapaRisco: resultado,
    zonaCritica: identificarZonaCritica(resultado),
    timestamp: new Date().toISOString()
  };
}

function calcularRiscoEutrofizacao(dados) {
  const fosforo = dados.fosforo || 0;
  const clorofila = dados.clorofila || 0;
  
  let risco = 0;
  // Fósforo (em µg/L, converter se necessário)
  const fosforoUg = fosforo > 10 ? fosforo : fosforo * 1000;
  
  if (fosforoUg > 100) risco += 50;
  else if (fosforoUg > 50) risco += 35;
  else if (fosforoUg > 30) risco += 20;
  
  // Clorofila
  if (clorofila > 30) risco += 50;
  else if (clorofila > 15) risco += 30;
  else if (clorofila > 10) risco += 15;
  
  return Math.min(100, risco);
}

function calcularRiscoContaminacao(dados) {
  const coliformes = dados.coliformes || 0;
  const dbo = dados.dbo || 0;
  
  let risco = 0;
  if (coliformes > 2500) risco += 60;
  else if (coliformes > 1000) risco += 35;
  else if (coliformes > 200) risco += 15;
  
  if (dbo > 5) risco += 40;
  else if (dbo > 3) risco += 20;
  
  return Math.min(100, risco);
}

function calcularRiscoSedimentos(dados) {
  const turbidez = dados.turbidez || 0;
  const microplasticos = dados.microplasticos || 0;
  
  let risco = 0;
  if (turbidez > 80) risco += 50;
  else if (turbidez > 40) risco += 30;
  else if (turbidez > 20) risco += 15;
  
  if (microplasticos > 1000) risco += 50;
  else if (microplasticos > 500) risco += 30;
  
  return Math.min(100, risco);
}

function calcularRiscoCianobacterias(dados) {
  const clorofila = dados.clorofila || 0;
  const cianobacteriasCelulas = dados.cianobacterias || 0;
  const temperatura = dados.temperatura || 25;
  
  let risco = 0;
  
  // Densidade celular (CONAMA)
  if (cianobacteriasCelulas > 100000) risco += 70;
  else if (cianobacteriasCelulas > 50000) risco += 45;
  else if (cianobacteriasCelulas > 20000) risco += 25;
  
  // Temperatura favorável e clorofila alta
  if (temperatura > 26 && clorofila > 10) risco += 30;
  
  return Math.min(100, risco);
}

function classificarRiscoIntegrado(valor) {
  if (valor >= 75) return { nivel: 'CRÍTICO', cor: '#FF0000', emoji: '🚨' };
  if (valor >= 50) return { nivel: 'ALTO', cor: '#FF6600', emoji: '🔶' };
  if (valor >= 25) return { nivel: 'MODERADO', cor: '#FFCC00', emoji: '⚠️' };
  return { nivel: 'BAIXO', cor: '#00CC00', emoji: '✅' };
}

function gerarAcoesPrioritarias(zona, riscos) {
  const acoes = [];
  
  if (riscos.riscoEutrofizacao > 60) {
    acoes.push(`Reduzir carga de nutrientes via ETEs (zona ${zona})`);
  }
  if (riscos.riscoContaminacao > 60) {
    acoes.push(`Interditar balneabilidade em ${zona}`);
  }
  if (riscos.riscoCianobacterias > 60) {
    acoes.push(`Monitoramento intensivo de cianotoxinas em ${zona}`);
  }
  
  return acoes.length > 0 ? acoes : ['Manter monitoramento de rotina'];
}

function identificarZonaCritica(mapa) {
  let pior = { nome: null, risco: 0 };
  
  for (const [zona, dados] of Object.entries(mapa)) {
    if (dados.riscoIntegrado > pior.risco) {
      pior = { nome: zona, risco: dados.riscoIntegrado };
    }
  }
  
  return pior;
}

// ============================================================================
// 6. INTEGRAÇÃO COM COLAB.PY - ENDPOINTS DE DADOS
// ============================================================================

/**
 * Endpoint para fornecer dados de IQA ao colab.py via API.
 * @return {Object} Dados formatados para o gráfico radar
 */
function getIQADataForColab() {
  // Dados das 6 zonas do lago
  const zonas = ['RIACHO_FUNDO', 'GAMA', 'BANANAL', 'TORTO', 'LAGO_NORTE', 'BARRAGEM'];
  
  const dadosParaColab = zonas.map(zona => {
    // Simular busca de dados reais da planilha
    const dados = obterDadosZona_(zona) || getDadosSimulados_(zona);
    const iqa = calcularIQA(dados);
    
    return {
      zona: zona.replace('_', ' '),
      iqa: iqa.valor,
      categoria: iqa.categoria.nivel,
      subindices: {
        OD: iqa.subindices.OD,
        DBO: iqa.subindices.DBO,
        Coliformes: iqa.subindices.COLIFORMES,
        pH: iqa.subindices.PH,
        Nitrato: iqa.subindices.NITROGENIO,
        Fosfato: iqa.subindices.FOSFORO,
        Turbidez: iqa.subindices.TURBIDEZ,
        Temperatura: iqa.subindices.TEMPERATURA,
        Sólidos: iqa.subindices.SOLIDOS
      }
    };
  });
  
  return {
    data: dadosParaColab,
    timestamp: new Date().toISOString(),
    metodo: 'CETESB_IQA'
  };
}

/**
 * Endpoint para fornecer dados de eutrofização ao colab.py.
 * @return {Object} Dados para gráfico de eutrofização
 */
function getEutrophicationDataForColab() {
  const zonas = Object.keys(LIMNOLOGIA_CONSTANTS.ZONAS);
  
  return zonas.map(zona => {
    const dados = obterDadosZona_(zona) || getDadosSimulados_(zona);
    const iet = calcularIET(dados.fosforo * 1000, dados.clorofila || 10, dados.secchi || 1.5);
    
    return {
      zona: zona.replace('_', ' '),
      fosforoTotal: dados.fosforo * 1000,
      clorofilaA: dados.clorofila || 10,
      ietMedio: iet.ietMedio,
      estado: iet.classificacao.estado,
      limiteConama: 30,
      excedeLimite: dados.fosforo * 1000 > 30
    };
  });
}

/**
 * Endpoint para fornecer série temporal ao colab.py.
 * @param {string} parametro - Nome do parâmetro (fosforo, od, turbidez)
 * @param {number} meses - Quantidade de meses
 * @return {Object} Série temporal com análise
 */
function getTimeSeriesDataForColab(parametro, meses = 12) {
  const dados = obterSerieHistorica_(parametro, meses);
  const analise = analisarSerieTemporal(dados.values, parametro);
  
  return {
    parametro: parametro,
    serie: dados.values,
    datas: dados.dates,
    analise: analise,
    limiteConama: LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA[parametro.toUpperCase()].max || null
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

function obterDadosZona_(zona) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('DadosLimnologicos');
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Buscar última linha da zona
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][headers.indexOf('zona')] === zona) {
        return {
          od: data[i][headers.indexOf('od')],
          dbo: data[i][headers.indexOf('dbo')],
          coliformes: data[i][headers.indexOf('coliformes')],
          ph: data[i][headers.indexOf('ph')],
          nitrogenio: data[i][headers.indexOf('nitrogenio')],
          fosforo: data[i][headers.indexOf('fosforo')],
          turbidez: data[i][headers.indexOf('turbidez')],
          temperatura: data[i][headers.indexOf('temperatura')],
          solidos: data[i][headers.indexOf('solidos')]
        };
      }
    }
  } catch (e) {
    console.log('Dados reais não disponíveis, usando simulados');
  }
  return null;
}

function getDadosSimulados_(zona) {
  // Dados baseados em estudos reais do Lago Paranoá
  const simulacoes = {
    'RIACHO_FUNDO': { od: 4.5, dbo: 8, coliformes: 2500, ph: 7.2, nitrogenio: 3.5, fosforo: 0.085, turbidez: 45, temperatura: 4, solidos: 180 },
    'GAMA': { od: 5.2, dbo: 6, coliformes: 1800, ph: 7.4, nitrogenio: 2.8, fosforo: 0.072, turbidez: 35, temperatura: 3, solidos: 150 },
    'BANANAL': { od: 6.5, dbo: 4, coliformes: 800, ph: 7.6, nitrogenio: 1.8, fosforo: 0.045, turbidez: 22, temperatura: 2, solidos: 120 },
    'TORTO': { od: 7.0, dbo: 3, coliformes: 500, ph: 7.8, nitrogenio: 1.2, fosforo: 0.038, turbidez: 18, temperatura: 2, solidos: 100 },
    'LAGO_NORTE': { od: 8.2, dbo: 2, coliformes: 150, ph: 8.0, nitrogenio: 0.8, fosforo: 0.022, turbidez: 8, temperatura: 1, solidos: 80 },
    'BARRAGEM': { od: 8.5, dbo: 1.5, coliformes: 100, ph: 8.1, nitrogenio: 0.6, fosforo: 0.018, turbidez: 5, temperatura: 1, solidos: 70 }
  };
  
  return simulacoes[zona] || simulacoes['BARRAGEM'];
}

function obterSerieHistorica_(parametro, meses) {
  const values = [];
  const dates = [];
  const hoje = new Date();
  
  for (let i = meses - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 15);
    dates.push(data.toISOString().split('T')[0]);
    
    // Simular valores com sazonalidade
    const mes = data.getMonth() + 1;
    const baseValue = getBaseValue_(parametro);
    const sazonalidade = (mes >= 10 || mes <= 3) ? 1.3 : 0.85; // Chuva vs Seca
    const ruido = (Math.random() - 0.5) * 0.2;
    
    values.push({
      data: data,
      valor: Math.round(baseValue * sazonalidade * (1 + ruido) * 100) / 100
    });
  }
  
  return { values, dates };
}

function getBaseValue_(parametro) {
  const bases = {
    'fosforo': 40, 'od': 6.5, 'turbidez': 25, 'clorofila': 15,
    'coliformes': 800, 'ph': 7.5, 'nitrogenio': 1.5
  };
  return bases[parametro] || 10;
}

// ============================================================================
// EXPORTS PARA TESTES
// ============================================================================

const LimnologiaAnalytics = {
  calcularIQA,
  calcularIET,
  calcularMatrizCorrelacao,
  analisarSerieTemporal,
  calcularMapaRisco,
  getIQADataForColab,
  getEutrophicationDataForColab,
  getTimeSeriesDataForColab,
  classificarIQA: classificarIQAServico, // Export alias for tests expecting this name
  CONSTANTS: LIMNOLOGIA_CONSTANTS
};
