# 📖 Guia de Uso - GAS Code Reviewer

## 🚀 Início Rápido

### No PowerShell (Recomendado)

```powershell
# Navegar até o diretório
cd D:\RH

# Revisão simples
.\run_reviewer.ps1 example_code.gs

# Modo verboso (use -VerboseMode, não -Verbose)
.\run_reviewer.ps1 example_code.gs -VerboseMode

# Ou use o alias -v
.\run_reviewer.ps1 example_code.gs -v

# Salvar relatório
.\run_reviewer.ps1 example_code.gs -Output relatorio.txt

# Formato JSON
.\run_reviewer.ps1 example_code.gs -Json

# Apenas estatísticas
.\run_reviewer.ps1 example_code.gs -StatsOnly

# Ver ajuda
.\run_reviewer.ps1 -Help
```

### Revisar Múltiplos Arquivos

```powershell
# Revisar todos os .gs no diretório
.\review_all.ps1

# Revisar com JSON
.\review_all.ps1 -Json

# Especificar diretório
.\review_all.ps1 -Directory "src" -OutputDir "reports"

# Modo verboso
.\review_all.ps1 -VerboseMode
```

### No CMD

```cmd
cd D:\RH
run_reviewer.bat example_code.gs
run_reviewer.bat example_code.gs --verbose
run_reviewer.bat example_code.gs --output relatorio.txt
run_reviewer.bat example_code.gs --json
```

### Python Direto

```bash
cd D:\RH
python gas_code_reviewer.py example_code.gs
python gas_code_reviewer.py example_code.gs --verbose
python gas_code_reviewer.py example_code.gs -o relatorio.txt
python gas_code_reviewer.py example_code.gs --json
python gas_code_reviewer.py example_code.gs --stats-only
python gas_code_reviewer.py --help
```

## ⚠️ IMPORTANTE: Conflito com -Verbose

❌ **NÃO USE:**
```powershell
.\run_reviewer.ps1 example_code.gs -Verbose  # ERRO!
```

✅ **USE:**
```powershell
.\run_reviewer.ps1 example_code.gs -VerboseMode  # Correto
.\run_reviewer.ps1 example_code.gs -v            # Alias
```

**Motivo:** `-Verbose` é um parâmetro comum do PowerShell que causa conflito.

## 📋 Exemplos Práticos

### 1. Revisão Rápida
```powershell
python gas_code_reviewer.py Code.gs
```

### 2. Análise Detalhada com Relatório
```powershell
.\run_reviewer.ps1 Code.gs -v -Output "analise_code.txt"
```

### 3. Integração CI/CD (JSON)
```powershell
python gas_code_reviewer.py Code.gs --json > results.json
```

### 4. Revisar Projeto Completo
```powershell
.\review_all.ps1 -Json -OutputDir "ci_reports"
```

### 5. Estatísticas Rápidas
```powershell
Get-ChildItem *.gs | ForEach-Object {
    Write-Host "`n$($_.Name):"
    python gas_code_reviewer.py $_.FullName --stats-only
}
```

## 🔧 Opções Disponíveis

| Opção | PowerShell | CMD/Python | Descrição |
|-------|-----------|------------|-----------|
| Arquivo | `.\run_reviewer.ps1 file.gs` | `python ... file.gs` | Arquivo a revisar |
| Verboso | `-VerboseMode` ou `-v` | `--verbose` | Detalhes completos |
| Saída | `-Output file.txt` ou `-o` | `--output file.txt` | Salvar em arquivo |
| JSON | `-Json` | `--json` | Formato JSON |
| Stats | `-StatsOnly` | `--stats-only` | Apenas estatísticas |
| Ajuda | `-Help` | `--help` | Mostrar ajuda |

## 📊 Interpretando Resultados

### Severidades

- **❌ ERROS**: Código não vai funcionar ou tem bugs graves
- **⚠️ AVISOS**: Pode causar problemas ou dificultar manutenção
- **ℹ️ INFORMAÇÕES**: Sugestões de melhoria

### Score de Qualidade

- **90-100** 🌟 Excelente
- **70-89** 👍 Bom
- **50-69** ⚠️ Precisa melhorar
- **0-49** ❌ Necessita refatoração

### Estatísticas

- **Taxa de comentários**: Ideal > 20%
- **Issues por 100 linhas**: Ideal < 10
- **Funções encontradas**: Verifica modularização

## 🆘 Solução de Problemas

### Erro: "A parameter with the name 'Verbose' was defined multiple times"

✅ **Solução:** Use `-VerboseMode` ou `-v` ao invés de `-Verbose`

### Erro: "Python não encontrado"

✅ **Solução:**
1. Instale Python 3.7+
2. Adicione ao PATH
3. Reinicie terminal

### Erro: "Arquivo não encontrado"

✅ **Solução:**
```powershell
# Verifique o caminho
Test-Path example_code.gs

# Liste arquivos
Get-ChildItem *.gs
```

## 🎯 Dicas de Uso

1. **Use modo verboso** para primeira análise
2. **JSON** para automatização e CI/CD
3. **Stats-only** para overview rápido
4. **review_all.ps1** para projetos grandes
5. **Salve relatórios** para acompanhar progresso

## 📈 Integração CI/CD

```yaml
# Exemplo GitHub Actions
- name: Code Review
  run: |
    python gas_code_reviewer.py *.gs --json > report.json
    
- name: Check Quality Score
  run: |
    $score = (Get-Content report.json | ConvertFrom-Json).quality_score
    if ($score -lt 70) { exit 1 }
```
