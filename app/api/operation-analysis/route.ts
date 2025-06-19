import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { operation, detailed = false } = await request.json()

    const plannedProfit = operation.plannedProfit || 0
    const actualProfit = operation.actualProfit || 0
    const profitDifference = actualProfit - plannedProfit
    const profitDifferencePercent = plannedProfit !== 0 ? (profitDifference / Math.abs(plannedProfit)) * 100 : 0

    const duration =
      operation.endTime && operation.startTime
        ? Math.floor((new Date(operation.endTime).getTime() - new Date(operation.startTime).getTime()) / (1000 * 60))
        : 0

    const prompt = detailed
      ? `
    Você é um especialista em análise de trading quantitativo. Faça uma análise DETALHADA da operação finalizada.

    📊 DADOS DA OPERAÇÃO:
    - Ativo: ${operation.symbol}
    - Direção: ${operation.direction}
    - Preço Entrada: $${operation.entryPrice}
    - Preço Saída: $${operation.exitPrice}
    - Stop Loss: $${operation.stopLoss}
    - Alavancagem: ${operation.leverage}x
    - Investimento: $${operation.investment}
    - Status: ${operation.status}
    - Duração: ${duration} minutos

    💰 ANÁLISE FINANCEIRA:
    - Lucro Planejado: $${plannedProfit.toFixed(2)}
    - Lucro Real: $${actualProfit.toFixed(2)}
    - Diferença: $${profitDifference.toFixed(2)} (${profitDifferencePercent.toFixed(1)}%)
    - Taxa de Sucesso IA: ${operation.successRate}%

    🤖 RECOMENDAÇÃO ORIGINAL DA IA:
    ${operation.aiRecommendation || "Não disponível"}

    FORNEÇA UMA ANÁLISE COMPLETA SEGUINDO ESTE FORMATO:

    🎯 **RESULTADO DA OPERAÇÃO**: [SUCESSO/FALHA/PARCIAL]

    📈 **ANÁLISE DE PERFORMANCE**:
    • Precisão da IA: [X/10]
    • Execução vs Planejamento: [X/10]
    • Gestão de Risco: [X/10]
    • Timing de Entrada/Saída: [X/10]

    🔍 **FATORES DE SUCESSO/FALHA**:
    [Análise detalhada dos fatores que contribuíram para o resultado]

    📊 **LIÇÕES APRENDIDAS**:
    [Insights específicos desta operação]

    🚀 **RECOMENDAÇÕES FUTURAS**:
    [Sugestões para melhorar operações similares]

    💡 **AJUSTES SUGERIDOS**:
    [Modificações específicas na estratégia]

    🎲 **SCORE FINAL**: [X]/100
    [Avaliação geral da operação e aprendizados]
    `
      : `
    Analise rapidamente esta operação de trading finalizada:

    📊 OPERAÇÃO: ${operation.symbol} ${operation.direction}
    💰 Planejado: $${plannedProfit.toFixed(2)} | Real: $${actualProfit.toFixed(2)}
    ⏱️ Duração: ${duration}min | Status: ${operation.status}

    Forneça uma análise CONCISA em 3-4 linhas sobre:
    1. Se a operação foi bem-sucedida
    2. Principal fator do resultado
    3. Uma lição aprendida
    `

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxTokens: detailed ? 1200 : 300,
      temperature: 0.3,
    })

    return NextResponse.json({
      analysis: text,
      metrics: {
        profitDifference,
        profitDifferencePercent,
        duration,
        success: actualProfit > 0,
        accuracyScore: Math.max(0, 100 - Math.abs(profitDifferencePercent)),
      },
    })
  } catch (error) {
    console.error("Erro na análise da operação:", error)

    // Fallback analysis
    const operation = await request.json()
    const isSuccess = (operation.actualProfit || 0) > 0

    return NextResponse.json({
      analysis: `
${isSuccess ? "✅ OPERAÇÃO BEM-SUCEDIDA" : "❌ OPERAÇÃO COM PREJUÍZO"}

📊 Resultado: ${isSuccess ? "Lucro" : "Prejuízo"} de $${Math.abs(operation.actualProfit || 0).toFixed(2)}
⏱️ Duração: ${operation.duration || "N/A"}
💡 Lição: ${isSuccess ? "Estratégia funcionou conforme esperado" : "Mercado se moveu contra a posição"}

⚠️ Análise em modo fallback - Para análise completa, verifique conexão com IA.
      `,
      metrics: {
        profitDifference: (operation.actualProfit || 0) - (operation.plannedProfit || 0),
        profitDifferencePercent: 0,
        duration: 0,
        success: isSuccess,
        accuracyScore: 50,
      },
    })
  }
}
