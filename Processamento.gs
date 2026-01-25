/**
 * Módulo de processamento e análise de dados
 */

function atualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dadosSheet = ss.getSheetByName('Dados Brutos');
  
  if (!dadosSheet || dadosSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Nenhum dado disponível para processar.');
    return;
  }
  
  calcularEstatisticas();
  atualizarGraficos();
  
  SpreadsheetApp.getUi().alert('✅ Dashboard atualizado!');
}

function calcularEstatisticas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let statsSheet = ss.getSheetByName('Estatísticas');
  
  if (!statsSheet) {
    statsSheet = ss.insertSheet('Estatísticas');
  }
  
  const dadosSheet = ss.getSheetByName('Dados Brutos');
  const dados = dadosSheet.getDataRange().getValues();
  
  // Processar estatísticas básicas
  const stats = processarEstatisticas(dados);
  
  // Escrever resultados
  statsSheet.clear();
  statsSheet.getRange(1, 1, stats.length, stats[0].length).setValues(stats);
}

function processarEstatisticas(dados) {
  if (dados.length < 2) return [['Sem dados']];
  
  const headers = dados[0];
  const valores = dados.slice(1);
  
  const resultado = [['Parâmetro', 'Média', 'Mínimo', 'Máximo', 'Desvio Padrão']];
  
  // Processar colunas numéricas
  for (let col = 0; col < headers.length; col++) {
    const colValores = valores.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
    
    if (colValores.length > 0) {
      resultado.push([
        headers[col],
        calcularMedia(colValores),
        Math.min(...colValores),
        Math.max(...colValores),
        calcularDesvioPadrao(colValores)
      ]);
    }
  }
  
  return resultado;
}

function calcularMedia(valores) {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function calcularDesvioPadrao(valores) {
  const media = calcularMedia(valores);
  const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  return Math.sqrt(variancia);
}

function atualizarGraficos() {
  // Implementação de atualização de gráficos
  Logger.log('Gráficos atualizados');
}
