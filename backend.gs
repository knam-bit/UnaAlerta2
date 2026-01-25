/**
 * @file backend.gs
 * @project LAGO_PARANOA - Backend Server
 * @description Servidor Backend principal para o ecossistema do Lago Paranoá.
 * Consolida a comunicação com o Colab (Python), processamento de requisições Web e
 * lógica de negócios avançada.
 * 
 * CORRESPONDE AO "MARAVILHOSO COLAB.PY" NO LADO DO APPS SCRIPT.
 */

// ============================================================================
// 1. WEBAPP ENTRY POINTS (Controller Principal)
// ============================================================================

/**
 * Ponto de entrada GET para o WebApp e API.
 * Roteia para o Frontend (HTML) ou para endpoints da API interna.
 */
function doGet(e) {
  // API Endpoints
  if (e.parameter.action) {
    Logger.log("📡 API Request: " + e.parameter.action);
    
    if (e.parameter.action === 'validate_gps') {
      const lat = parseFloat(e.parameter.lat);
      const lng = parseFloat(e.parameter.lng);
      const result = validateGPSLocation(lat, lng);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Outros endpoints...
    return handleApiGetRequest_(e);
  }
  
  // Frontend (Web App)
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('🌊 Lago Paranoá - Monitoramento Inteligente')
      .setFaviconUrl('https://raw.githubusercontent.com/google/material-design-icons/master/png/social/public/materialicons/24dp/2x/baseline_public_black_24dp.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Ponto de entrada POST para Webhooks e Callbacks do Colab.
 */
function doPost(e) {
  Logger.log("📨 Callback POST recebido");
  return handleApiPostRequest_(e); // Delegado para ColabAPIBridge
}

// ============================================================================
// 2. FUNÇÕES PÚBLICAS (google.script.run)
// ============================================================================

/**
 * Obtém insights de inteligência artificial (Gemini) sobre os dados.
 * Conecta-se ao Colab para geração ou recuperação de cache.
 * @return {Object} Insights gerados pelo Gemini Flash 1.5
 */
function getGeminiReportData() {
  Logger.log("🧠 Solicitando insights ao Gemini...");
  
  // 1. Tenta recuperar do Cache do Drive primeiro (rápido)
  try {
    const insights = getGeminiInsights_(); 
    if (insights && !insights.error) {
      return insights;
    }
  } catch (e) {
    Logger.log("⚠️ Cache falhou, tentando geração direta: " + e.message);
  }

  // 2. Se falhar, tenta forçar geração no Colab (lento)
  const isOnline = checkColabHealth().online;
  if (isOnline) {
    const response = requestChartGeneration('all'); // Solicita tudo
    if (response.success && response.data.insights) {
      return response.data.insights;
    }
  }

  return { 
    error: "Serviço de IA indisponível. Verifique se o Colab está rodando.",
    status: isOnline ? "ONLINE_BUT_ERROR" : "OFFLINE"
  };
}

/**
 * Envia mensagem de chat para o Gemini (via Colab ou Localmente).
 * @param {string} message - Mensagem do usuário
 * @param {Object} context - Contexto opcional (dados atuais)
 * @return {Object} Resposta do assistente
 */
function sendGeminiChat(message, context) {
  Logger.log(`💬 Chat Enviado: "${message}"`);
  
  // Validação básica
  if (!message || message.trim() === "") return { response: "Por favor, digite uma mensagem." };

  // Usa o Serviço GAS Nativo (Prioriza API, cai para Local se sem chave/offline)
  // Não depende mais exclusivamente do Colab
  const result = GeminiService.chat(message, context);
  
  return { 
    response: result.response,
    mode: result.mode || 'API'
  };
}

/**
 * Obtém URLs das imagens dos gráficos gerados.
 * Equivalente ao sistema de arquivos do colab.py, mas lendo do Drive.
 */
function getChartImageUrls() {
  // Delegate to existing logic in ColabAPIBridge (renamed or not, function names are global)
  // Wait, getChartImageUrls is defined in ColabAPIBridge.gs Global Scope.
  // We can just call it.
  return ColabAPI.getChartImageUrls ? ColabAPI.getChartImageUrls() : getChartImageUrls_Local_();
}

// Fallback local caso a função global não seja encontrada
function getChartImageUrls_Local_() {
   const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1kEJZHGeaPM6hKr66u3A1GgIVEgAPGnd6';
   if (!folderId) return {};
   
   try {
     const folder = DriveApp.getFolderById(folderId);
     const files = folder.getFiles();
     const urls = {};
     while (files.hasNext()) {
       const file = files.next();
       const name = file.getName().replace('.png', '');
       if (file.getMimeType() === 'image/png') {
         // Usar base64 para evitar problemas de permissão de imagem
         urls[name] = "data:image/png;base64," + Utilities.base64Encode(file.getBlob().getBytes());
       }
     }
     return urls;
   } catch (e) {
     return {};
   }
}

// ============================================================================
// 3. BRIDGE DE INTEGRAÇÃO (Backend Logic)
// ============================================================================

/**
 * Processa dados recebidos e envia para análise avançada no Colab.
 * @param {number|string} value - Valor ou objeto para processar
 */
function processDataWithColab(value) {
  Logger.log("🔄 Processando dados com backend Python...");
  
  const payload = {
    action: 'process_single_value',
    value: value,
    timestamp: new Date().toISOString()
  };

  const result = callColabAPI('/analyze', payload);
  return result;
}

/**
 * Sincroniza dados do Sheets com o Colab Server.
 * Pode ser chamado via Trigger ou Manualmente.
 */
function syncBackendData() {
  Logger.log("🔄 Sincronizando Sheets -> Colab...");
  
  // 1. Coleta dados
  const exportData = ColabAPI.exportDataForColab();
  
  // 2. Envia
  const result = ColabAPI.requestAdvancedAnalysis({
    type: 'full_sync',
    data: exportData
  });
  
  if (result.success) {
    Logger.log("✅ Sincronização concluída!");
  } else {
    Logger.log("❌ Falha na sincronização: " + result.error);
  }
  
  return result;
}

// ============================================================================
// 4. HELPERS & UTILITIES
// ============================================================================

/**
 * Atualiza URL do Ngrok manualmente (se necessário via interface GAS).
 */
function adminSetNgrokUrl(url) {
  return updateNgrokUrl_(url);
}

/**
 * Verifica saúde do backend.
 */
function adminCheckHealth() {
  return checkColabHealth();
}
