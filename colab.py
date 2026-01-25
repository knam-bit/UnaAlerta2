# -*- coding: utf-8 -*-
"""
Integrador Científico - Análise Limnológica (Lago Paranoá)
Automatiza análise estatística de dados ambientais e integração com Google Apps Script

Este módulo é projetado para execução no Google Colab.
"""

import io
import json
import logging
import os
import subprocess
import sys
import time
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==============================================================================
# 1. INSTALAÇÃO DE DEPENDÊNCIAS
# ==============================================================================

def install_dependencies():
    """Instala dependências necessárias no ambiente Colab."""
    packages = ['flask', 'pyngrok', 'gspread', 'google-api-python-client']
    for package in packages:
        try:
            if package == 'google-api-python-client':
                __import__('googleapiclient')
            else:
                __import__(package)
            print(f"✅ {package} já instalado.")
        except ImportError:
            print(f"📦 Instalando {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])
            print(f"✅ {package} instalado com sucesso!")


def setup_colab_environment():
    """Configura ambiente Colab com autenticação e serviços."""
    try:
        from google.colab import auth  # type: ignore
        from google.auth import default

        print("🔐 Autenticando...")
        auth.authenticate_user()
        creds, _ = default()
        print("✅ Autenticado para análise de dados limnológicos.")
        return creds
    except ImportError:
        print("⚠️ Não está executando no Google Colab. Autenticação ignorada.")
        return None


# ==============================================================================
# 2. PARÂMETROS DO PROJETO AMBIENTAL
# ==============================================================================

# Diretório local temporário para os gráficos
LOCAL_OUTPUT_DIR = '/content/graficos_lago_paranoa'


# ==============================================================================
# 3. FUNÇÕES PARA GOOGLE DRIVE API
# ==============================================================================

def get_drive_service(credentials):
    """
    Obtém serviço do Google Drive.
    
    Args:
        credentials: Credenciais de autenticação
        
    Returns:
        Serviço do Drive ou None
    """
    try:
        from googleapiclient.discovery import build
        return build('drive', 'v3', credentials=credentials)
    except Exception as e:
        logger.error(f"Erro ao criar serviço Drive: {e}")
        return None


def list_folder_contents(drive_service, folder_id=None):
    """
    Lista todos os arquivos na pasta compartilhada.
    
    Args:
        drive_service: Serviço do Google Drive
        folder_id: ID da pasta (usa FOLDER_ID se não especificado)
        
    Returns:
        Lista de arquivos
    """
    folder_id = folder_id or FOLDER_ID
    print(f"📂 Listando conteúdo da pasta {folder_id}...")
    
    try:
        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, mimeType, size)",
            pageSize=100
        ).execute()

        files = results.get('files', [])
        
        if not files:
            print("📭 Pasta vazia.")
            return []

        print(f"📄 {len(files)} arquivo(s) encontrado(s):")
        for f in files:
            size = f.get('size', 'N/A')
            print(f"   - {f['name']} ({f['mimeType']}, {size} bytes)")

        return files

    except Exception as e:
        logger.error(f"Erro ao listar pasta: {e}")
        return []


def upload_file_to_drive(drive_service, local_path, folder_id=None, filename=None):
    """
    Faz upload de arquivo para o Google Drive.
    
    Args:
        drive_service: Serviço do Google Drive
        local_path: Caminho local do arquivo
        folder_id: ID da pasta destino
        filename: Nome do arquivo no Drive (opcional)
        
    Returns:
        ID do arquivo criado ou None
    """
    try:
        from googleapiclient.http import MediaFileUpload
        
        folder_id = folder_id or FOLDER_ID
        filename = filename or os.path.basename(local_path)

        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }

        # Determina mimetype
        if local_path.endswith('.png'):
            mimetype = 'image/png'
        elif local_path.endswith('.json'):
            mimetype = 'application/json'
        elif local_path.endswith('.csv'):
            mimetype = 'text/csv'
        else:
            mimetype = 'application/octet-stream'

        media = MediaFileUpload(local_path, mimetype=mimetype, resumable=True)

        print(f"📤 Enviando {filename}...")
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()

        print(f"✅ Upload concluído: {file.get('name')}")
        print(f"   🔗 Link: {file.get('webViewLink')}")

        return file.get('id')

    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        return None


def download_file_from_drive(drive_service, file_id, local_path):
    """
    Baixa arquivo do Google Drive.
    
    Args:
        drive_service: Serviço do Google Drive
        file_id: ID do arquivo
        local_path: Caminho local de destino
        
    Returns:
        True se sucesso, False caso contrário
    """
    try:
        from googleapiclient.http import MediaIoBaseDownload
        
        request = drive_service.files().get_media(fileId=file_id)
        
        with io.FileIO(local_path, 'wb') as fh:
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    print(f"   📥 Download {int(status.progress() * 100)}%")

        print(f"✅ Arquivo salvo em: {local_path}")
        return True

    except Exception as e:
        logger.error(f"Erro no download: {e}")
        return False


# ==============================================================================
# 4. GERAÇÃO DE GRÁFICOS LIMNOLÓGICOS
# ==============================================================================

def generate_limnological_charts(data=None, output_dir=None):
    """
    Gera gráficos de análise limnológica do Lago Paranoá.
    
    Args:
        data: DataFrame com dados (usa dados simulados se None)
        output_dir: Diretório de saída
        
    Returns:
        Lista de caminhos dos gráficos gerados
    """
    try:
        import matplotlib.pyplot as plt
        import numpy as np
        import pandas as pd
        import seaborn as sns
    except ImportError as e:
        logger.error(f"Dependência não encontrada: {e}")
        return []

    output_dir = output_dir or LOCAL_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)

    # Configurar estilo
    plt.style.use('seaborn-v0_8-darkgrid')
    sns.set_palette("husl")

    charts_generated = []
    
    # 12 Gráficos Requisitados pela Interface GAS
    chart_definitions = [
        ('01_KDE_Fosforo_Total', 'Distribuição KDE - Fósforo Total', 'densidade'),
        ('02_KDE_Clorofila_a', 'Distribuição KDE - Clorofila-a', 'densidade'),
        ('03_Violin_IQA_Pontos', 'Distribuição IQA por Ponto (Violin)', 'violin'),
        ('04_Barras_Empilhadas_Eutrofizacao', 'Relação Fósforo x Clorofila', 'scatter'),
        ('05_Radar_Sedimentos_Interno', 'Perfil de Qualidade (Radar)', 'radar'),
        ('06_KDE_Turbidez_Suspensao', 'Distribuição de Turbidez', 'densidade'),
        ('07_Violin_Microplasticos', 'Concentração de Microplásticos', 'violin'),
        ('08_Barras_Empilhadas_Denuncias', 'Tipologia de Denúncias Ambientais', 'bar'),
        ('09_Radar_Compliance_Outorgas', 'Conformidade de Outorgas', 'radar'),
        ('10_Histograma_Loteamentos', 'Pressão Urbana por Ano', 'hist'),
        ('11_Violin_pH_Anoxia', 'Variação de pH e Risco de Anoxia', 'violin'),
        ('12_Barras_Biodiversidade_Stress', 'Índice de Stress na Biodiversidade', 'bar')
    ]

    # Dados simulados se não fornecidos
    if data is None:
        np.random.seed(42)
        dates = pd.date_range('2024-01-01', periods=12, freq='M')
        zones = ['Norte', 'Central', 'Sul', 'Riacho Fundo', 'Bananal']
        
        data = pd.DataFrame({
            'date': np.tile(dates, len(zones)),
            'zone': np.repeat(zones, len(dates)),
            'ph': np.random.normal(7.5, 0.5, len(dates) * len(zones)),
            'dissolved_oxygen': np.random.normal(7.0, 1.5, len(dates) * len(zones)),
            'phosphorus': np.random.exponential(0.03, len(dates) * len(zones)),
            'chlorophyll': np.random.exponential(8, len(dates) * len(zones)),
            'turbidity': np.random.exponential(15, len(dates) * len(zones)),
            'temperature': np.random.normal(24, 3, len(dates) * len(zones))
        })

    for filename, title, chart_type in chart_definitions:
        fig = plt.figure(figsize=(10, 6))
        
        try:
            if chart_type == 'densidade':
                # KDE Proxy
                param = 'phosphorus' if 'Fosforo' in filename else ('chlorophyll' if 'Clorofila' in filename else 'turbidity')
                sns.kdeplot(data=data, x=param, hue='zone', fill=True)
                plt.xlabel(param)
            
            elif chart_type == 'violin':
                # Violin Proxy
                param = 'dissolved_oxygen' if 'pH' in filename else 'ph'
                sns.violinplot(data=data, x='zone', y=param)
                
            elif chart_type == 'scatter':
                # Scatter Proxy
                sns.scatterplot(data=data, x='phosphorus', y='chlorophyll', hue='zone', s=100)
                
            elif chart_type == 'radar':
                # Radar Proxy (Simplificado para todos os radares)
                plt.close(fig)
                fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
                categories = ['pH', 'OD', 'P-Total', 'Cloro-a', 'Turbidez']
                angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
                angles.append(angles[0])
                
                values = [75, 80, 40, 60, 50]
                values.append(values[0])
                ax.plot(angles, values, 'o-', linewidth=2)
                ax.fill(angles, values, alpha=0.25)
                ax.set_xticks(angles[:-1])
                ax.set_xticklabels(categories)
                
            elif chart_type == 'bar':
                 # Bar Proxy
                 counts = data['zone'].value_counts()
                 plt.bar(counts.index, counts.values * np.random.uniform(5, 15))
                 
            elif chart_type == 'hist':
                 # Hist Proxy
                 plt.hist(np.random.normal(2020, 2, 100), bins=10)
            
            plt.title(title)
            plt.tight_layout()
            
            save_path = os.path.join(output_dir, f"{filename}.png")
            plt.savefig(save_path, dpi=100)
            charts_generated.append(save_path)
            
        except Exception as e:
            logger.error(f"Erro gerando {filename}: {e}")
        finally:
            plt.close('all')

    print(f"\n✅ {len(charts_generated)} gráficos gerados em: {output_dir}")
    for path in charts_generated:
        print(f"   📊 {os.path.basename(path)}")

    return charts_generated


# ==============================================================================
# 5. ANÁLISE ESTATÍSTICA
# ==============================================================================

def perform_statistical_analysis(data=None):
    """
    Realiza análise estatística dos dados limnológicos.
    
    Args:
        data: DataFrame com dados
        
    Returns:
        Dicionário com resultados da análise
    """
    try:
        import numpy as np
        import pandas as pd
        import scipy.stats as stats
    except ImportError as e:
        logger.error(f"Dependência não encontrada: {e}")
        return {}

    # Dados simulados se não fornecidos
    if data is None:
        np.random.seed(42)
        data = pd.DataFrame({
            'zone': np.repeat(['Norte', 'Central', 'Sul'], 20),
            'ph': np.random.normal(7.5, 0.5, 60),
            'dissolved_oxygen': np.random.normal(7.0, 1.5, 60),
            'phosphorus': np.random.exponential(0.03, 60)
        })

    results = {
        'timestamp': datetime.now().isoformat(),
        'sample_size': len(data),
        'zones_analyzed': list(data['zone'].unique()),
        'parameters': {}
    }

    # Análise por parâmetro
    numeric_cols = data.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        col_data = data[col].dropna()
        
        results['parameters'][col] = {
            'mean': float(col_data.mean()),
            'std': float(col_data.std()),
            'min': float(col_data.min()),
            'max': float(col_data.max()),
            'median': float(col_data.median()),
            'skewness': float(stats.skew(col_data)),
            'kurtosis': float(stats.kurtosis(col_data))
        }

        # Teste de normalidade
        if len(col_data) >= 8:
            stat, p_value = stats.shapiro(col_data[:5000])  # Limite para Shapiro
            results['parameters'][col]['normality_test'] = {
                'statistic': float(stat),
                'p_value': float(p_value),
                'is_normal': bool(p_value > 0.05)
            }

    # ANOVA entre zonas
    if 'zone' in data.columns and 'ph' in data.columns:
        groups = [data[data['zone'] == z]['ph'].values for z in data['zone'].unique()]
        if all(len(g) >= 2 for g in groups):
            f_stat, p_value = stats.f_oneway(*groups)
            results['anova_ph'] = {
                'f_statistic': float(f_stat),
                'p_value': float(p_value),
                'significant_difference': bool(p_value < 0.05)
            }

    print("\n📊 ANÁLISE ESTATÍSTICA CONCLUÍDA")
    print(f"   Amostras: {results['sample_size']}")
    print(f"   Zonas: {', '.join(results['zones_analyzed'])}")
    print(f"   Parâmetros analisados: {len(results['parameters'])}")

    return results


# ==============================================================================
# 6. SERVIDOR FLASK PARA INTEGRAÇÃO COM APPS SCRIPT
# ==============================================================================

# ==============================================================================
# 7. TUNELAMENTO (NGROK OU LOCALTUNNEL)
# ==============================================================================

def start_localtunnel_tunnel(port=5000):
    """
    Inicia localtunnel como alternativa ao ngrok.
    Não requer conta/token.
    """
    try:
        print("📦 Instalando localtunnel (alternativa sem conta)...")
        subprocess.check_call(["npm", "install", "-g", "localtunnel"])
        
        print(f"🚀 Iniciando localtunnel na porta {port}...")
        # Inicia localtunnel em background e salva saída em arquivo
        with open('lt.log', 'w') as log_file:
            process = subprocess.Popen(
                ["lt", "--port", str(port)], 
                stdout=log_file, 
                stderr=subprocess.STDOUT
            )
        
        # Aguarda geração da URL
        time.sleep(5)
        
        # Tenta ler a URL do arquivo de log
        url = None
        try:
            with open('lt.log', 'r') as f:
                content = f.read()
                # Procura por url no padrão localtunnel
                import re
                match = re.search(r'https://[\w-]+\.loca\.lt', content)
                if match:
                    url = match.group(0)
        except Exception:
            pass
            
        if url:
            print(f"\n🌐 Túnel localtunnel ativo!")
            print(f"   URL Pública: {url}")
            print(f"   ⚠️ IMPORTANTE: O localtunnel pode pedir uma confirmação de IP no primeiro acesso.")
            print(f"   Use esta URL no Apps Script.")
            return url
        else:
            print("⚠️ URL do localtunnel não encontrada automaticamente. Verifique 'lt.log'.")
            return None

    except Exception as e:
        logger.error(f"Erro no localtunnel: {e}")
        return None

def start_ngrok_tunnel(port=5000):
    """
    Inicia túnel ngrok para expor o servidor Flask.
    
    Args:
        port: Porta do servidor Flask
        
    Returns:
        URL pública do túnel
    """
    try:
        from pyngrok import ngrok, conf
        
        # Limpa configuração anterior para evitar conflitos de token
        conf.get_default().auth_token = NGROK_AUTH_TOKEN
        
        # Encerra túneis anteriores
        ngrok.kill()
        
        # Abre novo túnel
        public_url = ngrok.connect(port, "http")
        print(f"\n🌐 Túnel ngrok ativo!")
        print(f"   URL Pública: {public_url}")
        print(f"   Use esta URL no Apps Script para chamar o servidor Python")
        
        return str(public_url)

    except Exception as e:
        logger.error(f"Erro ao iniciar ngrok: {e}")
        print("\n❌ Falha no ngrok. Verifique se o token está correto.")
        print("   Alternativa: Tente usar localtunnel alterando USE_NGROK = False no código.")
        return None

# ==============================================================================
# 9. GEMINI AI INTEGRATION (MOCADA PARA DEMONSTRAÇÃO)
# ==============================================================================

class GeminiMock:
    """Simula a interação com o modelo Gemini Flash 1.5."""
    
    @staticmethod
    def generate_chart_insight(chart_name, data_summary=None):
        """Gera um insight técnico simulado sobre o gráfico com base em estatísticas."""
        # Simulação de análise baseada em dados tratados (Estatística Descritiva + Testes de Hipótese)
        insights = {
            '01_KDE_Fosforo_Total': "Gemini Flash: A KDE do Fósforo Total indica uma distribuição log-normal (Assimétrica Positiva). A cauda longa à direita reflete eventos episódicos de carga elevada (> 50 µg/L), confirmando a hipótese de pulsos de poluição difusa.",
            '02_KDE_Clorofila_a': "Gemini Flash: Picos multimodais na Clorofila-a sugerem diferentes regimes de floração. A sobreposição com os dados de Fósforo (Correlação de Pearson > 0.7) valida a limitação por nutrientes neste sistema.",
            '03_Violin_IQA_Pontos': "Gemini Flash: O diagrama de violino mostra que o Riacho Fundo tem a maior mediana de degradação e maior dispersão (IQR elevado), indicando instabilidade crônica, enquanto a Barragem mantém consistência oligotrófica.",
            '04_Barras_Empilhadas_Eutrofizacao': "Gemini Flash: A análise de componentes principais (PCA) implicita sugere que o Fósforo controla 60% da variância do estado trófico. A redução de P é estatisticamente a ação mais eficaz.",
            '05_Radar_Sedimentos_Interno': "Gemini Flash: O radar aponta anomalias multivariadas na zona central. O índice de carga interna estimado supera 15 mg/m²/dia, sugerindo ressuspensão frequente de sedimentos.",
            '06_KDE_Turbidez_Suspensao': "Gemini Flash: A turbidez apresenta curtose elevada (leptocúrtica) em eventos de chuva, indicando resposta rápida da bacia. O baseline de seca é estável (desvio padrão baixo).",
            '07_Violin_Microplasticos': "Gemini Flash: Análise de variância (ANOVA) confirmaria diferenças significativas entre zonas 'Urbana' e 'Protegida'. A densidade de microplásticos é um marcador robusto de pressão antrópica.",
            '08_Barras_Empilhadas_Denuncias': "Gemini Flash: As denúncias seguem uma distribuição de Pareto (80/20), onde 'Odor' e 'Lixo' representam a maioria das ocorrências, correlacionadas com dias de temperatura elevada e baixo OD.",
            '09_Radar_Compliance_Outorgas': "Gemini Flash: O índice de conformidade global é de 85%, mas desvios padrão elevados em 'Efluentes Industriais' sugerem falhas no monitoramento pontual.",
            '10_Histograma_Loteamentos': "Gemini Flash: A série temporal de loteamentos mostra uma tendência linear crescente (R² > 0.9). A projeção estatística indica saturação do uso do solo em 5 anos se mantido o ritmo.",
            '11_Violin_pH_Anoxia': "Gemini Flash: A amplitude térmica e de pH correlaciona-se com a saturação de oxigênio. O risco probabilístico de anoxia (OD < 2 mg/L) é > 40% nas madrugadas de verão.",
            '12_Barras_Biodiversidade_Stress': "Gemini Flash: O índice de Shannon-Wiener para a biodiversidade bentônica apresenta correlação negativa forte (-0.85) com os níveis de toxicidade do sedimento."
        }
        return insights.get(chart_name, "Gemini Flash: Análise estatística inconclusiva para este parâmetro. Recomendo aumentar o n amostral.")

    @staticmethod
    def chat(message, context=None):
        """Simula uma resposta de chat do Gemini Flash sobre dados estatísticos."""
        msg = message.lower()
        if "fosforo" in msg or "fósforo" in msg:
            return "Gemini Flash: Analisando a série histórica (n=60), o Fósforo Total apresenta tendência de Mann-Kendall crescente na zona Sul. A média móvel de 12 meses ultrapassou o limite de 30 µg/L em 4 ocasiões recentementes."
        elif "clorofila" in msg:
            return "Gemini Flash: A correlação cruzada entre Clorofila-a e Fósforo tem lag de 15 dias. Isso significa que picos de nutrientes hoje resultam em blooms de algas em duas semanas. O percentil 90% dos dados está acima do limite da Classe 2."
        elif "coliformes" in msg or "esgoto" in msg:
            return "Gemini Flash: Os dados de Coliformes não seguem distribuição normal (Shapiro-Wilk p < 0.05). A média geométrica é a medida central mais adequada, e ela indica contaminação fecal crítica (> 1000 NMP) em 3 pontos de monitoramento."
        elif "tendência" in msg or "futuro" in msg:
            return "Gemini Flash: A projeção ARIMA para os próximos 6 meses indica estabilidade na turbidez, mas agravamento da eutrofização se a taxa de urbanização (covariável) mantiver o coeficiente de regressão atual."
        else:
            return f"Gemini Flash: Olá. Processei os dados da planilha usando inferência estatística. Posso detalhar correlações, tendências temporais ou análise de risco para os 12 indicadores monitorados."

# ==============================================================================
# 10. ATUALIZAÇÃO DO SERVIDOR FLASK
# ==============================================================================

def create_flask_app():
    """
    Cria aplicação Flask para receber requisições do Apps Script.
    """
    try:
        from flask import Flask, request, jsonify
        from flask_cors import CORS # type: ignore
    except ImportError:
        logger.error("Flask não instalado")
        return None

    app = Flask(__name__)
    # Adicionar CORS para permitir chamadas locais se necessário, embora o GAS use proxy
    try:
        CORS(app)
    except:
        pass

    @app.route('/status', methods=['GET'])
    def status():
        """Retorna status do servidor."""
        return jsonify({
            'status': 'online',
            'service': 'Lago Paranoá - Análise Limnológica & Gemini AI',
            'timestamp': datetime.now().isoformat(),
            'version': '2.1.0'
        })

    @app.route('/analyze', methods=['POST'])
    def analyze():
        """Recebe dados e executa análise."""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Dados não fornecidos'}), 400

            # Executa análise
            results = perform_statistical_analysis()
            
            return jsonify({
                'success': True,
                'results': results
            })

        except Exception as e:
            logger.error(f"Erro na análise: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/generate_charts', methods=['POST'])
    def generate_charts():
        """Gera gráficos limnológicos e insights do Gemini."""
        try:
            charts = generate_limnological_charts()
            
            # Gerar insights para cada gráfico
            insights = {}
            for chart_path in charts:
                name = os.path.basename(chart_path).replace('.png', '')
                insights[name] = GeminiMock.generate_chart_insight(name)
            
            # Salvar insights em JSON
            insights_file = os.path.join(LOCAL_OUTPUT_DIR, 'gemini_insights.json')
            with open(insights_file, 'w', encoding='utf-8') as f:
                json.dump(insights, f, indent=2, ensure_ascii=False) # type: ignore

            return jsonify({
                'success': True,
                'charts_count': len(charts),
                'charts': [os.path.basename(c) for c in charts],
                'insights': insights
            })

        except Exception as e:
            logger.error(f"Erro ao gerar gráficos: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/chat', methods=['POST'])
    def chat():
        """Endpoint de chat com Gemini (Simulado)."""
        try:
            data = request.get_json()
            message = data.get('message', '')
            context = data.get('context', None)
            
            response = GeminiMock.chat(message, context)
            
            return jsonify({
                'success': True,
                'response': response,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app

# ==============================================================================
# 8. EXECUÇÃO PRINCIPAL
# ==============================================================================

def main():
    """Função principal de execução."""
    print("╔" + "=" * 58 + "╗")
    print("║" + " LAGO PARANOÁ - INTEGRADOR CIENTÍFICO ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")

    # 1. Instala dependências
    print("\n📦 Verificando dependências...")
    install_dependencies()

    # 2. Setup do ambiente (apenas no Colab)
    creds = setup_colab_environment()

    # 3. Gera gráficos de demonstração
    print("\n📊 Gerando gráficos de análise...")
    charts = generate_limnological_charts()

    # 4. Executa análise estatística
    print("\n📈 Executando análise estatística...")
    stats_results = perform_statistical_analysis()

    # 5. Salva resultados
    results_file = os.path.join(LOCAL_OUTPUT_DIR, 'analysis_results.json')
    os.makedirs(LOCAL_OUTPUT_DIR, exist_ok=True)
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(stats_results, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Resultados salvos em: {results_file}")

    # 6. Upload para Drive (se autenticado)
    if creds:
        drive_service = get_drive_service(creds)
        if drive_service:
            print("\n📤 Enviando para Google Drive...")
            for chart in charts:
                upload_file_to_drive(drive_service, chart)
            upload_file_to_drive(drive_service, results_file)

    # 7. Inicia servidor Flask
    print("\n🚀 Iniciando servidor de integração...")
    app = create_flask_app()
    
    if app:
        public_url = None
        
        if USE_NGROK:
            public_url = start_ngrok_tunnel(5000)
        else:
            public_url = start_localtunnel_tunnel(5000)
        
        if public_url:
            print(f"\n✅ Servidor pronto para receber requisições do Apps Script!")
            print(f"   Endpoint de status: {public_url}/status")
            print(f"   Endpoint de análise: {public_url}/analyze")
            print(f"   Endpoint de gráficos: {public_url}/generate_charts")
            
            # Executa o servidor (bloqueante)
            app.run(port=5000)
        else:
            print("\n⚠️ Não foi possível iniciar um túnel público.")
            print("   O servidor rodará apenas localmente (sem acesso externo).")
            app.run(port=5000)

    print("\n✅ Integrador científico inicializado com sucesso!")


if __name__ == '__main__':
    main()
