/**
 * @file NotificationJob.gs
 * @project Monitoramento Lago Paranoá
 * @category mobile
 * @tags notification, mobile, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

/**
 * Monitora indicadores críticos e envia alertas baseados nos gatilhos do Relatório.
 * Foca em: Carga Interna de Fósforo e Blooms de Cylindrospermopsis raciborskii.
 */
function NotificationJob() {
  console.log('Running logic for NotificationJob...');
  
  // Limites baseados na Tabela 2 e Seção 5.1 do Relatorio.md
  // Exemplo: Alerta se houver indícios de anoxia no hipolímnio (gatilho para liberação de P)
  const THRESHOLDS = {
    PHOSPHORUS_TOTAL: 0.05, // mg/L - Limite de alerta para eutrofização
    DISSOLVED_OXYGEN_DEEP: 2.0, // mg/L - Risco de anoxia e liberação de ferro/fósforo
    CYANOBACTERIA_DENSITY: 20000 // cel/mL - Risco de toxicidade (Saxitoxinas)
  };

  // Simulação de leitura de sensores ou banco de dados
  const currentReadings = _fetchLatestSensorData();

  if (currentReadings.oxygen < THRESHOLDS.DISSOLVED_OXYGEN_DEEP) {
    _sendAlert(
      "Alerta de Anoxia", 
      "Níveis de oxigênio no hipolímnio críticos. Risco iminente de 'Internal Phosphorus Loading' (Carga Interna)."
    );
  }

  if (currentReadings.cyanobacteria > THRESHOLDS.CYANOBACTERIA_DENSITY) {
    _sendAlert(
      "Alerta de Saúde Pública",
      "Alta densidade de Cylindrospermopsis raciborskii detectada. Acionar protocolo de vigilância sanitária."
    );
  }
}

function _fetchLatestSensorData() {
  // Mock: conectar com Planilha de Monitoramento ou API Externa
  return {
    oxygen: 1.5, // Simula valor crítico
    phosphorus: 0.04,
    cyanobacteria: 25000 // Simula bloom
  };
}

function _sendAlert(subject, message) {
  // Envia notificação por email (padrão GAS)
  const recipient = Session.getActiveUser().getEmail();
  MailApp.sendEmail({
    to: recipient,
    subject: `[MONITORAMENTO PARANOÁ] ${subject}`,
    body: `${message}\n\nConsulte o Painel de Controle para mais detalhes.\nContexto: Relatorio.md`
  });
  console.warn(`ALERT SENT: ${subject}`);
}