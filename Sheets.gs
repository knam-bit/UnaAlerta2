/**
 * ARQUITETURA DE DADOS: SINGLE SOURCE OF TRUTH (Limnologia & Governança)
 * Este arquivo centraliza a criação e população de todas as abas do sistema.
 * Abrange: Relatorio.md Seções 4 (Eutrofização), 6 (Sedimentos/Micropoluentes) e 7 (Governança/Social).
 */

// Nomes das Abas do Ecossistema
var SHEET_NAME = "Monitoramento_Ambiental";
var SHEET_DENUNCIAS = "Denuncias_Cidadas";
var SHEET_OUTORGAS = "Outorgas_ADASA";
var SHEET_LOTEAMENTOS = "Loteamentos_Drenagem";
var SHEET_SEDIMENTOS = "Sedimentos_Analise";
var SHEET_BIODIVERSIDADE = "Biodiversidade_Monitoramento"; // Adicionado para Seção 4.5

// Schema Definitions for Validation & mapping
var DATA_SCHEMA = {
  MONITORAMENTO: {
    name: SHEET_NAME,
    headers: ["ID_Coleta", "Data_Hora", "Zona_Bacia", "pH", "OD_mg_L", "Turbidez_NTU", "Fosforo_Total_mg_L", "Clorofila_a_ug_L", "Microplasticos_Part_kg", "Risco_Calculado"],
    map: function(d) { 
      return [d.id, d.date, d.zone, d.ph, d.do, d.turbidity, d.totalPhosphorus, d.chlorophyll, d.microplastics, d.riskStatus]; 
    }
  },
  DENUNCIAS: {
    name: SHEET_DENUNCIAS,
    headers: ["ID_Denuncia", "Data", "Localizacao_GPS", "Categoria", "Descricao_Valor", "Status_Triagem", "Acao_Tomada"],
    map: function(d) {
      return [d.id, d.date, d.location, d.category, d.description, d.status, d.action || ''];
    }
  },
  BIODIVERSIDADE: {
    name: SHEET_BIODIVERSIDADE,
    headers: ["Data", "Grupo_Taxonomico", "Especie", "Densidade_Quant", "Local_Coleta", "Status_Conservacao"],
    map: function(d) { return [d.date, d.group, d.species, d.density, d.location, d.status]; }
  }
};

/**
 * Orquestrador principal: Configura todo o ambiente de dados do projeto.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Otimização: Cache de nomes para evitar chamadas getSheetByName repetitivas
  var currentSheets = new Set(ss.getSheets().map(function(s) { return s.getName(); }));
  
  // Helper interno para check rápido
  var ensure = function(name, setupFn) {
    if (!currentSheets.has(name)) setupFn(ss);
  };

  ensure(SHEET_NAME, setupMonitoramentoSheet);
  ensure(SHEET_DENUNCIAS, setupDenunciasSheet);
  ensure(SHEET_OUTORGAS, setupOutorgasSheet);
  ensure(SHEET_LOTEAMENTOS, setupLoteamentosSheet);
  ensure(SHEET_SEDIMENTOS, setupSedimentosSheet);
  ensure(SHEET_BIODIVERSIDADE, setupBiodiversidadeSheet);
  
  Logger.log("Ecossistema de Dados Lago Paranoá configurado (6 Dimensões).");
}

function setupMonitoramentoSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Use schema for consistency
    formatHeader(sheet, DATA_SCHEMA.MONITORAMENTO.headers);
    seedLimnologicalData(sheet);
  }
  return sheet;
}

function setupDenunciasSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_DENUNCIAS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DENUNCIAS);
    // Use schema for consistency
    formatHeader(sheet, DATA_SCHEMA.DENUNCIAS.headers);
    seedDenunciasData(sheet);
  }
  return sheet;
}

function setupOutorgasSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_OUTORGAS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_OUTORGAS);
    var headers = ["Processo_SEI", "Titular", "Finalidade", "Vazao_L_s", "Vencimento", "Status_Compliance", "Ultima_Fiscalizacao"];
    formatHeader(sheet, headers);
    seedOutorgasData(sheet);
  }
  return sheet;
}

function setupLoteamentosSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_LOTEAMENTOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOTEAMENTOS);
    var headers = ["ID_Projeto", "Nome_Empreendimento", "Bacia_Contribuinte", "Area_Total_m2", "Impermeabilizacao_%", "Sistema_Drenagem", "Status_Licenciamento"];
    formatHeader(sheet, headers);
    seedLoteamentosData(sheet);
  }
  return sheet;
}

function setupSedimentosSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SEDIMENTOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SEDIMENTOS);
    // Dados cruciais para análise da "Bomba Interna" de Fósforo (Internal Loading)
    var headers = ["Zona_Amostragem", "Profundidade_cm", "Ferro_Total_mg_kg", "Fosforo_Fe_Bound_mg_kg", "Potencial_Redox_mV", "Materia_Organica_%", "Risco_Mineracao_Interna"];
    formatHeader(sheet, headers, "#fff2cc"); // Amarelo para sedimentos
    seedSedimentosData(sheet);
  }
  return sheet;
}

function setupBiodiversidadeSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_BIODIVERSIDADE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_BIODIVERSIDADE);
    formatHeader(sheet, DATA_SCHEMA.BIODIVERSIDADE.headers, "#d9d2e9");
    seedBiodiversidadeData(sheet);
  }
  return sheet;
}

// --- POPULAÇÃO DE DADOS SINTÉTICOS (SEEDS) ---

function seedLimnologicalData(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return console.warn("seedLimnologicalData: Aba não encontrada.");

  // Expanded for graph consistency (min 5 rows for KDE) - Alinhado com Schema
  // REALIDADE DO PARANOÁ (Baseado em FUNDAMENTOS.md):
  // 1. Riacho Fundo: Receptor crítico. N:P baixo favorecendo cianobactérias.
  // 2. Lago Norte: Oligotrófico mas vulnerável a runoff de jardins (poluição difusa).
  // 3. Barragem (Hipolímnio): Anoxia severa (< 2mg/L DO) liberando P do sedimento.
  var data = [
    [new Date().getTime() + "_1", new Date(), "Riacho Fundo (Foz)", 7.1, 2.5, 65.0, 180.5, 95.0, 1500, "CRITICAL_EUTROPHICATION"], // Alta carga externa + interna
    [new Date().getTime() + "_2", new Date(), "Lago Norte (Prainha)", 7.6, 7.2, 3.5, 25.0, 8.0, 350, "SAFE"], // Mantido por balneabilidade
    [new Date().getTime() + "_3", new Date(), "Barragem (Hipolímnio)", 6.5, 0.5, 5.0, 120.0, 5.0, 120, "HYPOXIA_INTERNAL_LOAD"], // Anoxia redutora de Ferro
    [new Date().getTime() + "_4", new Date(), "Braço do Torto", 6.8, 4.5, 25.0, 55.0, 40.0, 680, "CYANOBACTERIA_BLOOM"], // Dominância Raphidiopsis
    [new Date().getTime() + "_5", new Date(), "Bananal", 7.4, 6.8, 12.0, 42.0, 35.0, 400, "MODERATE_RISK"], 
    [new Date().getTime() + "_6", new Date(), "Gama", 6.9, 3.8, 40.0, 110.0, 70.0, 900, "HIGH_RISK"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function seedDenunciasData(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DENUNCIAS);
  if (!sheet) return console.warn("seedDenunciasData: Aba não encontrada.");

  // REALIDADE: Esgoto clandestino em galerias pluviais (Águas Claras/V. Pires) e invasões de orla
  var data = [
    ["DEN_2025_001", new Date(), "-15.82, -47.88", "Esgoto Clandestino", "Cheiro forte de esgoto na boca de lobo (Seca)", "EM_ANALISE", "Teste de corante agendado"],
    ["DEN_2025_002", new Date(), "-15.75, -47.85", "Invasão de APP", "Cerca estendida até o espelho d'água (Ponta de Picolé)", "ALTA_PRIORIDADE", "DF Legal acionado"],
    ["DEN_2025_003", new Date(), "-15.80, -47.82", "Resíduos Sólidos", "Lixo acumulado após chuva forte (First Flush)", "TRIAGEM", "SLU notificado"],
    ["DEN_2025_004", new Date(), "-15.86, -47.92", "Óleo na Água", "Mancha oleosa visível próximo à marina", "EM_ANALISE", "Coleta de amostra"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function seedOutorgasData(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_OUTORGAS);
  if (!sheet) return console.warn("seedOutorgasData: Aba não encontrada.");

  // REALIDADE: Conflito pelo uso da água (Irrigação de Jardins/Clubes vs Abastecimento)
  var data = [
    ["00100-00001/2023", "Clube de Golfe Lago Sul", "Irrigação Paisagística", 15.2, "2023-12-31", "VENCIDA", "2022-06-10"], // Outorga vencida comum
    ["00100-00055/2025", "CAESB - Captação Norte", "Abastecimento Humano", 700.0, "2030-06-30", "REGULAR", "2025-01-15"],
    ["00100-00012/2024", "Condomínio Ponta do Lago", "Irrigação Áreas Verdes", 8.0, "2028-12-31", "PENDENCIA_HIDROMETRO", "2024-11-05"], // Falta de dados
    ["00100-00003/2025", "Lava Jato Posto X", "Industrial/Serviços", 2.0, "2026-12-31", "REGULAR", "2025-02-20"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function seedLoteamentosData(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOTEAMENTOS);
  if (!sheet) return console.warn("seedLoteamentosData: Aba não encontrada.");

  // REALIDADE: Expansão Urbana em áreas de recarga (Latossolos) - Sobradinho/Tororó
  var data = [
    ["LOT_PAR-Z1", "Nova Expansão Sobradinho", "Ribeirão Sobradinho", 500000, 45, "Bacias de Detenção (WSUD)", "EM_LICENCIAMENTO"], // Tentativa de LID
    ["LOT_NOR-Q1", "Comercial Lago Norte", "Lago Norte", 15000, 95, "Convencional (Crítico)", "CONSOLIDADO"], // Alta impermeabilização antiga
    ["LOT_TOR-V2", "Condomínio Eco Tororó", "Tororó", 250000, 20, "Infiltração Natural (Preservação)", "APROVADO"],
    ["LOT_GCOLOR", "Grande Colorado - Setor 3", "Ribeirão Sobradinho", 120000, 60, "Misto", "EMBARGADO_JUDICIAL"] // Litígio comum
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function seedSedimentosData(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SEDIMENTOS);
  if (!sheet) return console.warn("seedSedimentosData: Aba não encontrada.");

  // REALIDADE: O Legado de Fósforo ("Internal Loading") - Seção 4.1 FUNDAMENTOS.md
  // Fe(III) reduz para Fe(II) em Redox negativo, liberando P.
  var data = [
    ["Riacho Fundo (Deposição)", 50, 45000, 1200, -250, 18.5, "EXTREMO - Liberação Redox Ativa"], // Redox muito negativo
    ["Bananal (Fundo)", 15, 32000, 600, -50, 10.0, "ALTO - Liberação Sazonal"],
    ["Lago Norte (Raso)", 5, 25000, 150, 200, 3.2, "BAIXO - Estável (Oxidado)"],
    ["Barragem (Hipolímnio)", 25, 38000, 450, -100, 7.5, "MEDIO - Risco Estratificação"],
    ["Torto (Entrada)", 10, 28000, 300, 50, 5.5, "BAIXO"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function seedBiodiversidadeData(sheet) {
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BIODIVERSIDADE);
    
    // REALIDADE: Dominância de Raphidiopsis raciborskii (Seção 5.1)
    var data = [
        [new Date(), "Fitoplâncton", "Raphidiopsis raciborskii", "85000 cel/mL", "Braço do Torto", "Invasora - Risco Saxitoxina"], 
        [new Date(), "Fitoplâncton", "Microcystis aeruginosa", "15000 cel/mL", "Riacho Fundo", "Potencial Hepatotóxico"],
        [new Date(), "Peixes", "Oreochromis niloticus (Tilápia)", "Alta Densidade", "Lago Norte", "Exótica"],
        [new Date(), "Macrófitas", "Eichhornia crassipes", "Cobertura 40%", "Bananal", "Indicador Hipertrofia"],
        [new Date(), "Zooplâncton", "Thermocyclops decipiens", "Moderada", "Barragem", "Indicador Eutrofização"],
        [new Date(), "Aves", "Phalacrocorax brasilianus", "Colônia Reprodutiva", "Ilhas", "Nativa"]
    ];
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

// --- UTILITÁRIOS ---

function formatHeader(sheet, headers, color) {
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold").setBackground(color || "#d9ead3");
  sheet.setFrozenRows(1);
}

// Mantido para compatibilidade com Relatorios.gs / Code.gs
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet(); // Garante setup total se a principal faltar
    return ss.getSheetByName(SHEET_NAME);
  }
  return sheet;
}

// Mantido para compatibilidade
function appendEnvironmentalData(data) {
  var sheet = getSheet();
  if (!data.id) data.id = new Date().getTime().toString();
  
  // Use schema mapper for safer CRUD operations
  var row = DATA_SCHEMA.MONITORAMENTO.map(data);
  sheet.appendRow(row);
}

// Função para criar um conjunto completo de planilhas com dados sintéticos
function criarPlanilhasCompletas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Limpar planilhas existentes (exceto a primeira)
  const sheets = ss.getSheets();
  for (let i = sheets.length - 1; i > 0; i--) {
    ss.deleteSheet(sheets[i]);
  }
  
  // Criar todas as abas necessárias
  criarAbaQualidadeAgua(ss);
  criarAbaBiodiversidade(ss);
  criarAbaClimaHidrologia(ss);
  criarAbaUsoOcupacao(ss);
  criarAbaPoluicao(ss);
  criarAbaIntervencoes(ss);
  criarAbaDashboard(ss);
  
  // Renomear primeira aba
  sheets[0].setName('Índice').clear();
  criarIndice(sheets[0]);
  
  SpreadsheetApp.getUi().alert('Planilhas criadas com sucesso!');
}

function criarIndice(sheet) {
  const headers = [
    ['SISTEMA DE MONITORAMENTO - LAGO PARANOÁ', ''],
    ['', ''],
    ['Abas Disponíveis:', 'Descrição'],
    ['1. Qualidade da Água', 'Parâmetros físico-químicos e biológicos'],
    ['2. Biodiversidade', 'Flora e fauna aquática e terrestre'],
    ['3. Clima e Hidrologia', 'Dados meteorológicos e vazões'],
    ['4. Uso e Ocupação', 'Ocupação do solo e população'],
    ['5. Poluição', 'Fontes pontuais e difusas'],
    ['6. Intervenções', 'Projetos e ações implementadas'],
    ['7. Dashboard', 'Visão geral e indicadores']
  ];
  
  sheet.getRange(1, 1, headers.length, 2).setValues(headers);
  sheet.getRange('A1:B1').merge().setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('A3:B3').setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 400);
}

function criarAbaQualidadeAgua(ss) {
  const sheet = ss.insertSheet('Qualidade da Água');
  
  // Cabeçalhos
  const headers = [
    'Data', 'Ponto de Coleta', 'Latitude', 'Longitude', 'Profundidade (m)',
    'Temperatura (°C)', 'pH', 'OD (mg/L)', 'DBO (mg/L)', 'Nitrogênio Total (mg/L)',
    'Fósforo Total (µg/L)', 'Turbidez (NTU)', 'Clorofila-a (µg/L)', 
    'Coliformes (NMP/100mL)', 'Transparência (m)', 'IQA', 'Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
  
  // Pontos de coleta
  const pontos = [
    ['P1 - Riacho Fundo', -15.8642, -47.9231],
    ['P2 - Gama', -15.9234, -47.9845],
    ['P3 - Torto', -15.7821, -47.8934],
    ['P4 - Bananal', -15.8123, -47.9567],
    ['P5 - Centro do Lago', -15.8345, -47.9123],
    ['P6 - Barragem', -15.8567, -47.8845]
  ];
  
  // Gerar 180 dias de dados (6 meses, coleta semanal por ponto)
  const dados = [];
  const dataInicio = new Date('2025-07-01');
  
  for (let semana = 0; semana < 26; semana++) {
    for (let p = 0; p < pontos.length; p++) {
      const data = new Date(dataInicio);
      data.setDate(data.getDate() + (semana * 7));
      
      const temp = 18 + Math.random() * 8 + Math.sin(semana / 26 * 2 * Math.PI) * 3;
      const od = 6 + Math.random() * 3 - (temp - 22) * 0.2;
      const fosforoBase = p < 3 ? 30 : 15; // Pontos de rios têm mais fósforo
      const fosforo = fosforoBase + Math.random() * 20;
      const clorofila = fosforo * 0.8 + Math.random() * 10;
      const iqa = calcularIQASimples(temp, 7.2 + Math.random() * 1.2, od, 2 + Math.random() * 3, fosforo);
      
      dados.push([
        Utilities.formatDate(data, 'GMT-3', 'dd/MM/yyyy'),
        pontos[p][0],
        pontos[p][1],
        pontos[p][2],
        Math.round(Math.random() * 20 + 5),
        temp.toFixed(1),
        (7.2 + Math.random() * 1.2).toFixed(2),
        od.toFixed(2),
        (2 + Math.random() * 3).toFixed(2),
        (0.5 + Math.random() * 1.5).toFixed(2),
        fosforo.toFixed(0),
        (5 + Math.random() * 15).toFixed(1),
        clorofila.toFixed(1),
        Math.round(100 + Math.random() * 900),
        (1.5 + Math.random() * 2.5).toFixed(1),
        iqa.toFixed(0),
        classificarIQAPlanilha(iqa) // CORREÇÃO: Nome atualizado da função
      ]);
    }
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  
  // Formatação condicional para IQA
  const iqaRange = sheet.getRange(2, 16, dados.length, 1);
  const statusRange = sheet.getRange(2, 17, dados.length, 1);
  
  formatarColunas(sheet, headers.length);
}

function criarAbaBiodiversidade(ss) {
  const sheet = ss.insertSheet('Biodiversidade');
  
  const headers = [
    'Data', 'Tipo', 'Grupo', 'Espécie', 'Nome Comum', 'Quantidade/Densidade',
    'Status Conservação', 'Local', 'Observações'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#6aa84f').setFontColor('white').setFontWeight('bold');
  
  const especies = [
    ['Fitoplâncton', 'Cianobactérias', 'Microcystis aeruginosa', 'Microcistis', 'LC'],
    ['Fitoplâncton', 'Diatomáceas', 'Aulacoseira granulata', 'Diatomácea', 'LC'],
    ['Zooplâncton', 'Cladóceros', 'Daphnia gessneri', 'Pulga d\'água', 'LC'],
    ['Zooplâncton', 'Copépodes', 'Notodiaptomus sp.', 'Copépode', 'LC'],
    ['Peixes', 'Nativo', 'Astyanax lacustris', 'Lambari', 'LC'],
    ['Peixes', 'Nativo', 'Geophagus brasiliensis', 'Cará', 'LC'],
    ['Peixes', 'Exótico', 'Oreochromis niloticus', 'Tilápia', 'LC'],
    ['Peixes', 'Exótico', 'Cichla kelberi', 'Tucunaré', 'LC'],
    ['Aves', 'Aquática', 'Phalacrocorax brasilianus', 'Biguá', 'LC'],
    ['Aves', 'Aquática', 'Ardea alba', 'Garça-branca', 'LC'],
    ['Aves', 'Aquática', 'Megaceryle torquata', 'Martim-pescador', 'LC'],
    ['Macrófitas', 'Emergente', 'Typha domingensis', 'Taboa', 'LC'],
    ['Macrófitas', 'Flutuante', 'Eichhornia crassipes', 'Aguapé', 'LC']
  ];
  
  const locais = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Barragem'];
  const dados = [];
  const dataInicio = new Date('2025-07-01');
  
  for (let mes = 0; mes < 6; mes++) {
    for (let esp of especies) {
      const data = new Date(dataInicio);
      data.setMonth(data.getMonth() + mes);
      
      let densidade;
      if (esp[0] === 'Fitoplâncton') densidade = Math.round(1000 + Math.random() * 50000) + ' cel/mL';
      else if (esp[0] === 'Zooplâncton') densidade = Math.round(50 + Math.random() * 500) + ' ind/L';
      else if (esp[0] === 'Peixes') densidade = Math.round(10 + Math.random() * 100) + ' ind/ha';
      else if (esp[0] === 'Aves') densidade = Math.round(5 + Math.random() * 50) + ' ind';
      else densidade = Math.round(10 + Math.random() * 100) + ' m²';
      
      dados.push([
        Utilities.formatDate(data, 'GMT-3', 'MM/yyyy'),
        esp[0],
        esp[1],
        esp[2],
        esp[3],
        densidade,
        esp[4],
        locais[Math.floor(Math.random() * locais.length)],
        ''
      ]);
    }
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  formatarColunas(sheet, headers.length);
}

function criarAbaClimaHidrologia(ss) {
  const sheet = ss.insertSheet('Clima e Hidrologia');
  
  const headers = [
    'Data', 'Precipitação (mm)', 'Temp. Mín (°C)', 'Temp. Máx (°C)', 
    'Umidade (%)', 'Evaporação (mm)', 'Vazão Afluente (m³/s)', 
    'Vazão Efluente (m³/s)', 'Nível (m)', 'Volume (hm³)', 'Tempo Residência (dias)'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#e69138').setFontColor('white').setFontWeight('bold');
  
  const dados = [];
  const dataInicio = new Date('2025-07-01');
  
  for (let dia = 0; dia < 180; dia++) {
    const data = new Date(dataInicio);
    data.setDate(data.getDate() + dia);
    
    // Simular estação seca (jul-set) e chuvosa (out-dez)
    const mes = data.getMonth();
    const precipBase = mes >= 9 ? 5 : 0.5; // out-dez mais chuvoso
    const precip = Math.random() < 0.3 ? Math.random() * precipBase * 20 : 0;
    
    const tempMin = 15 + Math.random() * 5;
    const tempMax = tempMin + 8 + Math.random() * 6;
    const umidade = 50 + Math.random() * 30 - (precipBase - 0.5) * 10;
    const evap = 3 + Math.random() * 3 - (precipBase - 0.5) * 0.5;
    
    const vazaoAfl = 15 + Math.random() * 20 + (precipBase - 0.5) * 30;
    const vazaoEfl = vazaoAfl * (0.85 + Math.random() * 0.1);
    const nivel = 997.5 + Math.random() * 2.5;
    const volume = 480 + (nivel - 997.5) * 50;
    const tempoRes = (volume * 1000000) / (vazaoEfl * 86400);
    
    dados.push([
      Utilities.formatDate(data, 'GMT-3', 'dd/MM/yyyy'),
      precip.toFixed(1),
      tempMin.toFixed(1),
      tempMax.toFixed(1),
      umidade.toFixed(0),
      evap.toFixed(1),
      vazaoAfl.toFixed(2),
      vazaoEfl.toFixed(2),
      nivel.toFixed(2),
      volume.toFixed(1),
      tempoRes.toFixed(0)
    ]);
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  formatarColunas(sheet, headers.length);
}

function criarAbaUsoOcupacao(ss) {
  const sheet = ss.insertSheet('Uso e Ocupação');
  
  const headers = [
    'Ano', 'Região', 'Área Urbana (km²)', 'Área Rural (km²)', 'Vegetação Nativa (km²)',
    'Pastagem (km²)', 'Agricultura (km²)', 'População', 'Densidade (hab/km²)',
    'Cobertura Esgoto (%)', 'Tratamento Esgoto (%)'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#a64d79').setFontColor('white').setFontWeight('bold');
  
  const regioes = [
    'Bacia do Riacho Fundo',
    'Bacia do Gama',
    'Bacia do Torto',
    'Bacia do Bananal',
    'Margem Leste',
    'Margem Oeste'
  ];
  
  const dados = [];
  for (let ano = 2020; ano <= 2025; ano++) {
    for (let i = 0; i < regioes.length; i++) {
      const crescimento = (ano - 2020) * 0.02;
      const urbana = 20 + i * 5 + Math.random() * 10 + crescimento * 20;
      const rural = 30 - crescimento * 5 + Math.random() * 10;
      const vegetacao = 40 - crescimento * 3 + Math.random() * 5;
      const pastagem = 15 - crescimento * 2 + Math.random() * 5;
      const agricultura = 10 + Math.random() * 5;
      const pop = Math.round(50000 + i * 20000 + crescimento * 10000);
      const areaTotal = urbana + rural + vegetacao + pastagem + agricultura;
      const densidade = pop / areaTotal;
      const cobEsgoto = 75 + crescimento * 5 + Math.random() * 10;
      const tratEsgoto = 65 + crescimento * 8 + Math.random() * 10;
      
      dados.push([
        ano,
        regioes[i],
        urbana.toFixed(1),
        rural.toFixed(1),
        vegetacao.toFixed(1),
        pastagem.toFixed(1),
        agricultura.toFixed(1),
        pop,
        densidade.toFixed(0),
        Math.min(100, cobEsgoto).toFixed(1),
        Math.min(100, tratEsgoto).toFixed(1)
      ]);
    }
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  formatarColunas(sheet, headers.length);
}

function criarAbaPoluicao(ss) {
  const sheet = ss.insertSheet('Poluição');
  
  const headers = [
    'Data', 'Fonte', 'Tipo', 'Latitude', 'Longitude', 'Vazão (L/s)',
    'DBO (mg/L)', 'N-Total (mg/L)', 'P-Total (mg/L)', 'Coliformes (NMP/100mL)',
    'Carga DBO (kg/dia)', 'Carga P (kg/dia)', 'Status', 'Tratamento'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#cc0000').setFontColor('white').setFontWeight('bold');
  
  const fontes = [
    ['ETE Brasília Norte', 'Pontual', -15.7234, -47.8923, 500, 'Secundário'],
    ['ETE Brasília Sul', 'Pontual', -15.8734, -47.9445, 450, 'Secundário'],
    ['ETE Gama', 'Pontual', -15.9934, -48.0234, 300, 'Secundário'],
    ['Córrego Urbano 1', 'Difusa', -15.8123, -47.9234, 50, 'Sem tratamento'],
    ['Córrego Urbano 2', 'Difusa', -15.8456, -47.9567, 45, 'Sem tratamento'],
    ['Drenagem Agrícola', 'Difusa', -15.7823, -47.8734, 30, 'Sem tratamento']
  ];
  
  const dados = [];
  const dataInicio = new Date('2025-07-01');
  
  for (let mes = 0; mes < 6; mes++) {
    for (let fonte of fontes) {
      const data = new Date(dataInicio);
      data.setMonth(data.getMonth() + mes);
      
      let dbo, nTotal, pTotal, colif;
      if (fonte[1] === 'Pontual') {
        dbo = 20 + Math.random() * 30;
        nTotal = 10 + Math.random() * 15;
        pTotal = 2 + Math.random() * 3;
        colif = Math.round(1000000 + Math.random() * 5000000);
      } else {
        dbo = 50 + Math.random() * 100;
        nTotal = 15 + Math.random() * 25;
        pTotal = 5 + Math.random() * 10;
        colif = Math.round(5000000 + Math.random() * 20000000);
      }
      
      const vazao = fonte[4] * (0.9 + Math.random() * 0.2);
      const cargaDBO = (dbo * vazao * 86.4).toFixed(1);
      const cargaP = (pTotal * vazao * 0.0864).toFixed(2);
      const status = fonte[5] === 'Secundário' ? 'Conforme' : 'Não conforme';
      
      dados.push([
        Utilities.formatDate(data, 'GMT-3', 'MM/yyyy'),
        fonte[0],
        fonte[1],
        fonte[2],
        fonte[3],
        vazao.toFixed(1),
        dbo.toFixed(1),
        nTotal.toFixed(1),
        pTotal.toFixed(2),
        colif,
        cargaDBO,
        cargaP,
        status,
        fonte[5]
      ]);
    }
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  formatarColunas(sheet, headers.length);
}

function criarAbaIntervencoes(ss) {
  const sheet = ss.insertSheet('Intervenções');
  
  const headers = [
    'ID', 'Projeto', 'Tipo', 'Data Início', 'Data Fim', 'Status',
    'Investimento (R$ mil)', 'Benefício Esperado', 'Indicador', 'Meta', 'Atual'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#674ea7').setFontColor('white').setFontWeight('bold');
  
  const projetos = [
    ['PROJ-001', 'Ampliação ETE Sul', 'Saneamento', '01/01/2025', '31/12/2025', 'Em andamento', 25000, 'Redução DBO', 'Carga P (kg/dia)', -50, -30],
    ['PROJ-002', 'Reflorestamento Margem', 'Restauração', '15/03/2025', '30/11/2025', 'Em andamento', 1200, 'Redução erosão', 'Área vegetada (ha)', 100, 65],
    ['PROJ-003', 'Controle Macrófitas', 'Manejo', '01/05/2025', '30/04/2026', 'Em andamento', 800, 'Melhoria navegação', 'Área controlada (ha)', 500, 320],
    ['PROJ-004', 'Monitoramento Contínuo', 'Tecnologia', '01/01/2024', '31/12/2026', 'Em andamento', 3500, 'Dados real-time', 'Estações ativas', 15, 12],
    ['PROJ-005', 'Educação Ambiental', 'Social', '01/02/2025', '31/12/2025', 'Em andamento', 450, 'Conscientização', 'Pessoas atingidas', 10000, 6200],
    ['PROJ-006', 'Dragagem Sedimentos', 'Recuperação', '01/08/2024', '30/06/2025', 'Concluído', 8000, 'Aumento volume', 'Volume dragado (m³)', 500000, 500000],
    ['PROJ-007', 'Rede Coletora Gama', 'Saneamento', '15/06/2024', '30/09/2025', 'Em andamento', 12000, 'Cobertura esgoto', 'População atendida', 50000, 38000],
    ['PROJ-008', 'Parque Linear Torto', 'Urbano', '01/04/2025', '31/03/2026', 'Planejado', 5500, 'Lazer e proteção', 'Área parque (ha)', 80, 0]
  ];
  
  const dados = [];
  for (let proj of projetos) {
    dados.push(proj);
  }
  
  sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
  formatarColunas(sheet, headers.length);
  
  // Formatação condicional para status
  const statusRange = sheet.getRange(2, 6, dados.length, 1);
  const rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Concluído')
    .setBackground('#b7e1cd')
    .setRanges([statusRange])
    .build();
  const rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Em andamento')
    .setBackground('#fff2cc')
    .setRanges([statusRange])
    .build();
  sheet.setConditionalFormatRules([rule1, rule2]);
}

function criarAbaDashboard(ss) {
  const sheet = ss.insertSheet('Dashboard');
  
  // Título
  sheet.getRange('A1:F1').merge()
    .setValue('DASHBOARD - LAGO PARANOÁ')
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#1c4587').setFontColor('white');
  
  // Indicadores principais
  const indicadores = [
    ['INDICADORES PRINCIPAIS', '', '', ''],
    ['Indicador', 'Valor Atual', 'Meta', 'Status'],
    ['IQA Médio', '=AVERAGE(\'Qualidade da Água\'!P:P)', '> 70', '=IF(B4>70,"✓","✗")'],
    ['Fósforo Médio (µg/L)', '=AVERAGE(\'Qualidade da Água\'!K:K)', '< 30', '=IF(B5<30,"✓","✗")'],
    ['Clorofila-a Média (µg/L)', '=AVERAGE(\'Qualidade da Água\'!M:M)', '< 30', '=IF(B6<30,"✓","✗")'],
    ['Cobertura Esgoto (%)', '=AVERAGE(\'Uso e Ocupação\'!J:J)', '> 90', '=IF(B7>90,"✓","✗")'],
    ['Tratamento Esgoto (%)', '=AVERAGE(\'Uso e Ocupação\'!K:K)', '> 85', '=IF(B8>85,"✓","✗")'],
    ['Projetos Ativos', '=COUNTIF(Intervenções!F:F,"Em andamento")', '', ''],
    ['Investimento Total (R$ mil)', '=SUM(Intervenções!G:G)', '', '']
  ];
  
  sheet.getRange(3, 1, indicadores.length, 4).setValues(indicadores);
  sheet.getRange('A3:D3').setBackground('#6fa8dc').setFontWeight('bold');
  sheet.getRange('A4:D4').setBackground('#c9daf8').setFontWeight('bold');
  
  // Resumo biodiversidade
  const bioHeader = [['BIODIVERSIDADE', '', '']];
  sheet.getRange(13, 1, 1, 3).setValues(bioHeader);
  sheet.getRange('A13:C13').merge().setBackground('#93c47d').setFontWeight('bold');
  
  const bioData = [
    ['Grupo', 'Espécies Registradas', 'Status'],
    ['Fitoplâncton', '=COUNTUNIQUE(FILTER(Biodiversidade!D:D,Biodiversidade!A:A<>"Data",Biodiversidade!B:B="Fitoplâncton"))', 'Monitorado'],
    ['Zooplâncton', '=COUNTUNIQUE(FILTER(Biodiversidade!D:D,Biodiversidade!A:A<>"Data",Biodiversidade!B:B="Zooplâncton"))', 'Monitorado'],
    ['Peixes', '=COUNTUNIQUE(FILTER(Biodiversidade!D:D,Biodiversidade!A:A<>"Data",Biodiversidade!B:B="Peixes"))', 'Monitorado'],
    ['Aves', '=COUNTUNIQUE(FILTER(Biodiversidade!D:D,Biodiversidade!A:A<>"Data",Biodiversidade!B:B="Aves"))', 'Monitorado'],
    ['Macrófitas', '=COUNTUNIQUE(FILTER(Biodiversidade!D:D,Biodiversidade!A:A<>"Data",Biodiversidade!B:B="Macrófitas"))', 'Monitorado']
  ];
  
  sheet.getRange(14, 1, bioData.length, 3).setValues(bioData);
  sheet.getRange('A14:C14').setBackground('#d9ead3').setFontWeight('bold');
  
  // Alertas
  const alertHeader = [['ALERTAS E OBSERVAÇÕES', '']];
  sheet.getRange(21, 1, 1, 2).setValues(alertHeader);
  sheet.getRange('A21:B21').merge().setBackground('#e06666').setFontColor('white').setFontWeight('bold');
  
  const alertas = [
    ['Tipo', 'Descrição'],
    ['=IF(B5>50,"CRÍTICO",IF(B5>30,"ATENÇÃO","OK"))', '=IF(B5>50,"Fósforo muito elevado",IF(B5>30,"Fósforo acima da meta","Fósforo adequado"))'],
    ['=IF(B6>50,"CRÍTICO",IF(B6>30,"ATENÇÃO","OK"))', '=IF(B6>50,"Clorofila-a muito elevada",IF(B6>30,"Clorofila-a acima da meta","Clorofila-a adequada"))'],
    ['=IF(B7<80,"CRÍTICO","OK")', '=IF(B7<80,"Cobertura de esgoto insuficiente","Cobertura de esgoto adequada")']
  ];
  
  sheet.getRange(22, 1, alertas.length, 2).setValues(alertas);
  sheet.getRange('A22:B22').setBackground('#f4cccc').setFontWeight('bold');
  
  formatarColunas(sheet, 6);
}

// Funções auxiliares
function calcularIQASimples(temp, ph, od, dbo, fosforo) {
  // Fórmula simplificada de IQA
  const qTemp = temp >= 20 && temp <= 28 ? 100 : 100 - Math.abs(24 - temp) * 3;
  const qPH = 100 - Math.abs(7.0 - ph) * 20;
  const qOD = od >= 7 ? 100 : (od / 7) * 100;
  const qDBO = dbo <= 3 ? 100 : 100 - (dbo - 3) * 10;
  const qFosforo = fosforo <= 25 ? 100 : 100 - (fosforo - 25) * 2;
  
  return (qTemp * 0.1 + qPH * 0.15 + qOD * 0.3 + qDBO * 0.25 + qFosforo * 0.2);
}

function classificarIQAPlanilha(iqa) {
  if (iqa >= 80) return 'Ótimo';
  if (iqa >= 52) return 'Bom';
  if (iqa >= 37) return 'Regular';
  if (iqa >= 20) return 'Ruim';
  return 'Péssimo';
}

function formatarColunas(sheet, numCols) {
  for (let i = 1; i <= numCols; i++) {
    sheet.autoResizeColumn(i);
    if (sheet.getColumnWidth(i) > 250) {
      sheet.setColumnWidth(i, 250);
    }
  }
  sheet.setFrozenRows(1);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Lago Paranoá')
    .addItem('Criar Planilhas Completas', 'criarPlanilhasCompletas')
    .addItem('Gerar Visualizações Estatísticas', 'gerarVisualizacoesEstatisticas')
    .addToUi();
}

// --- SISTEMA DE VISUALIZAÇÕES ESTATÍSTICAS ---

/**
 * Orquestrador principal de visualizações
 * Gera 12 gráficos estatísticos alinhados com Relatorio.md
 * OTIMIZADO: Utiliza UrlFetchApp.fetchAll para processamento paralelo.
 */
function gerarVisualizacoesEstatisticas() {
  const ui = SpreadsheetApp.getUi();
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  
  if (!folderId) {
    ui.alert('ERRO: Propriedade DRIVE_FOLDER_ID não encontrada nas configurações do script.');
    return;
  }
  
  const result = ui.alert(
    'Gerar Visualizações Estatísticas',
    'Serão gerados 12 gráficos analíticos via QuickChart (Modo Paralelo).\nContinuar?',
    ui.ButtonSet.YES_NO
  );
  
  if (result !== ui.Button.YES) return;

  try {
    const folder = DriveApp.getFolderById(folderId);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Garantir que todas as abas existam
    setupSheet(); 
    SpreadsheetApp.flush();
    
    // 12 visualizações alinhadas com estrutura de dados
    const graficos = [
      // SEÇÃO 4: EUTROFIZAÇÃO
      { nome: '01_KDE_Fosforo_Total', funcao: gerarKDEFosforo, secao: '4.1' },
      { nome: '02_KDE_Clorofila_a', funcao: gerarKDEClorofila, secao: '4.1' },
      { nome: '03_Violin_IQA_Pontos', funcao: gerarViolinoIQA, secao: '4.2' },
      { nome: '04_Barras_Empilhadas_Eutrofizacao', funcao: gerarBarrasEutrofizacao, secao: '4.3' },
      // SEÇÃO 6: SEDIMENTOS
      { nome: '05_Radar_Sedimentos_Interno', funcao: gerarRadarSedimentos, secao: '6.1' },
      { nome: '06_KDE_Turbidez_Suspensao', funcao: gerarKDETurbidez, secao: '6.2' },
      { nome: '07_Violin_Microplasticos', funcao: gerarViolinoMicroplasticos, secao: '6.3' },
      // SEÇÃO 7: GOVERNANÇA
      { nome: '08_Barras_Empilhadas_Denuncias', funcao: gerarBarrasDenuncias, secao: '7.3' },
      { nome: '09_Radar_Compliance_Outorgas', funcao: gerarRadarOutorgas, secao: '7.1' },
      { nome: '10_Histograma_Loteamentos', funcao: gerarHistogramaLoteamentos, secao: '7.2' },
      // INTEGRAÇÕES
      { nome: '11_Violin_pH_Anoxia', funcao: gerarViolinoPH, secao: '4.4' },
      { nome: '12_Barras_Biodiversidade_Stress', funcao: gerarBarrasBiodiversidade, secao: '4.5' }
    ];
    
    // FASE 1: Preparação (Gera configurações JSON)
    const requests = [];
    const mapGraficos = [];
    
    graficos.forEach(function(grafico) {
      try {
        // Agora as funções retornam a config do request, não o blob
        const reqConfig = grafico.funcao(ss);
        if (reqConfig) {
          requests.push(reqConfig);
          mapGraficos.push(grafico);
        }
      } catch (e) {
        Logger.log('Erro ao configurar ' + grafico.nome + ': ' + e.message);
      }
    });
    
    if (requests.length === 0) {
      ui.alert('Nenhum gráfico pôde ser configurado. Verifique se há dados nas planilhas.');
      return;
    }

    // FASE 2: Execução Paralela (I/O Bound)
    // Substitui o loop sequencial com sleep por um único batch request
    const responses = UrlFetchApp.fetchAll(requests);
    
    // FASE 3: Salvar Arquivos
    let sucessos = 0;
    let erros = 0;
    
    responses.forEach(function(response, i) {
      const grafico = mapGraficos[i];
      if (response.getResponseCode() === 200) {
        const file = folder.createFile(response.getBlob());
        file.setName(grafico.nome + '.png');
        file.setDescription('Visualização Seção ' + grafico.secao);
        sucessos++;
      } else {
        Logger.log(`Erro API ${grafico.nome}: ${response.getContentText()}`);
        erros++;
      }
    });

    const msg = `${sucessos} visualizações geradas com sucesso.\n${erros} erros.`;
    ui.alert('Relatório de Geração', msg, ui.ButtonSet.OK);
    
  } catch (e) {
    ui.alert('ERRO CRÍTICO: ' + e.toString());
    Logger.log('Stack trace: ' + e.stack);
  }
}

/**
 * 1. KDE - Fósforo Total (Seção 4.1: Eutrofização)
 * Distribuição probabilística do principal nutriente limitante
 */
function gerarKDEFosforo(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME); // Única Fonte Monitoramento_Ambiental
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Fosforo_Total_mg_L está na coluna G (índice 7 - colunas começam em 1)
  const data = sheet.getRange('G2:G' + Math.min(sheet.getLastRow(), 200)).getValues();
  const values = data.map(function(r) { 
    return parseFloat(String(r[0]).replace(',', '.')); 
  }).filter(function(v) { return !isNaN(v) && v > 0; });
  
  if (values.length < 3) return null;

  values.sort(function(a,b) { return a - b; });
  const min = Math.max(0, Math.floor(values[0]) - 5);
  const max = Math.ceil(values[values.length - 1]) + 5;
  const labels = [];
  const bins = [];
  const bandwidth = Math.max(3.0, (max - min) / 20);
  
  for (var i = min; i <= max; i += Math.max(1, Math.floor((max - min) / 30))) {
    labels.push(i);
    var density = 0;
    for (var j = 0; j < values.length; j++) {
      var u = (i - values[j]) / bandwidth;
      density += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }
    bins.push((density / values.length).toFixed(5));
  }

  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Densidade Probabilística',
        data: bins,
        borderColor: '#00FF00',
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        borderWidth: 3,
        pointRadius: 0,
        fill: true,
        tension: 0.4
      }]
    },
    options: criarOpcoesNeon('Fósforo Total (µg/L)', 'Densidade', 'KDE - Distribuição de P-Total (Limitante Eutrofização)')
  };

  return criarGraficoQuickChart(config);
}

/**
 * 2. KDE - Clorofila-a (Seção 4.1: Proxy de Biomassa Algal)
 */
function gerarKDEClorofila(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Clorofila_a_ug_L está na coluna H (índice 8)
  const data = sheet.getRange('H2:H' + Math.min(sheet.getLastRow(), 200)).getValues();
  const values = data.map(function(r) { 
    return parseFloat(String(r[0]).replace(',', '.')); 
  }).filter(function(v) { return !isNaN(v) && v > 0; });
  
  if (values.length < 3) return null;
  
  values.sort(function(a,b) { return a - b; });
  const labels = [];
  const bins = [];
  const bandwidth = 8.0;
  
  for (var i = 0; i <= 120; i += 5) {
    labels.push(i);
    var density = 0;
    for (var j = 0; j < values.length; j++) {
      var u = (i - values[j]) / bandwidth;
      density += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }
    bins.push((density / values.length).toFixed(5));
  }
  
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Densidade',
        data: bins,
        borderColor: '#00FF00',
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        borderWidth: 3,
        pointRadius: 0,
        fill: true,
        tension: 0.4
      }]
    },
    options: criarOpcoesNeon('Clorofila-a (µg/L)', 'Densidade', 'KDE - Biomassa Algal (Indicador Eutrofização)')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 3. Violino - IQA por Ponto (Seção 4.2: Heterogeneidade Espacial)
 */
function gerarViolinoIQA(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Colunas: Zona_Bacia(C), pH(D), OD(E), Fosforo(G)
  const rangeValues = sheet.getRange('C2:H' + Math.min(sheet.getLastRow(), 200)).getValues();
  const pontosMap = {};
  
  rangeValues.forEach(function(row) {
    var ponto = String(row[0]).trim(); // Coluna C
    // Cálculo simplificado de IQA On-the-Fly para visualização
    var ph = parseFloat(row[1]); // D
    var od = parseFloat(row[2]); // E
    var p = parseFloat(row[4]); // G
    
    if (!isNaN(ph) && !isNaN(od)) {
        // Mock IQA calculation aligned with helper
        var iqa = calcularIQA(25, ph, od, 2.0, p); 
        if (!pontosMap[ponto]) pontosMap[ponto] = [];
        pontosMap[ponto].push(iqa);
    }
  });

  const labels = Object.keys(pontosMap);
  if (labels.length === 0) return null;
  
  const datasets = [];
  const colors = ['#FF00FF', '#9900FF', '#FF6600', '#FFFF00', '#00FF00', '#FF0080'];
  
  labels.forEach(function(ponto, i) {
    const valores = pontosMap[ponto];
    valores.sort(function(a,b) { return a - b; });
    
    const min = valores[0];
    const q1 = valores[Math.floor(valores.length * 0.25)];
    const median = valores[Math.floor(valores.length * 0.5)];
    const q3 = valores[Math.floor(valores.length * 0.75)];
    const max = valores[valores.length - 1];
    
    datasets.push({
      label: ponto,
      data: [[min, q1, median, q3, max]],
      backgroundColor: hexToRgba(colors[i % colors.length], 0.3),
      borderColor: colors[i % colors.length],
      borderWidth: 2,
      outlierColor: colors[i % colors.length]
    });
  });

  const config = {
    type: 'violin',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: criarOpcoesNeon('Pontos de Monitoramento', 'IQA (0-100)', 'Distribuição Espacial do IQA - Heterogeneidade')
  };

  return criarGraficoQuickChart(config);
}

/**
 * 4. Barras Empilhadas - Status Eutrofização (Seção 4.3: Evolução Temporal)
 */
function gerarBarrasEutrofizacao(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Data(B), Fosforo(G), Clorofila(H)
  const data = sheet.getRange('B2:H' + Math.min(sheet.getLastRow(), 200)).getValues();
  const mesesMap = {};
  
  data.forEach(function(row) {
    var dStr = row[0]; // B
    if (!dStr) return;
    
    var mes = '';
    if (dStr instanceof Date) {
      mes = Utilities.formatDate(dStr, 'GMT-3', 'MM/yyyy');
    } else {
      mes = String(dStr).substring(0, 7);
    }
    
    if (!mesesMap[mes]) mesesMap[mes] = { Oligotrofico: 0, Mesotrofico: 0, Eutrofico: 0, Hipereutrofico: 0 };
    
    var fosforo = parseFloat(row[5]); // G relative to B is index 5
    var clorofila = parseFloat(row[6]); // H relative to B is index 6
    
    // Alinhado com CONAMA 357/2005 para Classe 2
    if (fosforo <= 0.03 && clorofila <= 10) mesesMap[mes].Oligotrofico++;
    else if (fosforo <= 0.05 && clorofila <= 30) mesesMap[mes].Mesotrofico++;
    else if (fosforo <= 0.1 || clorofila <= 60) mesesMap[mes].Eutrofico++;
    else mesesMap[mes].Hipereutrofico++;
  });
  
  const labels = Object.keys(mesesMap).sort().slice(0, 12);
  
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { 
          label: 'Oligotrófico', 
          data: labels.map(function(m) { return mesesMap[m].Oligotrofico; }), 
          backgroundColor: '#00FF00',
          borderColor: '#00FF00',
          borderWidth: 1
        },
        { 
          label: 'Mesotrófico', 
          data: labels.map(function(m) { return mesesMap[m].Mesotrofico; }), 
          backgroundColor: '#FFFF00',
          borderColor: '#FFFF00',
          borderWidth: 1
        },
        { 
          label: 'Eutrófico', 
          data: labels.map(function(m) { return mesesMap[m].Eutrofico; }), 
          backgroundColor: '#FF6600',
          borderColor: '#FF6600',
          borderWidth: 1
        },
        { 
          label: 'Hipereutrófico', 
          data: labels.map(function(m) { return mesesMap[m].Hipereutrofico; }), 
          backgroundColor: '#FF0080',
          borderColor: '#FF0080',
          borderWidth: 1
        }
      ]
    },
    options: criarOpcoesEmpilhadas('Período', 'Frequência de Amostras', 'Evolução Temporal - Estado Trófico')
  };

  return criarGraficoQuickChart(config);
}

/**
 * 5. Radar - Sedimentos (Seção 6.1: Bomba Interna de Fósforo)
 */
function gerarRadarSedimentos(ss) {
  const sheet = ss.getSheetByName(SHEET_SEDIMENTOS);
  if (!sheet || sheet.getLastRow() < 2) {
    setupSedimentosSheet(ss);
    SpreadsheetApp.flush();
  }
  
  // Headers: ["Zona_Amostragem", "Profundidade_cm", "Ferro_Total_mg_kg", "Fosforo_Fe_Bound_mg_kg", "Potencial_Redox_mV", "Materia_Organica_%", "Risco_Mineracao_Interna"]
  const data = sheet.getRange('A2:G' + Math.min(sheet.getLastRow(), 10)).getValues();
  
  const zonas = {};
  data.forEach(function(row) {
    var zona = String(row[0]).split('(')[0].trim();
    if (!zonas[zona]) {
      zonas[zona] = {
        ferro: parseFloat(row[2]) || 0,
        pFeBound: parseFloat(row[3]) || 0,
        redox: Math.abs(parseFloat(row[4])) || 0,
        materiaOrganica: parseFloat(row[5]) || 0,
        risco: row[6]
      };
    }
  });
  
  const labels = ['Fe Total', 'P-Fe Ligado', 'Redox (abs)', 'Mat. Orgânica', 'Potencial Liberação'];
  const zonasArray = Object.keys(zonas);
  const colors = ['#FF00FF', '#FF6600', '#00FF00'];
  const datasets = [];
  
  zonasArray.slice(0, 3).forEach(function(zona, i) {
    const z = zonas[zona];
    datasets.push({
      label: zona,
      data: [
        (z.ferro / 50000 * 100).toFixed(0),
        (z.pFeBound / 1000 * 100).toFixed(0),
        (z.redox / 300 * 100).toFixed(0),
        (z.materiaOrganica * 8).toFixed(0),
        z.risco.includes('ALTO') ? 90 : z.risco.includes('MEDIO') ? 50 : 20
      ],
      borderColor: colors[i],
      backgroundColor: hexToRgba(colors[i], 0.2),
      borderWidth: 3,
      pointBackgroundColor: colors[i],
      pointRadius: 5
    });
  });
  
  const config = {
    type: 'radar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: criarOpcoesRadar('Perfil Geoquímico - Risco de Liberação Interna de P')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 6. KDE - Turbidez (Seção 6.2: Material Particulado em Suspensão)
 */
function gerarKDETurbidez(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Turbidez_NTU column F (index 6)
  const data = sheet.getRange('F2:F' + Math.min(sheet.getLastRow(), 200)).getValues();
  const values = data.map(function(r) { 
    return parseFloat(String(r[0]).replace(',', '.')); 
  }).filter(function(v) { return !isNaN(v) && v >= 0; });
  
  if (values.length < 3) return null;
  
  values.sort(function(a,b) { return a - b; });
  const labels = [];
  const bins = [];
  
  for (var i = 0; i <= 60; i += 2) {
    labels.push(i);
    var density = 0;
    for (var j = 0; j < values.length; j++) {
      var u = (i - values[j]) / 5.0;
      density += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }
    bins.push((density / values.length).toFixed(5));
  }
  
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Densidade',
        data: bins,
        borderColor: '#FF6600',
        backgroundColor: 'rgba(255, 102, 0, 0.15)',
        borderWidth: 3,
        pointRadius: 0,
        fill: true,
        tension: 0.4
      }]
    },
    options: criarOpcoesNeon('Turbidez (NTU)', 'Densidade', 'KDE - Material Particulado em Suspensão')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 7. Violino - Microplásticos (Seção 6.3: Contaminantes Emergentes)
 */
function gerarViolinoMicroplasticos(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Zona(C), Microplasticos(I). Range C:I.
  const rangeValues = sheet.getRange('C2:I' + Math.min(sheet.getLastRow(), 50)).getValues();
  const zonasMap = {};
  
  rangeValues.forEach(function(row) {
    var zona = String(row[0]);
    var microplast = parseFloat(row[6]); // I is index 6 from C (C=0, ..., I=6)
    if (!isNaN(microplast) && microplast > 0) {
      if (!zonasMap[zona]) zonasMap[zona] = [];
      zonasMap[zona].push(microplast);
    }
  });
  
  const labels = Object.keys(zonasMap);
  if (labels.length === 0) return null;
  
  const datasets = [];
  const colors = ['#FF00FF', '#9900FF', '#FF6600', '#FFFF00'];
  
  labels.forEach(function(zona, i) {
    const valores = zonasMap[zona];
    valores.sort(function(a,b) { return a - b; });
    
    const min = valores[0];
    const q1 = valores[Math.floor(valores.length * 0.25)];
    const median = valores[Math.floor(valores.length * 0.5)];
    const q3 = valores[Math.floor(valores.length * 0.75)];
    const max = valores[valores.length - 1];
    
    datasets.push({
      label: zona,
      data: [[min, q1, median, q3, max]],
      backgroundColor: hexToRgba(colors[i % colors.length], 0.3),
      borderColor: colors[i % colors.length],
      borderWidth: 2
    });
  });
  
  const config = {
    type: 'violin',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: criarOpcoesNeon('Zonas de Amostragem', 'Microplásticos (part/kg)', 'Distribuição de Microplásticos - Contaminante Emergente')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 8. Barras Empilhadas - Denúncias Cidadãs (Seção 7.3: Mobilização Social)
 */
function gerarBarrasDenuncias(ss) {
  const sheet = ss.getSheetByName(SHEET_DENUNCIAS);
  if (!sheet || sheet.getLastRow() < 2) {
    setupDenunciasSheet(ss);
    SpreadsheetApp.flush();
  }
  
  // Categoria(D), Status(F). Range D:F
  const data = sheet.getRange('D2:F' + Math.min(sheet.getLastRow(), 100)).getValues();
  const categorias = {};
  
  data.forEach(function(row) {
    var cat = String(row[0]);
    var status = String(row[2]); // D=0, E=1, F=2
    
    if (!categorias[cat]) categorias[cat] = { Triagem: 0, Analise: 0, Resolvido: 0, Prioridade: 0 };
    
    if (status.includes('TRIAGEM')) categorias[cat].Triagem++;
    else if (status.includes('ANALISE')) categorias[cat].Analise++;
    else if (status.includes('PRIORIDADE')) categorias[cat].Prioridade++;
    else categorias[cat].Resolvido++;
  });
  
  const labels = Object.keys(categorias);
  
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { 
          label: 'Triagem', 
          data: labels.map(function(l) { return categorias[l].Triagem; }), 
          backgroundColor: '#FFFF00',
          borderColor: '#FFFF00',
          borderWidth: 1
        },
        { 
          label: 'Em Análise', 
          data: labels.map(function(l) { return categorias[l].Analise; }), 
          backgroundColor: '#FF6600',
          borderColor: '#FF6600',
          borderWidth: 1
        },
        { 
          label: 'Alta Prioridade', 
          data: labels.map(function(l) { return categorias[l].Prioridade; }), 
          backgroundColor: '#FF0080',
          borderColor: '#FF0080',
          borderWidth: 1
        },
        { 
          label: 'Resolvido', 
          data: labels.map(function(l) { return categorias[l].Resolvido; }), 
          backgroundColor: '#00FF00',
          borderColor: '#00FF00',
          borderWidth: 1
        }
      ]
    },
    options: criarOpcoesEmpilhadas('Categoria de Denúncia', 'Quantidade', 'Denúncias Cidadãs - Status de Triagem')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 9. Radar - Compliance Outorgas (Seção 7.1: Governança Hídrica)
 */
function gerarRadarOutorgas(ss) {
  const sheet = ss.getSheetByName(SHEET_OUTORGAS);
  if (!sheet || sheet.getLastRow() < 2) {
    setupOutorgasSheet(ss);
    SpreadsheetApp.flush();
    sheet = ss.getSheetByName(SHEET_OUTORGAS);
  }
  
  // Finalidade(C), Vazao(D). Range C:D
 
  const data = sheet.getRange('C2:D' + Math.min(sheet.getLastRow(), 50)).getValues();
  
  const finalidades = {};
  data.forEach(function(row) {
    var fin = String(row[0]);
    var vazao = parseFloat(row[1]) || 0; // C=0, D=1
    
    if (!finalidades[fin]) finalidades[fin] = { total: 0, count: 0 };
    finalidades[fin].total += vazao;
    finalidades[fin].count++;
  });
  
  const labels = Object.keys(finalidades).slice(0, 5);
  const valores = labels.map(function(l) { 
    return (finalidades[l].total / finalidades[l].count * 10).toFixed(1); 
  });
  
  const config = {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Vazão Média (L/s × 10)',
        data: valores,
        borderColor: '#9900FF',
        backgroundColor: 'rgba(153, 0, 255, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: '#9900FF',
        pointRadius: 5
      }]
    },
    options: criarOpcoesRadar('Outorgas por Finalidade - Vazões Autorizadas')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 10. Histograma - Loteamentos (Seção 7.2: Impacto Urbanístico)
 */
function gerarHistogramaLoteamentos() {
  // CORREÇÃO: Passar ss como parâmetro ou garantir que seja obtida
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_LOTEAMENTOS);
  
  if (!sheet) {
    console.error("Aba 'Loteamentos' não encontrada. Tentando criar...");
    setupLoteamentosSheet(ss);
    sheet = ss.getSheetByName(SHEET_LOTEAMENTOS);
    if (!sheet) {
      console.error("ERRO: Não foi possível criar/encontrar aba 'Loteamentos'");
      return null;
    }
  }
  
  // Impermeabilizacao(E)
  const data = sheet.getRange('E2:E' + Math.min(sheet.getLastRow(), 50)).getValues();
  const faixas = { '0-30': 0, '30-50': 0, '50-70': 0, '70-85': 0, '85-100': 0 };
  
  data.forEach(function(row) {
    var imp = parseFloat(row[0]);
    if (!isNaN(imp)) {
      if (imp < 30) faixas['0-30']++;
      else if (imp < 50) faixas['30-50']++;
      else if (imp < 70) faixas['50-70']++;
      else if (imp < 85) faixas['70-85']++;
      else faixas['85-100']++;
    }
  });
  
  const config = {
    type: 'bar',
    data: {
      labels: Object.keys(faixas),
      datasets: [{
        label: 'Número de Loteamentos',
        data: Object.values(faixas),
        backgroundColor: ['#00FF00', '#FFFF00', '#FF6600', '#FF0080', '#9900FF'],
        borderColor: ['#00FF00', '#FFFF00', '#FF6600', '#FF0080', '#9900FF'],
        borderWidth: 2
      }]
    },
    options: criarOpcoesNeon('Impermeabilização (%)', 'Frequência', 'Histograma - Taxa de Impermeabilização (Drenagem Urbana)')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 11. Violino - pH e Anoxia (Seção 4.4: Condições Redox)
 */
function gerarViolinoPH(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  // Zona(C), pH(D). Range C:D
  const rangeValues = sheet.getRange('C2:D' + Math.min(sheet.getLastRow(), 200)).getValues();
  const pontosMap = {};
  
  rangeValues.forEach(function(row) {
    var ponto = String(row[0]).trim();
    var ph = parseFloat(row[1]);
    if (!isNaN(ph) && ph > 0) {
      if (!pontosMap[ponto]) pontosMap[ponto] = [];
      pontosMap[ponto].push(ph);
    }
  });
  
  const labels = Object.keys(pontosMap);
  if (labels.length === 0) return null;
  
  const datasets = [];
  const colors = ['#9900FF', '#FF00FF', '#FF6600', '#00FF00', '#FFFF00', '#FF0080'];
  
  labels.forEach(function(ponto, i) {
    const valores = pontosMap[ponto];
    valores.sort(function(a,b) { return a - b; });
    
    const min = valores[0];
    const q1 = valores[Math.floor(valores.length * 0.25)];
    const median = valores[Math.floor(valores.length * 0.5)];
    const q3 = valores[Math.floor(valores.length * 0.75)];
    const max = valores[valores.length - 1];
    
    datasets.push({
      label: ponto,
      data: [[min, q1, median, q3, max]],
      backgroundColor: hexToRgba(colors[i % colors.length], 0.3),
      borderColor: colors[i % colors.length],
      borderWidth: 2
    });
  });
  
  const config = {
    type: 'violin',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: criarOpcoesNeon('Pontos de Monitoramento', 'pH', 'Distribuição de pH - Indicador de Condições Redox')
  };
  
  return criarGraficoQuickChart(config);
}

/**
 * 12. Barras - Biodiversidade sob Estresse (Seção 4.5: Resposta Biológica)
 */
function gerarBarrasBiodiversidade(ss) {
  const sheet = ss.getSheetByName(SHEET_BIODIVERSIDADE);
  if (!sheet || sheet.getLastRow() < 2) {
      setupBiodiversidadeSheet(ss);
      SpreadsheetApp.flush();
      sheet = ss.getSheetByName(SHEET_BIODIVERSIDADE);
  }
  
  // "Grupo_Taxonomico" is column B (index 2)
  const data = sheet.getRange('B2:B' + Math.min(sheet.getLastRow(), 100)).getValues();
  const grupos = {};
  
  data.forEach(function(row) {
    var tipo = String(row[0]);
    grupos[tipo] = (grupos[tipo] || 0) + 1;
  });
  
  const labels = Object.keys(grupos);
  const cores = {
    'Fitoplâncton': '#FF0080',
    'Zooplâncton': '#FF6600',
    'Peixes': '#00FF00',
    'Aves': '#9900FF',
    'Macrófitas': '#FFFF00'
  };
  
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Registros de Ocorrência',
        data: labels.map(function(l) { return grupos[l]; }),
        backgroundColor: labels.map(function(l) { return cores[l] || '#FF00FF'; }),
        borderColor: labels.map(function(l) { return cores[l] || '#FF00FF'; }),
        borderWidth: 2
      }]
    },
    options: criarOpcoesNeon('Grupos Taxonômicos', 'Número de Registros', 'Biodiversidade - Respostas ao Estresse Ambiental')
  };
  
  return criarGraficoQuickChart(config);
}

// --- FUNÇÕES AUXILIARES DE ESTILO ---

function criarOpcoesNeon(xLabel, yLabel, titulo) {
  return {
    plugins: {
      title: {
        display: true,
        text: titulo,
        color: '#b8b8b8',
        font: { size: 16, weight: 'bold', family: 'Roboto Mono' }
      },
      legend: {
        labels: { 
          color: '#b8b8b8',
          font: { size: 11, family: 'Roboto' }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel,
          color: '#b8b8b8',
          font: { size: 13, family: 'Roboto' }
        },
        ticks: { color: '#b8b8b8', font: { size: 10 } },
        grid: { color: '#333333', lineWidth: 1 }
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          color: '#b8b8b8',
          font: { size: 13, family: 'Roboto' }
        },
        ticks: { color: '#b8b8b8', font: { size: 10 } },
        grid: { color: '#333333', lineWidth: 1 }
      }
    }
  };
}

function criarOpcoesEmpilhadas(xLabel, yLabel, titulo) {
  var opcoes = criarOpcoesNeon(xLabel, yLabel, titulo);
  opcoes.scales.x.stacked = true;
  opcoes.scales.y.stacked = true;
  return opcoes;
}

function criarOpcoesRadar(titulo) {
  return {
    plugins: {
      title: {
        display: true,
        text: titulo,
        color: '#b8b8b8',
        font: { size: 16, weight: 'bold', family: 'Roboto Mono' }
      },
      legend: {
        labels: { 
          color: '#b8b8b8',
          font: { size: 11, family: 'Roboto' }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { 
          color: '#b8b8b8',
          backdropColor: 'transparent',
          font: { size: 9 }
        },
        grid: { color: '#444444', lineWidth: 1 },
        angleLines: { color: '#444444', lineWidth: 1 },
        pointLabels: { 
          color: '#b8b8b8',
          font: { size: 11, family: 'Roboto' }
        }
      }
    }
  };
}

// Otimizado: Retorna objeto de configuração para UrlFetchApp.fetchAll em vez de bloquear a execução
function criarGraficoQuickChart(config) {
  const payload = {
    backgroundColor: '#1a1a1a',
    width: 900,
    height: 550,
    format: 'png',
    devicePixelRatio: 2.0,
    chart: config
  };
  
  // Retorna Request Object compatível com UrlFetchApp.fetchAll
  return {
    url: 'https://quickchart.io/chart',
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
}

function hexToRgba(hex, alpha) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + alpha + ')' : 
    'rgba(0,0,0,' + alpha + ')';
}
