/**
 * @file VisualizacaoChartService.gs
 * @project LAGO_PARANOA - Recursos Hídricos
 * @category visualizacao
 * @tags charts, google-charts, dashboard, graficos
 * @architecture Server-Side Chart Generation
 * @description Serviço de geração de gráficos nativos do Google Apps Script.
 * Complementa o colab.py gerando visualizações diretamente no Google Sheets.
 * @context Visualizações interativas para dashboard web e Google Sheets
 */

// ============================================================================
// CONFIGURAÇÃO DE ESTILOS (Design System)
// ============================================================================

const CHART_STYLES = {
  // Paleta de cores do Lago Paranoá (Padronização Visual)
  COLORS: {
    primary: '#0288D1',      // Azul Engenharia (Água Profunda)
    secondary: '#2E7D32',    // Verde Mata (Vegetação Ripária)
    accent: '#00BCD4',       // Ciano (Inovação/Tecnologia)
    danger: '#D32F2F',       // Vermelho Alerta (Crítico)
    warning: '#FBC02D',      // Amarelo Atenção (Médio Risco)
    success: '#388E3C',      // Verde Sucesso (Qualidade Boa)
    info: '#1976D2',         // Azul Informação
    muted: '#757575',        // Cinza Neutro
    surface: '#FFFFFF',      // Branco Superfície
    background: '#F5F7FA',   // Cinza Fundo Suave
    
    // Gradiente para IQA
    IQA_GRADIENT: ['#D32F2F', '#FBC02D', '#FFEB3B', '#388E3C', '#0288D1'],
    
    // Cores das zonas (Mapeamento Geográfico)
    ZONAS: {
      RIACHO_FUNDO: '#C62828', // Vermelho Escuro (Alta Carga)
      GAMA: '#EF6C00',         // Laranja (Carga Média)
      BANANAL: '#F9A825',      // Amarelo Ouro
      TORTO: '#558B2F',        // Verde Oliva
      LAGO_NORTE: '#0097A7',   // Ciano Escuro
      BARRAGEM: '#1565C0'      // Azul Escuro (Profundo)
    }
  },
  
  // Tipografia Padronizada
  FONTS: {
    title: { fontName: 'Roboto', fontSize: 16, bold: true },
    subtitle: { fontName: 'Roboto', fontSize: 12, italic: true },
    axis: { fontName: 'Roboto', fontSize: 10 },
    legend: { fontName: 'Roboto', fontSize: 9 }
  },
  
  // Dimensões padrão
  DIMENSIONS: {
    small: { width: 400, height: 300 },
    medium: { width: 600, height: 400 },
    large: { width: 800, height: 500 },
    fullWidth: { width: 1000, height: 450 }
  }
};

// ============================================================================
// 1. GRÁFICOS PARA GOOGLE SHEETS (Charts API)
// ============================================================================

/**
 * Cria gráfico de barras de eutrofização diretamente no Sheets.
 * Equivalente ao grafico_01_eutrofizacao.png do colab.py
 * 
 * @param {Sheet} sheet - Aba do Sheets onde criar o gráfico
 * @param {Object} options - Opções de posicionamento
 * @return {EmbeddedChart} Gráfico embarcado
 */
function criarGraficoEutrofizacaoSheets(sheet, options = {}) {
  const dados = LimnologiaAnalytics.getEutrophicationDataForColab();
  
  // Preparar dados na planilha
  const dataStartRow = options.startRow || 1;
  const dataStartCol = options.startCol || 1;
  
  // Cabeçalhos
  sheet.getRange(dataStartRow, dataStartCol, 1, 3).setValues([
    ['Zona', 'Fósforo Total (µg/L)', 'Clorofila-a (µg/L)']
  ]);
  
  // Dados
  const values = dados.map(d => [d.zona, d.fosforoTotal, d.clorofilaA]);
  sheet.getRange(dataStartRow + 1, dataStartCol, values.length, 3).setValues(values);
  
  // Criar gráfico
  const chartBuilder = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sheet.getRange(dataStartRow, dataStartCol, values.length + 1, 3))
    .setPosition(options.chartRow || 1, options.chartCol || 5, 0, 0)
    .setOption('title', '🌊 Indicadores de Eutrofização - Lago Paranoá')
    .setOption('titleTextStyle', CHART_STYLES.FONTS.title)
    .setOption('legend', { position: 'top' })
    .setOption('colors', [CHART_STYLES.COLORS.danger, CHART_STYLES.COLORS.secondary])
    .setOption('hAxis', { 
      title: 'Zona do Lago',
      titleTextStyle: CHART_STYLES.FONTS.axis,
      slantedText: true
    })
    .setOption('vAxis', { 
      title: 'Concentração',
      titleTextStyle: CHART_STYLES.FONTS.axis
    })
    .setOption('width', CHART_STYLES.DIMENSIONS.medium.width)
    .setOption('height', CHART_STYLES.DIMENSIONS.medium.height);
  
  const chart = chartBuilder.build();
  sheet.insertChart(chart);
  
  console.log('✅ Gráfico de eutrofização criado no Sheets');
  return chart;
}

/**
 * Cria gráfico de série temporal no Sheets.
 * Equivalente ao grafico_03_serie_temporal.png do colab.py
 */
function criarGraficoSerieTemporalSheets(sheet, parametro = 'fosforo', options = {}) {
  const dados = LimnologiaAnalytics.getTimeSeriesDataForColab(parametro, 12);
  
  const dataStartRow = options.startRow || 1;
  const dataStartCol = options.startCol || 1;
  
  // Cabeçalhos
  sheet.getRange(dataStartRow, dataStartCol, 1, 2).setValues([
    ['Data', capitalize_(parametro)]
  ]);
  
  // Dados
  const values = dados.serie.map(d => [d.data, d.valor]);
  sheet.getRange(dataStartRow + 1, dataStartCol, values.length, 2).setValues(values);
  
  const chartBuilder = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(sheet.getRange(dataStartRow, dataStartCol, values.length + 1, 2))
    .setPosition(options.chartRow || 15, options.chartCol || 1, 0, 0)
    .setOption('title', `📈 Série Temporal - ${capitalize_(parametro)}`)
    .setOption('curveType', 'function')
    .setOption('lineWidth', 3)
    .setOption('pointSize', 5)
    .setOption('colors', [CHART_STYLES.COLORS.primary])
    .setOption('hAxis', { 
      title: 'Data',
      format: 'MMM yyyy',
      gridlines: { count: 6 }
    })
    .setOption('vAxis', { 
      title: getUnidade_(parametro),
      viewWindow: { min: 0 }
    })
    .setOption('width', CHART_STYLES.DIMENSIONS.fullWidth.width)
    .setOption('height', CHART_STYLES.DIMENSIONS.medium.height);
  
  // Adicionar linha de limite CONAMA se aplicável
  const limite = LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA[parametro.toUpperCase()];
  if (limite && limite.max) {
    chartBuilder.setOption('annotations', {
      style: 'line'
    });
  }
  
  const chart = chartBuilder.build();
  sheet.insertChart(chart);
  
  console.log(`✅ Gráfico de série temporal (${parametro}) criado`);
  return chart;
}

/**
 * Cria gráfico de pizza para distribuição de riscos.
 */
function criarGraficoRiscosPizza(sheet, options = {}) {
  const mapaRisco = LimnologiaAnalytics.calcularMapaRisco(getDefaultZoneData_());
  
  const dataStartRow = options.startRow || 1;
  const dataStartCol = options.startCol || 1;
  
  // Contar zonas por nível de risco
  const contagem = { CRÍTICO: 0, ALTO: 0, MODERADO: 0, BAIXO: 0 };
  
  for (const zona in mapaRisco.mapaRisco) {
    const nivel = mapaRisco.mapaRisco[zona].classificacao.nivel;
    contagem[nivel]++;
  }
  
  sheet.getRange(dataStartRow, dataStartCol, 1, 2).setValues([['Nível de Risco', 'Zonas']]);
  
  const values = Object.entries(contagem).filter(([_, v]) => v > 0);
  sheet.getRange(dataStartRow + 1, dataStartCol, values.length, 2).setValues(values);
  
  const chartBuilder = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sheet.getRange(dataStartRow, dataStartCol, values.length + 1, 2))
    .setPosition(options.chartRow || 1, options.chartCol || 8, 0, 0)
    .setOption('title', '⚠️ Distribuição de Risco Ambiental')
    .setOption('pieSliceText', 'value')
    .setOption('colors', [
      CHART_STYLES.COLORS.danger,
      CHART_STYLES.COLORS.warning,
      CHART_STYLES.COLORS.warning,
      CHART_STYLES.COLORS.success
    ])
    .setOption('width', CHART_STYLES.DIMENSIONS.small.width)
    .setOption('height', CHART_STYLES.DIMENSIONS.small.height);
  
  const chart = chartBuilder.build();
  sheet.insertChart(chart);
  
  return chart;
}

// ============================================================================
// 2. GRÁFICOS PARA WEB (HTML/VISUALIZATION API)
// ============================================================================

/**
 * Gera dados para Google Charts no frontend web.
 * @param {string} chartType - Tipo de gráfico
 * @return {Object} Dados formatados para Google Visualization API
 */
function getChartDataForWeb(chartType) {
  switch (chartType) {
    case 'eutrofizacao':
      return formatEutrofizacaoForWeb_();
      
    case 'iqa_radar':
      return formatIQARadarForWeb_();
      
    case 'serie_temporal':
      return formatSerieTemporalForWeb_();
      
    case 'mapa_risco':
      return formatMapaRiscoForWeb_();
      
    case 'gauge_od':
      return formatGaugeODForWeb_();
      
    case 'balneabilidade':
      return formatBalneabilidadeForWeb_();
      
    default:
      return { error: 'Tipo de gráfico desconhecido' };
  }
}

function formatEutrofizacaoForWeb_() {
  const dados = LimnologiaAnalytics.getEutrophicationDataForColab();
  
  return {
    chartType: 'ColumnChart',
    dataTable: {
      cols: [
        { label: 'Zona', type: 'string' },
        { label: 'Fósforo Total (µg/L)', type: 'number' },
        { label: 'Clorofila-a (µg/L)', type: 'number' },
        { label: 'Limite CONAMA P', type: 'number', role: 'annotation' }
      ],
      rows: dados.map(d => ({
        c: [
          { v: d.zona },
          { v: d.fosforoTotal },
          { v: d.clorofilaA },
          { v: 30 }
        ]
      }))
    },
    options: {
      title: '🌊 Indicadores de Eutrofização - Lago Paranoá',
      titleTextStyle: { fontSize: 18, bold: true },
      legend: { position: 'top', maxLines: 2 },
      colors: [CHART_STYLES.COLORS.danger, CHART_STYLES.COLORS.secondary],
      hAxis: { title: 'Zona do Lago', slantedText: true },
      vAxis: { title: 'Concentração', minValue: 0 },
      annotations: { highContrast: true },
      chartArea: { width: '80%', height: '70%' },
      bar: { groupWidth: '75%' }
    }
  };
}

function formatIQARadarForWeb_() {
  const dados = LimnologiaAnalytics.getIQADataForColab();
  
  // Google Charts não tem radar nativo, usar LineChart com múltiplas séries
  const categorias = ['OD', 'DBO', 'Coliformes', 'pH', 'Nitrato', 'Fosfato', 'Turbidez', 'Temperatura', 'Sólidos'];
  
  // Pegar duas zonas extremas para comparação (oligotrófico vs eutrófico)
  const lagoNorte = dados.data.find(d => d.zona.includes('LAGO NORTE'));
  const riachoFundo = dados.data.find(d => d.zona.includes('RIACHO FUNDO'));
  
  return {
    chartType: 'LineChart',
    dataTable: {
      cols: [
        { label: 'Parâmetro', type: 'string' },
        { label: 'Lago Norte (Oligotrófico)', type: 'number' },
        { label: 'Riacho Fundo (Eutrófico)', type: 'number' }
      ],
      rows: categorias.map(cat => ({
        c: [
          { v: cat },
          { v: lagoNorte?.subindices[cat] || 80 },
          { v: riachoFundo?.subindices[cat] || 40 }
        ]
      }))
    },
    options: {
      title: '📊 Comparativo IQA - Zonas Extremas',
      curveType: 'function',
      legend: { position: 'top' },
      colors: [CHART_STYLES.COLORS.primary, CHART_STYLES.COLORS.danger],
      pointSize: 8,
      lineWidth: 3,
      hAxis: { title: 'Parâmetro' },
      vAxis: { title: 'Subíndice (0-100)', minValue: 0, maxValue: 100 }
    }
  };
}

function formatSerieTemporalForWeb_() {
  const fosforoData = LimnologiaAnalytics.getTimeSeriesDataForColab('fosforo', 12);
  const odData = LimnologiaAnalytics.getTimeSeriesDataForColab('od', 12);
  
  return {
    chartType: 'ComboChart',
    dataTable: {
      cols: [
        { label: 'Data', type: 'date' },
        { label: 'Fósforo (µg/L)', type: 'number' },
        { label: 'OD (mg/L)', type: 'number' }
      ],
      rows: fosforoData.serie.map((f, i) => ({
        c: [
          { v: new Date(f.data) },
          { v: f.valor },
          { v: odData.serie[i]?.valor || 6 }
        ]
      }))
    },
    options: {
      title: '📈 Série Temporal - Fósforo e OD',
      seriesType: 'line',
      curveType: 'function',
      series: {
        0: { targetAxisIndex: 0, color: CHART_STYLES.COLORS.danger },
        1: { targetAxisIndex: 1, color: CHART_STYLES.COLORS.primary }
      },
      vAxes: {
        0: { title: 'Fósforo (µg/L)' },
        1: { title: 'OD (mg/L)' }
      },
      hAxis: { title: 'Data', format: 'MMM yyyy' },
      legend: { position: 'top' }
    }
  };
}

function formatMapaRiscoForWeb_() {
  const mapaRisco = LimnologiaAnalytics.calcularMapaRisco(getDefaultZoneData_());
  
  const zonas = Object.keys(mapaRisco.mapaRisco);
  
  return {
    chartType: 'BarChart',
    dataTable: {
      cols: [
        { label: 'Zona', type: 'string' },
        { label: 'Eutrofização', type: 'number' },
        { label: 'Contaminação', type: 'number' },
        { label: 'Sedimentos', type: 'number' },
        { label: 'Cianobactérias', type: 'number' }
      ],
      rows: zonas.map(z => {
        const d = mapaRisco.mapaRisco[z];
        return {
          c: [
            { v: z.replace('_', ' ') },
            { v: d.riscoEutrofizacao },
            { v: d.riscoContaminacao },
            { v: d.riscoSedimentos },
            { v: d.riscoCianobacterias }
          ]
        };
      })
    },
    options: {
      title: '⚠️ Mapa de Risco Ambiental por Zona',
      isStacked: false,
      colors: [
        CHART_STYLES.COLORS.danger,
        CHART_STYLES.COLORS.warning,
        CHART_STYLES.COLORS.info,
        CHART_STYLES.COLORS.muted
      ],
      hAxis: { title: 'Índice de Risco (%)' },
      vAxis: { title: 'Zona' },
      legend: { position: 'top', maxLines: 2 },
      chartArea: { width: '65%', height: '75%' }
    }
  };
}

function formatGaugeODForWeb_() {
  const dados = LimnologiaAnalytics.getIQADataForColab();
  const lagoNorte = dados.data.find(d => d.zona.includes('LAGO NORTE'));
  const riachoFundo = dados.data.find(d => d.zona.includes('RIACHO FUNDO'));
  
  return {
    chartType: 'Gauge',
    dataTable: {
      cols: [
        { label: 'Zona', type: 'string' },
        { label: 'OD', type: 'number' }
      ],
      rows: [
        { c: [{ v: 'Lago Norte' }, { v: lagoNorte?.subindices?.OD || 85 }] },
        { c: [{ v: 'Riacho Fundo' }, { v: riachoFundo?.subindices?.OD || 45 }] }
      ]
    },
    options: {
      width: 300,
      height: 120,
      redFrom: 0, redTo: 30,
      yellowFrom: 30, yellowTo: 60,
      greenFrom: 60, greenTo: 100,
      minorTicks: 5
    }
  };
}

function formatBalneabilidadeForWeb_() {
  // Dados simulados de balneabilidade por ponto
  const pontos = [
    { nome: 'Pontão Lago Sul', proprio: 85, improprio: 15 },
    { nome: 'Pier 21', proprio: 78, improprio: 22 },
    { nome: 'Prainha Vila Planalto', proprio: 45, improprio: 55 },
    { nome: 'Ermida Dom Bosco', proprio: 92, improprio: 8 },
    { nome: 'Gilberto Salomão', proprio: 72, improprio: 28 },
    { nome: 'Deck Norte', proprio: 88, improprio: 12 }
  ];
  
  return {
    chartType: 'BarChart',
    dataTable: {
      cols: [
        { label: 'Ponto', type: 'string' },
        { label: 'Própria (%)', type: 'number' },
        { label: 'Imprópria (%)', type: 'number' }
      ],
      rows: pontos.map(p => ({
        c: [
          { v: p.nome },
          { v: p.proprio },
          { v: p.improprio }
        ]
      }))
    },
    options: {
      title: '🏊 Balneabilidade - Praias do Lago Paranoá',
      isStacked: true,
      colors: [CHART_STYLES.COLORS.success, CHART_STYLES.COLORS.danger],
      hAxis: { title: '% Amostras' },
      chartArea: { width: '60%' },
      legend: { position: 'top' }
    }
  };
}

// ============================================================================
// 3. GERAÇÃO DE DASHBOARD COMPLETO
// ============================================================================

/**
 * Cria dashboard completo com todos os gráficos no Sheets.
 * @param {string} sheetName - Nome da aba para o dashboard
 */
function criarDashboardCompleto(sheetName = 'Dashboard_Limnologia') {
  console.log('📊 Iniciando criação do dashboard completo...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    sheet.clear();
    // Remover gráficos existentes
    sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  } else {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Cabeçalho do dashboard
  sheet.getRange('A1:L1').merge()
    .setValue('🌊 DASHBOARD LIMNOLÓGICO - LAGO PARANOÁ')
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#2563EB')
    .setFontColor('white');
  
  sheet.getRange('A2:L2').merge()
    .setValue(`Última atualização: ${new Date().toLocaleString('pt-BR')}`)
    .setHorizontalAlignment('center')
    .setFontStyle('italic');
  
  // Gráfico 1: Eutrofização
  criarGraficoEutrofizacaoSheets(sheet, {
    startRow: 4, startCol: 1,
    chartRow: 4, chartCol: 5
  });
  
  // Gráfico 2: Série Temporal (Fósforo)
  criarGraficoSerieTemporalSheets(sheet, 'fosforo', {
    startRow: 15, startCol: 1,
    chartRow: 15, chartCol: 5
  });
  
  // Gráfico 3: Distribuição de Riscos
  criarGraficoRiscosPizza(sheet, {
    startRow: 30, startCol: 1,
    chartRow: 4, chartCol: 12
  });
  
  // Tabela resumo IQA
  criarTabelaResumoIQA_(sheet, 30, 5);
  
  // Alertas críticos
  criarSecaoAlertas_(sheet, 45, 1);
  
  // Formatação final
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 100);
  
  console.log('✅ Dashboard completo criado com sucesso!');
  
  return sheet.getSheetId();
}

function criarTabelaResumoIQA_(sheet, startRow, startCol) {
  const dados = LimnologiaAnalytics.getIQADataForColab();
  
  // Título
  sheet.getRange(startRow, startCol, 1, 4).merge()
    .setValue('📊 Resumo IQA por Zona')
    .setFontWeight('bold')
    .setBackground('#E5E7EB');
  
  // Cabeçalhos
  sheet.getRange(startRow + 1, startCol, 1, 4)
    .setValues([['Zona', 'IQA', 'Categoria', 'Status']])
    .setFontWeight('bold');
  
  // Dados
  dados.data.forEach((d, i) => {
    sheet.getRange(startRow + 2 + i, startCol, 1, 4)
      .setValues([[d.zona, d.iqa, d.categoria, getStatusEmoji_(d.categoria)]]);
  });
  
  // Formatação condicional
  const range = sheet.getRange(startRow + 2, startCol + 1, dados.data.length, 1);
  const rules = sheet.getConditionalFormatRules();
  
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(37)
    .setBackground('#FECACA')
    .setRanges([range])
    .build());
  
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(37, 52)
    .setBackground('#FEF3C7')
    .setRanges([range])
    .build());
  
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(52)
    .setBackground('#D1FAE5')
    .setRanges([range])
    .build());
  
  sheet.setConditionalFormatRules(rules);
}

function criarSecaoAlertas_(sheet, startRow, startCol) {
  sheet.getRange(startRow, startCol, 1, 6).merge()
    .setValue('🚨 ALERTAS ATIVOS')
    .setFontWeight('bold')
    .setBackground('#DC2626')
    .setFontColor('white');
  
  const alertas = gerarAlertasAtivos_();
  
  if (alertas.length === 0) {
    sheet.getRange(startRow + 1, startCol, 1, 6).merge()
      .setValue('✅ Nenhum alerta ativo no momento')
      .setBackground('#D1FAE5');
  } else {
    alertas.forEach((alerta, i) => {
      sheet.getRange(startRow + 1 + i, startCol, 1, 6).merge()
        .setValue(`${alerta.emoji} ${alerta.zona}: ${alerta.mensagem}`)
        .setBackground(alerta.nivel === 'CRÍTICO' ? '#FEE2E2' : '#FEF3C7');
    });
  }
}

function gerarAlertasAtivos_() {
  const alertas = [];
  const mapaRisco = LimnologiaAnalytics.calcularMapaRisco(getDefaultZoneData_());
  
  for (const [zona, dados] of Object.entries(mapaRisco.mapaRisco)) {
    if (dados.classificacao.nivel === 'CRÍTICO') {
      alertas.push({
        zona: zona.replace('_', ' '),
        nivel: 'CRÍTICO',
        emoji: '🚨',
        mensagem: `Risco integrado ${dados.riscoIntegrado}% - Ação imediata requerida`
      });
    } else if (dados.classificacao.nivel === 'ALTO') {
      alertas.push({
        zona: zona.replace('_', ' '),
        nivel: 'ALTO',
        emoji: '⚠️',
        mensagem: `Risco ${dados.riscoIntegrado}% - Monitoramento intensificado`
      });
    }
  }
  
  return alertas.sort((a, b) => b.nivel === 'CRÍTICO' ? 1 : -1);
}

// ============================================================================
// 4. EXPORTAÇÃO DE GRÁFICOS COMO IMAGEM
// ============================================================================

/**
 * Exporta gráfico do Sheets como imagem (Blob).
 * @param {EmbeddedChart} chart - Gráfico embarcado
 * @return {Blob} Imagem do gráfico
 */
function exportChartAsImage(chart) {
  return chart.getAs('image/png');
}

/**
 * Salva gráfico no Google Drive.
 * @param {EmbeddedChart} chart - Gráfico
 * @param {string} filename - Nome do arquivo
 * @param {string} folderId - ID da pasta no Drive
 * @return {File} Arquivo criado
 */
function saveChartToDrive(chart, filename, folderId) {
  const blob = exportChartAsImage(chart);
  blob.setName(filename);
  
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  
  console.log(`✅ Gráfico salvo: ${file.getUrl()}`);
  return file;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function capitalize_(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getUnidade_(parametro) {
  const unidades = {
    fosforo: 'µg/L',
    od: 'mg/L',
    turbidez: 'NTU',
    clorofila: 'µg/L',
    ph: '-',
    temperatura: '°C'
  };
  return unidades[parametro] || '';
}

function getStatusEmoji_(categoria) {
  const emojis = {
    'ÓTIMA': '🌟',
    'BOA': '✅',
    'ACEITÁVEL': '⚠️',
    'RUIM': '🔶',
    'PÉSSIMA': '🚨'
  };
  return emojis[categoria] || '❓';
}

function getDefaultZoneData_() {
  return {
    RIACHO_FUNDO: { fosforo: 85, clorofila: 45, coliformes: 2500, turbidez: 45 },
    GAMA: { fosforo: 72, clorofila: 38, coliformes: 1800, turbidez: 35 },
    BANANAL: { fosforo: 45, clorofila: 22, coliformes: 800, turbidez: 22 },
    TORTO: { fosforo: 38, clorofila: 18, coliformes: 500, turbidez: 18 },
    LAGO_NORTE: { fosforo: 22, clorofila: 8, coliformes: 150, turbidez: 8 },
    BARRAGEM: { fosforo: 18, clorofila: 6, coliformes: 100, turbidez: 5 }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const ChartService = {
  criarGraficoEutrofizacaoSheets,
  criarGraficoSerieTemporalSheets,
  criarGraficoRiscosPizza,
  criarDashboardCompleto,
  getChartDataForWeb,
  exportChartAsImage,
  saveChartToDrive,
  STYLES: CHART_STYLES
};
