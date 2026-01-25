/**
 * @file GeminiService.gs
 * @description Serviço de Inteligência Artificial rodando nativamente no Apps Script.
 * Substitui a dependência do Colab Python para chat e insights rápidos.
 * 
 * Modos de Operação:
 * 1. API: Usa a API oficial do Gemini (requer prop 'GEMINI_API_KEY')
 * 2. LOCAL: Fallback baseado em regras e dados locais (Modo Offline/Seguro)
 */

const GEMINI_CONFIG = {
  API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  MAX_TOKENS: 500
};

const GeminiService = {

  /**
   * Processa uma mensagem de chat.
   * Prioriza API real, falha para lógica local.
   */
  chat: function(message, context) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    // 1. Tentar API Real se chave existir
    if (apiKey) {
      try {
        const response = this.callRealGeminiAPI_(message, apiKey);
        return { success: true, response: response };
      } catch (e) {
        Logger.log("Falha na API Gemini, usando fallback local: " + e);
      }
    }

    // 2. Fallback: Inteligência Local (Regras)
    return { 
      success: true, 
      response: this.localChatLogic_(message),
      mode: 'LOCAL_FALLBACK'
    };
  },

  /**
   * Obtém insights para os relatórios.
   */
  getInsights: function(chartType) {
    // Implementação simplificada de insights locais baseados no tipo de gráfico
    const insights = {
      'eutrofizacao': "A análise local indica níveis elevados de Fósforo na zona do Riacho Fundo, sugerindo necessidade de monitoramento de cargas difusas.",
      'iqa_radar': "O IQA apresenta disparidade significativa entre Lago Norte (Ótimo) e Sul (Regular).",
      // ... outros
    };
    return insights[chartType] || "Análise preliminar indisponível para este indicador.";
  },

  // ==========================================
  // LÓGICA PRIVADA
  // ==========================================

  callRealGeminiAPI_: function(prompt, key) {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(`${GEMINI_CONFIG.API_URL}?key=${key}`, options);
    const json = JSON.parse(response.getContentText());

    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Resposta inválida da API Gemini");
    }
  },

  localChatLogic_: function(msg) {
    const lowerMsg = msg.toLowerCase();

    // 1. Caso Específico: Tilápias (Solicitação do Usuário)
    if (lowerMsg.includes('tilapia') || lowerMsg.includes('tilápia')) {
      return "🐟 **Alerta de Espécie Invasora**: As tilápias são vorazes e reviram o sedimento do fundo em busca de alimento, o que aumenta a trubidez da água e libera fósforo novamente para a coluna d'água (bioturbação). Isso pode 'detonar' a qualidade da água locais rasos. Recomenda-se controle populacional e monitoramento das áreas de nidificação.";
    }

    // 2. Qualidade da Água
    if (lowerMsg.includes('qualidade') || lowerMsg.includes('poluicao') || lowerMsg.includes('poluição')) {
      return "📊 Os dados atuais indicam que o **Riacho Fundo** e **Bananal** são as áreas com maior comprometimento da qualidade (IQA < 50), principalmente devido ao aporte de sedimentos e cargas orgânicas urbanas. O Lago Norte mantém índices ótimos.";
    }

    // 3. Nível / Barragem
    if (lowerMsg.includes('nivel') || lowerMsg.includes('nível') || lowerMsg.includes('barragem')) {
      return "💧 O nível do reservatório está em zona de atenção. A cota atual exige uso racional da água para garantir a diluição de efluentes e abastecimento.";
    }

    // 4. Eutrofização / Algas
    if (lowerMsg.includes('alga') || lowerMsg.includes('verde') || lowerMsg.includes('cheiro')) {
      return "🌿 O crescimento excessivo de algas (eutrofização) está relacionado às altas concentrações de Fósforo e Nitrogênio. Ocorrências de odor forte devem ser reportadas usando a aba 'Ciência Cidadã'.";
    }

    // 5. Default
    return "🤖 Olá! Estou operando em *Modo Local* (sem conexão externa/Python). Posso ajudar com informações sobre:\n- 📉 Qualidade da água por zona\n- 🐟 Impacto de espécies invasoras (Tilápias)\n- 🧪 Parâmetros como pH e Turbidez\n- 📢 Como registrar denúncias";
  }
};
