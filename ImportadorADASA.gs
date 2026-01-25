/**
 * Módulo de importação de dados ADASA
 */

function importarDadosADASA() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Importar Dados ADASA',
    'Cole a URL ou caminho dos dados:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const url = response.getResponseText();
    try {
      processarImportacao(url);
      ui.alert('✅ Dados importados com sucesso!');
    } catch (error) {
      ui.alert('❌ Erro ao importar dados: ' + error.message);
    }
  }
}

function processarImportacao(url) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Dados Brutos');
  
  if (!sheet) {
    sheet = ss.insertSheet('Dados Brutos');
  }
  
  // Buscar dados (adaptar conforme fonte real)
  const dados = buscarDadosExternos(url);
  
  if (dados && dados.length > 0) {
    sheet.clear();
    sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    formatarPlanilhaDados(sheet);
  }
}

function buscarDadosExternos(url) {
  // Implementação simplificada - adaptar para API real da ADASA
  try {
    const response = UrlFetchApp.fetch(url);
    const content = response.getContentText();
    return parseCSV(content);
  } catch (error) {
    Logger.log('Erro ao buscar dados: ' + error);
    return [];
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  return lines.map(line => line.split(','));
}

function formatarPlanilhaDados(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow > 0 && lastCol > 0) {
    // Formatar cabeçalho
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange.setFontWeight('bold')
               .setBackground('#4a86e8')
               .setFontColor('#ffffff');
    
    // Congelar primeira linha
    sheet.setFrozenRows(1);
  }
}
