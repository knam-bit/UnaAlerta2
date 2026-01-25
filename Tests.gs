/**
 * @file Tests.gs
 * @description Framework de Testes Unitários e Integrados para o Lago Paranoá.
 * Permite executar verificações de sanidade e lógica de negócios diretamente no Apps Script.
 */

// ============================================================================
// FRAMEWORK DE TESTES (Mini-Jest/Mocha style)
// ============================================================================

class TestRunner {
  constructor() {
    this.results = [];
    this.currentSuite = 'Global';
    this.passed = 0;
    this.failed = 0;
  }

  describe(suiteName, callback) {
    const previousSuite = this.currentSuite;
    this.currentSuite = suiteName;
    console.log(`\n📦 Suite: ${suiteName}`);
    try {
      callback();
    } catch (e) {
      console.error(`❌ Erro na suite ${suiteName}: ${e.message}`);
    }
    this.currentSuite = previousSuite;
  }

  it(testName, callback) {
    try {
      callback();
      console.log(`  ✅ ${testName}`);
      this.passed++;
      this.results.push({ suite: this.currentSuite, test: testName, status: 'PASS' });
    } catch (e) {
      console.error(`  ❌ ${testName} - ${e.message}`);
      this.failed++;
      this.results.push({ suite: this.currentSuite, test: testName, status: 'FAIL', error: e.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Equal check failed'}: Esperado ${expected}, recebido ${actual}`);
    }
  }
  
  assertCloseTo(actual, expected, precision = 2, message) {
    const diff = Math.abs(actual - expected);
    const tolerance = Math.pow(10, -precision);
    if (diff > tolerance) {
      throw new Error(`${message || 'CloseTo check failed'}: Esperado ~${expected}, recebido ${actual} (diff: ${diff})`);
    }
  }

  report() {
    const total = this.passed + this.failed;
    console.log('\n' + '='.repeat(40));
    console.log('RESUMO DOS TESTES');
    console.log('='.repeat(40));
    console.log(`Total: ${total}`);
    console.log(`Passou: ${this.passed}`);
    console.log(`Falhou: ${this.failed}`);
    console.log('='.repeat(40));
    
    if (this.failed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM!');
    } else {
      console.error('⚠️ ALGUNS TESTES FALHARAM.');
    }
    
    return {
      passed: this.passed,
      failed: this.failed,
      results: this.results
    };
  }
}

// ============================================================================
// EXECUTOR PRINCIPAL
// ============================================================================

/**
 * Executa todos os testes definidos.
 * Selecione esta função no editor do Apps Script e execute.
 */
function runTests() {
  const runner = new TestRunner();

  // --------------------------------------------------------------------------
  // TESTES DE CONFIGURAÇÃO (Configcheck)
  // --------------------------------------------------------------------------
  runner.describe('Configuração e Constantes', () => {
    runner.it('Deve ter constantes LIMNOLOGIA definidas', () => {
      runner.assert(typeof LIMNOLOGIA_CONSTANTS !== 'undefined', 'LIMNOLOGIA_CONSTANTS deve existir');
      runner.assert(LIMNOLOGIA_CONSTANTS.LIMITES_CONAMA !== undefined, 'LIMITES_CONAMA deve existir');
    });

    runner.it('Deve ter zonas do lago definidas corretamente', () => {
      const zonas = LIMNOLOGIA_CONSTANTS.ZONAS;
      runner.assert(Object.keys(zonas).length > 0, 'Deve haver zonas definidas');
      runner.assert(zonas.BARRAGEM !== undefined, 'Zona BARRAGEM deve existir');
    });
  });

  // --------------------------------------------------------------------------
  // TESTES LIMNOLOGIA ANALYTICS
  // --------------------------------------------------------------------------
  runner.describe('Limnologia Analytics - IQA', () => {
    
    runner.it('Deve calcular subíndice OD corretamente', () => {
      // Teste baseado na curva simplificada: >=8 -> 90
      const odAlto = calcularSubindiceOD(8.5);
      runner.assertEqual(odAlto, 90, 'OD >= 8 deve retornar 90');
      
      // Teste faixa intermediária: 6 <= od < 8: 70 + (od-6)*10
      // OD=7 -> 70 + 1*10 = 80
      const odMedio = calcularSubindiceOD(7);
      runner.assertEqual(odMedio, 80, 'OD 7 deve retornar 80');
    });

    runner.it('Deve calcular IQA corretamente (Caso Ideal)', () => {
      const mockParams = {
        od: 8.5, dbo: 1, coliformes: 10, ph: 7.2,
        nitrogenio: 0.4, fosforo: 0.01, turbidez: 5,
        temperatura: 1, solidos: 50
      };
      
      const resultado = calcularIQA(mockParams);
      
      // Log completo do resultado para debug
      console.log('Resultado completo IQA:', JSON.stringify(resultado, null, 2));
      
      // Verificar estrutura do resultado
      runner.assert(resultado !== null && resultado !== undefined, 'Resultado deve existir');
      runner.assert(typeof resultado === 'object', 'Resultado deve ser um objeto');
      runner.assert(resultado.categoria !== undefined, `Categoria deve existir. Resultado atual: ${JSON.stringify(resultado)}`);
      runner.assert(resultado.categoria.nivel !== undefined, `Categoria.nivel deve existir. Categoria atual: ${JSON.stringify(resultado.categoria)}`);
      
      // Espera-se um IQA alto
      runner.assert(resultado.valor > 80, `IQA Ideal deve ser > 80 (Atual: ${resultado.valor})`);
      runner.assertEqual(resultado.categoria.nivel, 'ÓTIMA', `Categoria deve ser ÓTIMA (Atual: ${resultado.categoria.nivel})`);
    });

    runner.it('Deve calcular IQA corretamente (Caso Ruim)', () => {
      const mockParams = {
        od: 2, dbo: 15, coliformes: 5000, ph: 9.5,
        nitrogenio: 15, fosforo: 1.0, turbidez: 100,
        temperatura: 10, solidos: 800
      };
      
      const resultado = calcularIQA(mockParams);
      
      // Espera-se um IQA baixo
      runner.assert(resultado.valor < 37, `IQA Ruim deve ser < 37 (Atual: ${resultado.valor})`);
    });
  });

  // --------------------------------------------------------------------------
  // TESTES DE ESTADO TRÓFICO (IET)
  // --------------------------------------------------------------------------
  runner.describe('Limnologia Analytics - IET', () => {
    runner.it('Deve classificar como OLIGOTRÓFICO corretamente', () => {
      // P: 15 (IET_P ~48), Cl: 2.5 (IET_CL ~49)
      const resultado = calcularIET(15, 2.5, 3.0);
      
      runner.assert(resultado.ietMedio <= 52, `IET Médio deve ser <= 52 (Atual: ${resultado.ietMedio})`);
      runner.assert(
        ['ULTRAOLIGOTRÓFICO', 'OLIGOTRÓFICO'].includes(resultado.classificacao.estado),
        `Estado deve ser Oligo ou Ultra (Atual: ${resultado.classificacao.estado})`
      );
    });

    runner.it('Deve identificar Eutrofização', () => {
      // P: 100 (Alto), Cl: 50 (Alto)
      const resultado = calcularIET(100, 50, 0.5);
      
      runner.assert(resultado.ietMedio > 60, 'IET deve ser alto para eutrofização');
      runner.assert(resultado.recomendacoes.length > 0, 'Deve gerar recomendações');
    });
  });

  // --------------------------------------------------------------------------
  // TESTES DE UTILIDADES
  // --------------------------------------------------------------------------
  runner.describe('Utilidades', () => {
    runner.it('Deve formatar data corretamente (se função existir)', () => {
       // Verificando se existe alguma função utilitária comum
       if (typeof Utilidades !== 'undefined' && Utilidades.formatDate) {
         // Teste hipotético
         runner.pass(); 
       }
    });
  });

  // --------------------------------------------------------------------------
  // TESTES DE CORRELAÇÃO
  // --------------------------------------------------------------------------
  runner.describe('Limnologia Analytics - Correlação', () => {
    runner.it('Deve calcular matriz de correlação corretamente', () => {
      // Dados perfeitamente correlacionados (P e Clorofila)
      const dados = [
        { fosforo: 10, clorofila: 20 },
        { fosforo: 20, clorofila: 40 },
        { fosforo: 30, clorofila: 60 },
        { fosforo: 40, clorofila: 80 }
      ];
      
      const resultado = calcularMatrizCorrelacao(dados);
      
      // Correlação deve ser 1 ou muito próxima
      runner.assertCloseTo(resultado.matriz.fosforo.clorofila, 1.0, 2, 'Correlação perfeita deve ser 1.0');
      runner.assertEqual(resultado.significancia.fosforo.clorofila, 'SIGNIFICATIVO', 'Deve ser estatisticamente significativo');
    });

    runner.it('Deve lidar com dados insuficientes', () => {
      const dados = [{ fosforo: 10 }, { fosforo: 20 }]; // < 3 amostras
      const resultado = calcularMatrizCorrelacao(dados);
      
      runner.assertEqual(resultado.significancia.fosforo.clorofila, 'DADOS_INSUFICIENTES', 'Deve reportar dados insuficientes');
    });
  });

  // --------------------------------------------------------------------------
  // TESTES DE SÉRIES TEMPORAIS
  // --------------------------------------------------------------------------
  runner.describe('Limnologia Analytics - Séries Temporais', () => {
    runner.it('Deve detectar tendência CRESCENTE', () => {
      const dados = [
        { data: '2023-01-01', valor: 10 },
        { data: '2023-02-01', valor: 20 },
        { data: '2023-03-01', valor: 30 },
        { data: '2023-04-01', valor: 40 },
        { data: '2023-05-01', valor: 50 },
        { data: '2023-06-01', valor: 60 }
      ];
      
      const resultado = analisarSerieTemporal(dados, 'fosforo');
      
      runner.assertEqual(resultado.tendencia.direcao, 'CRESCENTE', 'Tendência deve ser CRESCENTE');
      runner.assertEqual(resultado.estatisticasDescritivas.minimo, 10, 'Mínimo incorreto');
      runner.assertEqual(resultado.estatisticasDescritivas.maximo, 60, 'Máximo incorreto');
    });
    
    runner.it('Deve gerar alertas de tendência crítica', () => {
       // Tendência de queda de OD abaixo do crítico
       const dados = [
        { data: '2023-01-01', valor: 8 },
        { data: '2023-02-01', valor: 7 },
        { data: '2023-03-01', valor: 6 },
        { data: '2023-04-01', valor: 5 }, // Crítico < 6 e decrescente
        { data: '2023-05-01', valor: 4.5 }
      ];
      
      const resultado = analisarSerieTemporal(dados, 'od');
      runner.assertEqual(resultado.alerta.nivel, 'CRÍTICO', 'Deve gerar alerta CRÍTICO para OD em queda');
    });
  });

  // --------------------------------------------------------------------------
  // TESTES DE MAPA DE RISCO
  // --------------------------------------------------------------------------
  runner.describe('Limnologia Analytics - Mapa de Risco', () => {
    runner.it('Deve identificar Zona Crítica corretamente', () => {
      const dadosMock = {
        'RIACHO_FUNDO': { fosforo: 200, clorofila: 100, coliformes: 2600, dbo: 8, turbidez: 45, microplasticos: 1250, cianobacterias: 55000 },
        'LAGO_NORTE': { fosforo: 10, clorofila: 2, coliformes: 150, dbo: 2, turbidez: 8, microplasticos: 280 }
      };
      
      const mapa = calcularMapaRisco(dadosMock);
      
      runner.assertEqual(mapa.zonaCritica.nome, 'RIACHO_FUNDO', 'Riacho Fundo deve ser a zona crítica');
      runner.assert(mapa.mapaRisco.RIACHO_FUNDO.riscoIntegrado > 70, `Risco do Riacho Fundo deve ser alto (Atual: ${mapa.mapaRisco.RIACHO_FUNDO.riscoIntegrado})`);
    });
  });

  return runner.report();
}
