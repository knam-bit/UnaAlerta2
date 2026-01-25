/**
 * @file ResponsiveHandler.gs
 * @project Monitoramento Lago Paranoá
 * @category mobile
 * @tags responsive, mobile, logic
 * @architecture Mobile-First, Offline-First
 * @description Componente gerado para monitoramento de indicadores e conscientização civil.
 * @context Relatorio.md - Dinâmica Limnológica e Governança do Lago Paranoá
 */

function ResponsiveHandler() {
  // Implementação lógica para mobile
  
  return {
    /**
     * Adapta a densidade de dados dos gráficos para telas pequenas
     * Contexto: Visualização de Séries Temporais (Seção 8 - Monitoramento Integrado)
     */
    adaptChartDensity: function(screenWidth, dataset) {
      if (screenWidth < 768) {
         // Mobile: Retorna apenas médias diárias ou pontos críticos para não poluir a tela
         console.info('Mobile View: Simplificando série temporal de Oxigênio Dissolvido para visualização rápida.');
         // Downsampling: Pega 1 a cada 5 pontos
         return dataset.filter((_, index) => index % 5 === 0); 
      }
      return dataset; // Desktop: Resolução total para análise técnica
    },

    /**
     * Define layout de cards para alertas críticos
     * Contexto: Alertas de Bloom, Esgoto e "Ponta de Picolé" (Seção 5, 3.2 e 7.3)
     */
    getLayoutConfig: function(userAgent) {
       const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
       
       return {
         isMobile: isMobile,
         columns: isMobile ? 1 : 3, // Coluna única no mobile para evitar scroll horizontal
         mapInteraction: isMobile ? 'TOUCH_GESTURES' : 'MOUSE_DRAG',
         alertPriority: isMobile ? 'PUSH_NOTIFICATION_STYLE' : 'DASHBOARD_BANNER',
         dashboardMode: isMobile ? 'EXECUTIVE_SUMMARY' : 'ANALYTICAL_FULL'
       };
    },

    /**
     * Traduz termos técnicos limnológicos para linguagem cidadã (Controle Social)
     * Contexto: Relatorio.md - 1. Introdução e 4.1 Histerese e Carga Interna
     * Objetivo: Tornar o "diagnóstico médico" do lago compreensível para leigos.
     */
    translateLimnologicalStatus: function(technicalTerm) {
      const dictionary = {
        'HYSTERESIS_ACTIVE': {
           label: 'Memória de Poluição Ativa',
           color: '#F39C12', // Orange
           message: 'O lago está "resistindo" à limpeza devido a poluição antiga acumulada no fundo.'
        },
        'HIGH_INTERNAL_LOAD_RISK': {
           label: 'Risco de "Bomba Interna"',
           color: '#E74C3C', // Red
           message: 'Alerta Crítico: Nutrientes do fundo estão subindo e alimentando algas.'
        },
        'TOXIC_BLOOM_RISK': {
           label: 'Sopa de Ervilha Tóxica',
           color: '#8E44AD', // Purple (Biohazard)
           message: 'Perigo: Cianobactérias detectadas. Evite contato direto (Risco de dermatites/intoxicação).'
        },
        'CRITICAL_RECHARGE_LOSS': {
           label: 'Zona de Recarga Comprometida',
           color: '#C0392B',
           message: 'A urbanização está impedindo a chuva de reabastecer o lençol freático.'
        }
      };
      
      return dictionary[technicalTerm] || { label: 'Monitoramento Normal', color: '#2ECC71', message: 'Parâmetros dentro do esperado.' };
    },

    /**
     * Ajusta visualização cartográfica baseada no papel do usuário
     * Contexto: Relatorio.md - 7.3 O Conflito da Orla (Fiscalização vs Lazer)
     */
    getMapLayerVisibility: function(userRole) {
       // O Fiscal vê infrações e dados brutos (API Aberta - Seção 7.1)
       if (userRole === 'FISCAL_ADASA' || userRole === 'FISCAL_IBRAM') {
           return ['CRITICAL_RECHARGE_ZONES', 'ILLEGAL_DRAINAGE_POINTS', 'APP_ENCROACHMENT_POLYGONS', 'OUTORGA_TELEMETRY'];
       }
       // O Cidadão vê áreas de lazer seguras e pontos de educação
       return ['BATHING_QUALITY_FLAGS', 'PUBLIC_ACCESS_POINTS', 'EDUCATION_SPOTS', 'CITIZEN_REPORTS'];
    },

    /**
     * Injeta CSS crítico para tabelas de fiscalização em telas pequenas
     * Contexto: Relatorio.md - 7.1 Fiscalização
     */
    injectMobileStyles: function() {
       return `
         <style>
           @media (max-width: 600px) {
             .data-table td, .data-table th { display: block; width: 100%; }
             .chart-container { height: 250px; } /* Altura reduzida para gráficos */
             .alert-banner { font-size: 14px; padding: 10px; }
           }
         </style>
       `;
    }
  };
}