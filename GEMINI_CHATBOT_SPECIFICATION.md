# Especificação: Chatbots Gemini Flash 1.5 para os 12 Gráficos

## Visão Geral
O sistema contará com **12 instâncias independentes** de chatbots baseados no Gemini Flash 1.5. Cada chatbot será acoplado diretamente a um gráfico específico, garantindo que o diálogo seja estritamente contextualizado aos dados daquele indicador.

## Detalhamento dos 12 Chatbots

Cada gráfico listado abaixo possuirá um botão "Assistente IA" dedicado na sua interface:

1.  **Chatbot de Temperatura**: Especializado em variações térmicas.
2.  **Chatbot de pH**: Focado em acidez/alcalinidade.
3.  **Chatbot de Oxigênio Dissolvido**: Analisa a oxigenação da água.
4.  **Chatbot de Turbidez**: Monitora a transparência e sólidos suspensos.
5.  **Chatbot de Condutividade**: Avalia a presença de íons dissolvidos.
6.  **Chatbot de Clorofila-a**: Monitora a presença de algas.
7.  **Chatbot de Nutrientes**: Analisa níveis de Nitrogênio e Fósforo.
8.  **Chatbot de Profundidade**: Relaciona dados com a batimetria local.
9.  **Chatbot de Vazão**: Analisa o fluxo de entrada/saída de água.
10. **Chatbot de Precipitação**: Correlaciona chuvas com a qualidade da água.
11. **Chatbot de Nível do Reservatório**: Monitora o volume armazenado.
12. **Chatbot de IQA (Qualidade Geral)**: Sintetiza o índice geral.

## Estrutura de Contexto Individual
Para cada instância, o prompt do sistema será injetado dinamicamente:

```json
{
  "system_instruction": "Você é um especialista no gráfico de [NOME_DO_GRÁFICO]. Responda apenas com base nos seguintes dados: [DADOS_DO_GRÁFICO].",
  "temperature": 0.2
}
```

