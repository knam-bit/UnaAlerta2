/**
 * Módulo de utilidades e configurações
 */

function salvarConfiguracoesScript(config) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('API_URL', config.apiUrl);
  props.setProperty('UPDATE_FREQ', config.updateFreq);
  props.setProperty('EMAIL_RELATORIO', config.email);
}

function obterConfiguracao(chave) {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty(chave);
}

function criarTriggerAutomatico() {
  const freq = obterConfiguracao('UPDATE_FREQ') || 'daily';
  
  // Remove triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Cria novo trigger
  if (freq === 'daily') {
    ScriptApp.newTrigger('importarDadosADASA')
      .timeBased()
      .everyDays(1)
      .atHour(6)
      .create();
  } else if (freq === 'weekly') {
    ScriptApp.newTrigger('importarDadosADASA')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(6)
      .create();
  }
}

function validarDados(dados) {
  if (!dados || dados.length === 0) {
    return { valido: false, erro: 'Dados vazios' };
  }
  
  if (dados.length < 2) {
    return { valido: false, erro: 'Dados insuficientes' };
  }
  
  return { valido: true };
}
