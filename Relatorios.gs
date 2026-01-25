/**
 * @file Relatorios.gs
 * @description Geração de relatórios consolidados sobre qualidade da água.
 * Contexto: Monitoramento Limnológico - Lago Paranoá (Relatorio.md Seções 4-6).
 */

/**
 * Módulo de geração de relatórios
 */

/**
 * Exibe diálogo para gerar relatório.
 * Solicita confirmação do usuário antes de gerar o relatório completo.
 */
function gerarRelatorio() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Gerar Relatório',
    'Deseja gerar um relatório completo dos dados atuais?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      criarRelatorioCompleto();
      ui.alert('✅ Relatório gerado com sucesso!');
    } catch (error) {
      ui.alert('❌ Erro ao gerar relatório: ' + error.message);
    }
  }
}

/**
 * Cria relatório completo de qualidade da água.
 * Gera uma nova aba 'Relatório' com dados consolidados e estatísticas.
 */
function criarRelatorioCompleto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let relatorioSheet = ss.getSheetByName('Relatório');
  
  if (!relatorioSheet) {
    relatorioSheet = ss.insertSheet('Relatório');
  }
  
  relatorioSheet.clear();
  
  // Cabeçalho do relatório
  const cabecalho = [
    ['RELATÓRIO DE QUALIDADE DA ÁGUA - LAGO PARANOÁ'],
    ['Data de Geração: ' + new Date().toLocaleDateString('pt-BR')],
    ['']
  ];
  
  relatorioSheet.getRange(1, 1, cabecalho.length, 1).setValues(cabecalho);
  relatorioSheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  
  // Adicionar estatísticas
  const statsSheet = ss.getSheetByName('Estatísticas');
  if (statsSheet) {
    const stats = statsSheet.getDataRange().getValues();
    relatorioSheet.getRange(5, 1, stats.length, stats[0].length).setValues(stats);
  }
  
  // Formatar
  relatorioSheet.autoResizeColumns(1, relatorioSheet.getLastColumn());
}

/**
 * Gera relatório de eutrofização por zona da bacia.
 * Calcula médias de Fósforo Total e Clorofila-a, classifica estado trófico.
 * @returns {Object} Resultado contendo success, type e data ou message de erro
 */
function gerarRelatorioEutrofizacao() {
  try {
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();
    var stats = {};
    
    // Pula cabeçalho (i=1)
    for (var i = 1; i < data.length; i++) {
      var zona = data[i][2]; // Coluna C: Zona_Bacia
      var fosforo = parseFloat(data[i][6] || 0); // Coluna G: Fósforo Total (mg/L)
      var clorofila = parseFloat(data[i][7] || 0); // Coluna H: Clorofila-a (µg/L)
      
      if (!stats[zona]) {
        stats[zona] = { count: 0, totalP: 0, totalChloro: 0, alerts: 0 };
      }
      
      stats[zona].count++;
      stats[zona].totalP += fosforo;
      stats[zona].totalChloro += clorofila;
      
      // Limiar de Alerta CONAMA 357/2005 Classe 2 (Fósforo Total ≤ 0.030 mg/L)
      if (fosforo > 0.030) stats[zona].alerts++;
    }
    
    // Calcula médias e classifica trofismo
    Object.keys(stats).forEach(z => {
      stats[z].avgP = (stats[z].totalP / stats[z].count).toFixed(3);
      stats[z].avgChloro = (stats[z].totalChloro / stats[z].count).toFixed(1);
      
      // Classificação Trófica (Carlson TSI simplificado)
      var chl = parseFloat(stats[z].avgChloro);
      if (chl < 2.6) stats[z].trophicState = "Ultraoligotrófico";
      else if (chl < 7.3) stats[z].trophicState = "Oligotrófico";
      else if (chl < 56) stats[z].trophicState = "Mesotrófico";
      else stats[z].trophicState = "Eutrófico/Hipereutrófico";
    });
    
    return { success: true, type: 'EUTROPHICATION_ANALYSIS', data: stats };
  } catch (error) {
    return { success: false, message: 'Erro ao analisar dados limnológicos: ' + error.toString() };
  }
}

/**
 * Exporta dados científicos em formato CSV.
 * Formato compatível com Python/Pandas para análise avançada.
 * @returns {Object} Resultado contendo success e data (CSV) ou message de erro
 */
function exportarDadosCientificosCSV() {
  try {
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();
    var csv = '';
    
    // Formato padrão para importação em Python/Pandas (Análise Avançada - Relatorio.md Seção 8)
    for (var i = 0; i < data.length; i++) {
        var row = data[i].map(cell => cell instanceof Date ? cell.toISOString() : cell);
        csv += row.join(',') + '\n';
    }
    
    return { success: true, data: csv };
  } catch (error) {
    return { success: false, message: 'Erro na exportação de dados: ' + error.toString() };
  }
}

/**
 * Função para enviar relatório por email (opcional)
 */
function exportarRelatorioEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const relatorioSheet = ss.getSheetByName('Relatório');
  
  if (!relatorioSheet) {
    return;
  }
  
  // Implementar envio de email conforme necessário
}
