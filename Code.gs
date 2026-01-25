/**
 * Cria o menu principal no Google Sheets.
 * Executado automaticamente ao abrir a planilha.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌊 Sistema Lago Paranoá')
      .addItem('☰ Menu Principal (Grid)', 'showMainMenu') // Novo Menu Visual
      .addSeparator()
      .addItem('1. Inicializar Banco de Dados', 'setupEnvironment')
      .addItem('2. Inserir Amostra (Manual)', 'testLogData')
      .addSeparator()
      .addItem('📊 Relatório de Eutrofização', 'runEutrophicationReport')
      .addItem('🧪 Análise de Sedimentos', 'runSedimentAnalysis')
      .addSeparator()
      .addItem('⚡ Executar Testes', 'runTests')
      .addToUi();
}

/**
 * Exibe o Menu Principal em Grid 6x4.
 * Centraliza o acesso a todas as funcionalidades do sistema.
 */
function showMainMenu() {
  var html = HtmlService.createHtmlOutputFromFile('MenuPrincipal')
      .setWidth(1000)
      .setHeight(700)
      .setTitle('Sistema de Gestão Integrada - Lago Paranoá');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/**
 * Inicializa o ambiente e garante a presença dos dados sintéticos de calibração.
 */
function setupEnvironment() {
  setupSheet(); 
  SpreadsheetApp.getUi().alert('✅ Ambiente configurado com sucesso!\n\n4 cenários limnológicos inseridos:\n- Oligotrófico (Lago Norte)\n- Mesotrófico (Barragem)\n- Eutrófico (Riacho Fundo)\n- Anóxico (Braço Torto)');
}

/**
 * Executa relatório de eutrofização.
 * Calcula IET (Índice de Estado Trófico) por zona da bacia.
 */
function runEutrophicationReport() {
  var report = gerarRelatorioEutrofizacao();
  if(report.success) {
    Logger.log(report.data);
    SpreadsheetApp.getUi().alert('📊 Relatório gerado nos Logs.\n\nAcesse: View → Logs para ver estatísticas por zona.');
  } else {
    SpreadsheetApp.getUi().alert('❌ Erro: ' + report.message);
  }
}

/**
 * Executa análise geoquímica de sedimentos.
 * Avalia risco de liberação de fósforo por carga interna.
 */
function runSedimentAnalysis() {
  var sediments = loadSedimentData();
  Logger.log('Análise Geoquímica de Sedimentos:');
  Logger.log(JSON.stringify(sediments, null, 2));
  SpreadsheetApp.getUi().alert('🧪 Análise de sedimentos disponível nos Logs (View → Logs).');
}

/**
 * Insere amostra de teste para validação do schema.
 */
function testLogData() {
  var sampleData = {
    id: new Date().getTime().toString(),
    date: new Date(),
    zone: "Lago Sul (Pontão)",
    ph: 7.5,
    do: 7.1,
    turbidity: 3.5,
    totalPhosphorus: 0.025,
    chlorophyll: 8.0,
    microplastics: 300,
    riskStatus: "LOW_RISK"
  };
  appendEnvironmentalData(sampleData);
  SpreadsheetApp.getUi().alert('✅ Amostra inserida com sucesso!');
}

/**
 * Registra navegação para análise de engajamento público (Seção 7.3 - Controle Social).
 * @param {string} sectionId - Identificador da seção navegada
 */
function logNavigationEvent(sectionId) {
  Logger.log('🔍 Navegação Cidadã detectada: ' + sectionId);
}

/**
 * Retorna dados geoquímicos para Relatório de Sedimentos.
 * Alinha com Relatorio.md - Seções 4.1 (Histerese/Bomba Interna) e 6.1 (Antropoceno).
 */
function loadSedimentData() {
  return [
    {
      zone: 'Braço do Riacho Fundo',
      p_load: 'CRÍTICO',
      redox: -150, // mV (Anoxia severa → Liberação de P)
      risk_percent: 85,
      microplastics_concentration: 'HIGH',
      internal_load_active: true
    },
    {
      zone: 'Lago Norte (Margem)',
      p_load: 'MODERADO',
      redox: 80,
      risk_percent: 30,
      microplastics_concentration: 'VERY_HIGH', // Fibras sintéticas de lavagem
      internal_load_active: false
    },
    {
      zone: 'Barragem do Paranoá',
      p_load: 'BAIXO',
      redox: 200,
      risk_percent: 10,
      microplastics_concentration: 'MODERATE',
      internal_load_active: false
    }
  ];
}

/**
 * Obtém dados harmonizados para o Dashboard Ambiental.
 * Lê da planilha "Monitoramento_Ambiental" criada por Sheets.gs.
 */
function getDashboardData() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Remove cabeçalho e mapeia para formato do frontend
    return data.slice(1).map(row => ({
        id: row[0],
        data: row[1],
        midia: row[2],      // Zona_Bacia
        indicador: 'Multiparâmetros', 
        valor: `P: ${row[6]} mg/L | Clo-a: ${row[7]} µg/L | OD: ${row[4]} mg/L`,
        risco: row[9]       // Coluna J: Risco_Calculado
      }));
  } catch (e) {
    throw new Error("Erro ao buscar dados limnológicos: " + e.message);
  }
}

/**
 * Recebe denúncias de ciência cidadã com GPS real.
 * Versão atualizada com validação geoespacial.
 */
function submitOccurrence(report) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let ws = ss.getSheetByName("Denuncias_Cidadas");
    if (!ws) ws = ss.insertSheet("Denuncias_Cidadas");
    
    // Valida coordenadas GPS
    let coords = null;
    if (report.midia && report.midia.includes(',')) {
      const parts = report.midia.split(',');
      coords = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
      
      // Valida se está na região
      const geoModel = GeoLocationModel();
      if (!geoModel.isInLagoRegion(coords.lat, coords.lng)) {
        Logger.log('⚠️ Coordenadas fora da região do Lago Paranoá');
      }
      
      // Identifica zona específica
      const zones = geoModel.checkZone(coords.lat, coords.lng);
      report.zona = zones[0].name;
      report.risco = zones[0].risk;
    }
    
    let calculatedRisk = 'EM_ANALISE';
    
    // Classificação automática
    if (String(report.indicador).toLowerCase().includes('esgoto')) 
      calculatedRisk = 'ALTO_RISCO_SANITARIO';
    else if (String(report.indicador).toLowerCase().includes('peixe morto'))
      calculatedRisk = 'ANOXIA_SUSPEITA';
    else if (report.risco && report.risco.includes('CRÍTICO'))
      calculatedRisk = 'AREA_CRITICA_IDENTIFICADA';

    // Adiciona timestamp e ID único
    const reportId = 'DEN-' + new Date().getTime();
    
    ws.appendRow([
      reportId,
      new Date(),
      report.midia,      // GPS: "lat,lng"
      report.indicador,  // Tipo
      report.valor || report.descricao || '', // Descrição
      calculatedRisk,
      report.zona || '',
      report.precisao || '', // Precisão GPS em metros
      ""                 // Ação Tomada
    ]);
    
    Logger.log(`✅ Denúncia ${reportId} registrada - Zona: ${report.zona || 'N/A'}`);
    
    return "✅ Denúncia registrada com sucesso!\nProtocolo: " + reportId;
  } catch (e) {
    throw new Error("Erro ao salvar ocorrência: " + e.message);
  }
}

/**
 * Valida se coordenadas GPS estão na região do Lago
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @return {Object} Resultado da validação
 */
function validateGPSLocation(lat, lng) {
  const geoModel = GeoLocationModel();
  const isValid = geoModel.isInLagoRegion(lat, lng);
  const zones = geoModel.checkZone(lat, lng);
  
  return {
    valid: isValid,
    zone: zones[0],
    coords: { lat: lat, lng: lng }
  };
}

/**
 * Função para buscar os 12 gráficos mais recentes do Google Drive.
 * É recomendado criar uma pasta específica chamada "Graficos_Lago_Paranoa".
 */
function getDashboardCharts() {
  var folderName = "Graficos_Lago_Paranoa";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    // Se não existir, usa a raiz (não recomendado para produção) ou cria
    // folder = DriveApp.getRootFolder();
    return { error: "Pasta '" + folderName + "' não encontrada." };
  }

  var files = folder.getFilesByType(MimeType.PNG);
  var charts = [];
  
  while (files.hasNext()) {
    var file = files.next();
    charts.push({
      id: file.getId(),
      name: file.getName(),
      url: file.getDownloadUrl(), // Ou file.getThumbnail() para visualização rápida
      updated: file.getLastUpdated().toISOString()
    });
  }
  
  // Ordena por data de modificação (mais recentes primeiro) e pega 12
  charts.sort(function(a, b) {
    return new Date(b.updated) - new Date(a.updated);
  });
  
  return charts.slice(0, 12);
}

/**
 * Configura o trigger para rodar a cada 4 horas.
 * Execute esta função manualmente uma vez.
 */
function setupChartUpdateTrigger() {
  // Deleta triggers existentes para evitar duplicatas
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'updateChartsData') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Cria novo trigger de 4 horas
  ScriptApp.newTrigger('updateChartsData')
    .timeBased()
    .everyHours(4)
    .create();
    
  Logger.log("Trigger de atualização configurado para 4 horas.");
}

/**
 * Função placeholder chamada pelo trigger de atualização.
 * Atualiza gráficos e dados do dashboard programaticamente.
 */
function updateChartsData() {
  Logger.log("Executando atualização programada dos gráficos...");
  // Lógica de geração de gráficos aqui...
}

/**
 * Analyzes code quality (mantido para ferramental de CI/CD).
 */
function analyzeCodeQuality() {
  console.log("Iniciando análise detalhada de qualidade de código...");
  
  let totalLines = 0;
  let totalFunctions = 0;
  let totalComments = 0;
  let issues = [];

  try {
    // No Apps Script, analisamos as funções registradas no projeto
    const scriptProperties = PropertiesService.getScriptProperties();
    const projectKey = scriptProperties.getProperty('PROJECT_KEY') || 'Code.gs';
    
    console.info(`[Processando] Arquivo principal: ${projectKey}`);
    
    // Obtém source code do próprio script via reflexão
    const allFunctions = [
      'doGet', 'include', 'logNavigationEvent', 'loadSedimentData',
      'getDashboardData', 'submitOccurrence', 'analyzeCodeQuality',
      'calculateQualityScore', 'prepareForProduction'
    ];
    
    totalFunctions = allFunctions.length;
    
    // Simula análise de linhas (estimativa baseada na complexidade)
    allFunctions.forEach(funcName => {
      try {
        const funcStr = eval(funcName).toString();
        const lines = funcStr.split('\n');
        totalLines += lines.length;
        
        // Conta comentários JSDoc
        lines.forEach(line => {
          if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
            totalComments++;
          }
          
          // Detecta TODOs
          if (line.includes('TODO') || line.includes('FIXME')) {
            const msg = `TODO/FIXME encontrado em ${funcName}`;
            console.log(`[Issue Detectada] ${msg}`);
            issues.push({ message: msg, severity: 'medium' });
          }
          
          // Detecta try-catch ausentes em funções críticas
          if (funcName.includes('submit') || funcName.includes('save')) {
            if (!funcStr.includes('try') || !funcStr.includes('catch')) {
              issues.push({ 
                message: `Função ${funcName} sem tratamento de erro adequado`, 
                severity: 'high' 
              });
            }
          }
        });
      } catch (e) {
        console.warn(`Erro ao analisar função ${funcName}: ${e.message}`);
      }
    });

    // Validação de dependências não declaradas
    if (typeof MobilizacaoController === 'undefined') {
      issues.push({ 
        message: 'MobilizacaoController não encontrado - possível dependência quebrada', 
        severity: 'high' 
      });
    }

  } catch (e) {
    console.error(`Erro durante análise: ${e.message}`);
    issues.push({ message: `Erro crítico na análise: ${e.message}`, severity: 'high' });
  }

  console.log(`Análise concluída. Linhas: ${totalLines}, Funções: ${totalFunctions}, Comentários: ${totalComments}`);
  
  return {
    totalLines,
    qualityScore: calculateQualityScore({ totalLines, totalFunctions, totalComments }, issues)
  };
}

/**
 * Calculates the quality score based on gathered metrics and issue severity.
 * @param {Object} stats - The statistics object containing totalLines, totalFunctions, totalComments.
 * @param {Array<{message: string, severity: string}>} issues - The list of identified code issue objects.
 * @return {number} The calculated quality score (0-100).
 */
function calculateQualityScore(stats, issues) {
  console.log(`Calculando Quality Score... Base: 100 pontos.`);
  let score = 100;

  // Deduct points for each issue found
  issues.forEach(issue => {
    if (issue.severity === 'high') {
      score -= 20;
    } else if (issue.severity === 'medium') {
      score -= 10;
    } else {
      score -= 5;
    }
  });

  // Penaliza falta de comentários
  if (stats.totalComments === 0) {
    score -= 15;
    issues.push({ message: 'Sem comentários no código.', severity: 'medium' });
  }

  // Penaliza funções muito longas (heurística simples)
  if (stats.totalFunctions > 0 && (stats.totalLines / stats.totalFunctions > 50)) {
    score -= 10;
    issues.push({ message: 'Funções muito longas detectadas.', severity: 'medium' });
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Prepara o ambiente para produção:
 * - Minimiza código (remove comentários e espaços desnecessários)
 * - Renomeia funções para padrão de produção
 * - Outras otimizações necessárias
 */
function prepareForProduction() {
  // Exemplo simplificado - no GAS real, precisaríamos de um processo mais robusto
  const ui = SpreadsheetApp.getUi();
  ui.alert('Preparação para produção', 'Otimizações aplicadas (simuladas).', ui.ButtonSet.OK);
}

// ============================================================================
// API EXPOSURE: CONECTORES FRONTEND <-> BACKEND
// ============================================================================

/**
 * Wrapper para cálculo de impacto de impermeabilização (ImpermeabilizacaoService).
 * @param {number} percentage Porcentagem de solo impermeabilizado (0-100)
 */
function apiCalculateRunoff(percentage) {
  return ImpermeabilizacaoService().calculateRunoffImpact(percentage);
}

/**
 * Wrapper para sugestão de intervenções WSUD (ImpermeabilizacaoService).
 */
function apiSuggestWsud(landUse, soilType) {
  return ImpermeabilizacaoService().suggestWSUDInterventions(landUse, soilType);
}

/**
 * Wrapper para análise de vulnerabilidade do aquífero (FraturadoHandler).
 * @param {number} depth Espessura do manto (m)
 * @param {boolean} hasSeptic Se utiliza fossas sépticas
 */
function apiCheckAquiferVulnerability(depth, hasSeptic) {
  return FraturadoHandler().determineVulnerability(depth, hasSeptic);
}

/**
 * Wrapper para auditoria de compliance CPI (CpiUtils).
 */
function apiAuditCpiCompliance(parametersList) {
  return CpiUtils().auditPollutantMonitoring(parametersList);
}

/**
 * Wrapper para obter manifesto PWA (ServiceWorkerRepository).
 */
function apiGetAppManifest() {
  return ServiceWorkerRepository().getManifest();
}

/**
 * Serves the main HTML page and allows inclusion of other HTML files (CSS/JS).
 */
// function doGet() {
//   // CORREÇÃO: Aponta para 'Index' na raiz, removendo 'Frontend/'
//   return HtmlService.createTemplateFromFile('Index')
//       .evaluate()
//       .setTitle('Lago Paranoá App')
//       .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
// }

/**
 * Includes HTML files (CSS/JS) for the frontend.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}