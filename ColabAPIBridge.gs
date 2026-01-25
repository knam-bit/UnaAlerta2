/**
 * @file ColabAPIBridge.gs
 * @project LAGO_PARANOA - Recursos Hídricos
 * @category integracao
 * @tags api, colab, bridge, webhook, ngrok
 * @architecture REST API Bridge for Python Integration
 * @description Ponte de comunicação bidirecional entre Google Apps Script e colab.py.
 * Implementa endpoints WebApp para receber/enviar dados ao servidor Flask/ngrok.
 * @context Integração com colab.py - Seção 8 (Flask) e 9 (ngrok)
 */

// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================

const COLAB_API_CONFIG = {
  // URL base do ngrok (atualizada dinamicamente pelo Colab)
  ngrokUrl: PropertiesService.getScriptProperties().getProperty('COLAB_NGROK_URL') || null,
  
  // Timeouts
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
  
  // Endpoints do Flask no Colab
  ENDPOINTS: {
    PROCESS: '/process',
    ANALYZE: '/analyze',
    GENERATE_CHART: '/generate_charts',
    CHAT: '/chat',
    HEALTH: '/'
  },
  
  // Tipos de análise disponíveis
  ANALYSIS_TYPES: {
    EUTROFIZACAO: 'eutrofizacao',
    IQA_RADAR: 'iqa_radar',
    SERIE_TEMPORAL: 'serie_temporal',
    CORRELACAO: 'correlacao_heatmap',
    MAPA_RISCO: 'mapa_risco',
    MICROPLASTICOS: 'microplasticos',
    OXIGENIO_PROFUNDIDADE: 'oxigenio_profundidade',
    CARGA_INTERNA: 'carga_interna',
    BALNEABILIDADE: 'balneabilidade',
    TENDENCIA_HISTORICA: 'tendencia_historica',
    PRECIPITACAO_TURBIDEZ: 'precipitacao_turbidez',
    USO_SOLO: 'uso_solo'
  }
};

// ============================================================================
// 1. DOGET/DOPOST - WEBAPP ENDPOINTS
// ============================================================================

/**
 * Endpoint GET para WebApp - Serve Dashboard ou API
 * @param {Object} e - Evento HTTP
 * @return {ContentService.TextOutput | HtmlOutput} Resposta
 */
/**
 * Internal Request Handler (Delegated by backend.gs)
 */
function handleApiGetRequest_(e) {
  try {
    const action = e.parameter.action;
    
    // Se nenhuma ação for especificada, servir o Dashboard HTML
    if (!action || action === 'dashboard') {
      return HtmlService.createTemplateFromFile('Index') // Changed to Index as it seems to be the main one now
        .evaluate()
        .setTitle('Dashboard Lago Paranoá')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    const format = e.parameter.format || 'json';
    let response;
    
    switch (action) {
      case 'status':
        response = getAPIStatus_();
        break;
        
      case 'iqa':
        const zona = e.parameter.zona || 'ALL';
        response = LimnologiaAnalytics.getIQADataForColab();
        if (zona !== 'ALL') {
          response.data = response.data.filter(d => d.zona.includes(zona.replace('_', ' ')));
        }
        break;
        
      case 'eutrofizacao':
        response = LimnologiaAnalytics.getEutrophicationDataForColab();
        break;
        
      case 'serie':
        const param = e.parameter.param || 'fosforo';
        const meses = parseInt(e.parameter.meses) || 12;
        response = LimnologiaAnalytics.getTimeSeriesDataForColab(param, meses);
        break;
        
      case 'risco':
        response = getMapaRiscoForAPI_();
        break;
      
      case 'gemini_insights':
        // Retrieve cached insights or fetch new ones
        response = getGeminiInsights_();
        break;
        
      case 'config':
        response = { 
          constants: LIMNOLOGIA_CONSTANTS,
          analysisTypes: COLAB_API_CONFIG.ANALYSIS_TYPES,
          version: '2.1.0'
        };
        break;
        
      default:
        response = { 
          error: 'Ação desconhecida', 
          available: ['status', 'iqa', 'eutrofizacao', 'serie', 'risco', 'config', 'gemini_insights'] 
        };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    if (!e.parameter.action) {
      return ContentService.createTextOutput("Erro ao carregar Dashboard: " + error.message);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message, stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper chamado pelo Dashboard.html para obter URLs das imagens
 */
function getChartImageUrls() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1kEJZHGeaPM6hKr66u3A1GgIVEgAPGnd6'; // Use hardcoded fallback from python script
  if (!folderId) return {};
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const urls = {};
    
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName().replace('.png', '');
      if (file.getMimeType() === 'image/png') {
         const blob = file.getBlob();
         const base64 = Utilities.base64Encode(blob.getBytes());
         urls[name] = "data:image/png;base64," + base64; 
      }
    }
    return urls;
  } catch (e) {
    console.error(e);
    return {};
  }
}

/**
 * Endpoint POST para WebApp - Recebe dados do Colab e processa.
 * @param {Object} e - Evento HTTP com postData
 * @return {ContentService.TextOutput} Resposta JSON
 */
/**
 * Internal Request Handler (Delegated by backend.gs)
 */
function handleApiPostRequest_(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let response;
    
    switch (action) {
      case 'update_ngrok_url':
        response = updateNgrokUrl_(requestData.url);
        break;
        
      case 'save_analysis':
        response = saveAnalysisResults_(requestData);
        break;
        
      case 'log_chart':
        response = logChartGeneration_(requestData);
        break;
        
      case 'trigger_analysis':
        response = triggerColabAnalysis_(requestData.type);
        break;
        
      case 'sync_data':
        response = syncDataWithColab_(requestData);
        break;
        
      case 'receive_colab_results':
        response = processColabResults_(requestData.results);
        break;
        
      case 'chat_message':
        response = chatWithGemini_(requestData.message, requestData.context);
        break;
        
      default:
        response = { 
          success: false, 
          error: 'Ação POST desconhecida',
          available: ['update_ngrok_url', 'save_analysis', 'log_chart', 'trigger_analysis', 'sync_data', 'receive_colab_results', 'chat_message']
        };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// 2. COMUNICAÇÃO COM O SERVIDOR FLASK (COLAB)
// ============================================================================

/**
 * Envia requisição ao servidor Colab via ngrok.
 * @param {string} endpoint - Endpoint do Flask
 * @param {Object} payload - Dados a enviar
 * @param {string} method - Método HTTP (GET, POST)
 * @return {Object} Resposta do Colab
 */
function callColabAPI(endpoint, payload = {}, method = 'POST') {
  const ngrokUrl = getActiveNgrokUrl_();
  
  if (!ngrokUrl) {
    return {
      success: false,
      error: 'URL ngrok não configurada. Execute run_api_mode() no Colab primeiro.',
      configHelp: 'POST para /exec com action: update_ngrok_url e url: <sua-url>'
    };
  }
  
  const url = ngrokUrl + endpoint;
  
  const options = {
    method: method,
    contentType: 'application/json',
    payload: method === 'POST' ? JSON.stringify(payload) : null,
    muteHttpExceptions: true,
    timeout: COLAB_API_CONFIG.TIMEOUT_MS
  };
  
  let lastError;
  
  for (let attempt = 1; attempt <= COLAB_API_CONFIG.RETRY_COUNT; attempt++) {
    try {
      console.log(`📡 Tentativa ${attempt}/${COLAB_API_CONFIG.RETRY_COUNT} para ${url}`);
      
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      const content = response.getContentText();
      
      if (code >= 200 && code < 300) {
        const data = JSON.parse(content);
        console.log('✅ Resposta do Colab recebida com sucesso');
        return { success: true, data: data, statusCode: code };
      } else {
        lastError = `HTTP ${code}: ${content}`;
        console.warn(`⚠️ Resposta HTTP ${code}`);
      }
      
    } catch (error) {
      lastError = error.message;
      console.error(`❌ Erro na tentativa ${attempt}: ${error.message}`);
      
      if (attempt < COLAB_API_CONFIG.RETRY_COUNT) {
        Utilities.sleep(COLAB_API_CONFIG.RETRY_DELAY_MS * attempt);
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: COLAB_API_CONFIG.RETRY_COUNT
  };
}

/**
 * Verifica se o servidor Colab está online.
 * @return {Object} Status do servidor
 */
function checkColabHealth() {
  const result = callColabAPI(COLAB_API_CONFIG.ENDPOINTS.HEALTH, {}, 'GET');
  
  if (result.success) {
    return {
      online: true,
      message: 'Colab API está ativa',
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    online: false,
    message: result.error,
    troubleshooting: [
      '1. Verifique se o Colab está rodando',
      '2. Execute run_api_mode() no Colab',
      '3. Copie a URL pública e atualize via POST /exec',
      '4. A URL ngrok expira após algumas horas'
    ]
  };
}

/**
 * Solicita geração de gráfico ao Colab.
 * @param {string} chartType - Tipo do gráfico (ver ANALYSIS_TYPES)
 * @param {Object} customData - Dados customizados opcionais
 * @return {Object} Resultado da solicitação
 */
function requestChartGeneration(chartType, customData = null) {
  const validTypes = Object.values(COLAB_API_CONFIG.ANALYSIS_TYPES);
  
  if (!validTypes.includes(chartType)) {
    return {
      success: false,
      error: `Tipo de gráfico inválido: ${chartType}`,
      validTypes: validTypes
    };
  }
  
  const payload = {
    chart_type: chartType,
    data: customData || prepareDataForChart_(chartType),
    timestamp: new Date().toISOString(),
    requestor: 'GAS_API'
  };
  
  const result = callColabAPI(COLAB_API_CONFIG.ENDPOINTS.GENERATE_CHART, payload);
  
  if (result.success) {
    // Registrar solicitação no log
    logChartGeneration_({
      type: chartType,
      status: 'REQUESTED',
      colabResponse: result.data
    });
  }
  
  return result;
}

/**
 * Solicita análise estatística avançada ao Colab.
 * @param {Object} analysisRequest - Configuração da análise
 * @return {Object} Resultado ou status da análise
 */
function requestAdvancedAnalysis(analysisRequest) {
  const payload = {
    analysis_type: analysisRequest.type,
    parameters: analysisRequest.parameters || {},
    data: analysisRequest.data || [],
    output_format: analysisRequest.format || 'json',
    save_to_drive: analysisRequest.saveToDrive || true
  };
  
  const result = callColabAPI(COLAB_API_CONFIG.ENDPOINTS.ANALYZE, payload);
  
  if (result.success && result.data) {
    // Salvar resultados na planilha se solicitado
    if (analysisRequest.saveToSheet) {
      saveAnalysisResults_({
        type: analysisRequest.type,
        results: result.data,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return result;
}

// ============================================================================
// 3. SINCRONIZAÇÃO DE DADOS
// ============================================================================

/**
 * Exporta todos os dados relevantes para processamento no Colab.
 * @return {Object} Pacote de dados completo
 */
function exportDataForColab() {
  console.log('📦 Preparando exportação de dados para Colab...');
  
  const dataPackage = {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: 'Google Apps Script',
      project: 'LAGO_PARANOA'
    },
    
    // Dados de monitoramento
    monitoramento: getMonitoringData_(),
    
    // Dados limnológicos por zona
    limnologia: getLimnologyDataByZone_(),
    
    // Séries temporais
    seriesTemporais: {
      fosforo: LimnologiaAnalytics.getTimeSeriesDataForColab('fosforo', 24),
      od: LimnologiaAnalytics.getTimeSeriesDataForColab('od', 24),
      turbidez: LimnologiaAnalytics.getTimeSeriesDataForColab('turbidez', 24),
      clorofila: LimnologiaAnalytics.getTimeSeriesDataForColab('clorofila', 24)
    },
    
    // IQA atual
    iqa: LimnologiaAnalytics.getIQADataForColab(),
    
    // Eutrofização
    eutrofizacao: LimnologiaAnalytics.getEutrophicationDataForColab(),
    
    // Constantes científicas
    referencias: LIMNOLOGIA_CONSTANTS
  };
  
  console.log('✅ Dados exportados com sucesso');
  return dataPackage;
}

/**
 * Importa resultados processados do Colab.
 * @param {Object} colabResults - Resultados do Colab
 * @return {Object} Status da importação
 */
function importColabResults(colabResults) {
  console.log('📥 Importando resultados do Colab...');
  
  const importLog = {
    timestamp: new Date().toISOString(),
    imported: [],
    errors: []
  };
  
  try {
    // Importar análises estatísticas
    if (colabResults.correlacao) {
      saveToSheet_('Analises_Correlacao', colabResults.correlacao);
      importLog.imported.push('correlacao');
    }
    
    // Importar tendências
    if (colabResults.tendencias) {
      saveToSheet_('Analises_Tendencias', colabResults.tendencias);
      importLog.imported.push('tendencias');
    }
    
    // Importar alertas gerados
    if (colabResults.alertas) {
      processColabAlerts_(colabResults.alertas);
      importLog.imported.push('alertas');
    }
    
    // Registrar URLs dos gráficos gerados
    if (colabResults.graficos) {
      saveChartUrls_(colabResults.graficos);
      importLog.imported.push('graficos');
    }
    
    console.log(`✅ Importados ${importLog.imported.length} conjuntos de dados`);
    
  } catch (error) {
    importLog.errors.push(error.message);
    console.error('❌ Erro na importação:', error);
  }
  
  return importLog;
}

// ============================================================================
// 4. TRIGGERS E AUTOMAÇÃO
// ============================================================================

/**
 * Cria trigger para sincronização periódica com Colab.
 */
function setupColabSyncTrigger() {
  // Remover triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'syncWithColabScheduled') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Criar novo trigger (a cada 6 horas)
  ScriptApp.newTrigger('syncWithColabScheduled')
    .timeBased()
    .everyHours(6)
    .create();
  
  console.log('✅ Trigger de sincronização configurado (6h)');
}

/**
 * Função chamada pelo trigger para sincronização.
 */
function syncWithColabScheduled() {
  console.log('🔄 Iniciando sincronização agendada com Colab...');
  
  const health = checkColabHealth();
  
  if (!health.online) {
    console.warn('⚠️ Colab offline - sincronização adiada');
    logSyncAttempt_('FAILED', 'Colab offline');
    return;
  }
  
  // Exportar dados atualizados
  const dataPackage = exportDataForColab();
  
  // Enviar para processamento
  const result = requestAdvancedAnalysis({
    type: 'full_update',
    data: dataPackage,
    saveToSheet: true,
    saveToDrive: true
  });
  
  if (result.success) {
    importColabResults(result.data);
    logSyncAttempt_('SUCCESS', `${Object.keys(dataPackage).length} datasets sincronizados`);
  } else {
    logSyncAttempt_('PARTIAL', result.error);
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

function getAPIStatus_() {
  return {
    status: 'ONLINE',
    version: '2.0.0',
    project: 'LAGO_PARANOA',
    colabIntegration: {
      ngrokUrl: getActiveNgrokUrl_() || 'não configurada',
      health: checkColabHealth()
    },
    endpoints: {
      GET: ['status', 'iqa', 'eutrofizacao', 'serie', 'risco', 'config'],
      POST: ['update_ngrok_url', 'save_analysis', 'log_chart', 'trigger_analysis', 'sync_data']
    },
    lastSync: PropertiesService.getScriptProperties().getProperty('LAST_COLAB_SYNC') || 'nunca'
  };
}

function getActiveNgrokUrl_() {
  return PropertiesService.getScriptProperties().getProperty('COLAB_NGROK_URL');
}

function updateNgrokUrl_(url) {
  if (!url || !url.includes('ngrok')) {
    return { success: false, error: 'URL inválida - deve ser uma URL ngrok' };
  }
  
  PropertiesService.getScriptProperties().setProperty('COLAB_NGROK_URL', url);
  PropertiesService.getScriptProperties().setProperty('NGROK_UPDATED_AT', new Date().toISOString());
  
  console.log(`✅ URL ngrok atualizada: ${url}`);
  
  return {
    success: true,
    message: 'URL ngrok atualizada com sucesso',
    url: url,
    updatedAt: new Date().toISOString()
  };
}

function saveAnalysisResults_(requestData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Analises_Colab');
    
    if (!sheet) {
      sheet = ss.insertSheet('Analises_Colab');
      sheet.appendRow(['Timestamp', 'Tipo', 'Resultados', 'Status']);
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      requestData.type || 'UNKNOWN',
      JSON.stringify(requestData.results || requestData),
      'IMPORTED'
    ]);
    
    return { success: true, message: 'Análise salva com sucesso' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function logChartGeneration_(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Log_Graficos');
    
    if (!sheet) {
      sheet = ss.insertSheet('Log_Graficos');
      sheet.appendRow(['Timestamp', 'Tipo', 'Status', 'Detalhes']);
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      data.type,
      data.status || 'GENERATED',
      JSON.stringify(data.colabResponse || {})
    ]);
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function triggerColabAnalysis_(type) {
  return requestChartGeneration(type);
}

function syncDataWithColab_(requestData) {
  const exportedData = exportDataForColab();
  return { success: true, data: exportedData };
}

function processColabResults_(results) {
  return importColabResults(results);
}

function getMapaRiscoForAPI_() {
  // Dados simulados para API
  const dadosPorZona = {
    RIACHO_FUNDO: { fosforo: 85, clorofila: 45, coliformes: 2500, turbidez: 45, microplasticos: 1250 },
    GAMA: { fosforo: 72, clorofila: 38, coliformes: 1800, turbidez: 35, microplasticos: 980 },
    BANANAL: { fosforo: 45, clorofila: 22, coliformes: 800, turbidez: 22, microplasticos: 720 },
    TORTO: { fosforo: 38, clorofila: 18, coliformes: 500, turbidez: 18, microplasticos: 480 },
    LAGO_NORTE: { fosforo: 22, clorofila: 8, coliformes: 150, turbidez: 8, microplasticos: 280 },
    BARRAGEM: { fosforo: 18, clorofila: 6, coliformes: 100, turbidez: 5, microplasticos: 150 }
  };
  
  return LimnologiaAnalytics.calcularMapaRisco(dadosPorZona);
}

function prepareDataForChart_(chartType) {
  switch (chartType) {
    case 'eutrofizacao':
      return LimnologiaAnalytics.getEutrophicationDataForColab();
    case 'iqa_radar':
      return LimnologiaAnalytics.getIQADataForColab();
    case 'mapa_risco':
      return getMapaRiscoForAPI_();
    default:
      return {};
  }
}

function getMonitoringData_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('DadosLimnologicos');
    if (!sheet) return [];
    return sheet.getDataRange().getValues();
  } catch (e) {
    return [];
  }
}

function getLimnologyDataByZone_() {
  const zones = Object.keys(LIMNOLOGIA_CONSTANTS.ZONAS);
  const result = {};
  zones.forEach(z => {
    result[z] = getDadosSimulados_(z);
  });
  return result;
}

function saveToSheet_(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (Array.isArray(data) && data.length > 0) {
    sheet.clear();
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
}

function processColabAlerts_(alertas) {
  console.log(`Processando ${alertas.length} alertas do Colab`);
  // Integração com sistema de alertas existente
}

function saveChartUrls_(graficos) {
  console.log(`Salvando URLs de ${graficos.length} gráficos`);
}

function logSyncAttempt_(status, message) {
  PropertiesService.getScriptProperties().setProperty('LAST_COLAB_SYNC', new Date().toISOString());
  console.log(`[SYNC ${status}] ${message}`);
}

function getDadosSimulados_(zona) {
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

// ============================================================================
// EXPORTS
// ============================================================================

const ColabAPI = {
  doGet,
  doPost,
  callColabAPI,
  checkColabHealth,
  requestChartGeneration,
  requestAdvancedAnalysis,
  exportDataForColab,
  importColabResults,
  setupColabSyncTrigger,
  CONFIG: COLAB_API_CONFIG
};
