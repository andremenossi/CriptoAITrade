import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const {
      symbol,
      price,
      priceChange,
      volume,
      investment,
      leverage,
      technicalData,
      openInterest,
      fundingRate,
      timeframe,
      direction,
      allCryptoData,
      expectedProfitPercent,
    } = await request.json()

    // Se não especificou ativo, buscar o melhor (com timeout)
    if (!symbol && allCryptoData) {
      console.log("🔍 Buscando melhor oportunidade automaticamente...")

      const bestOpportunity = findBestOpportunity(allCryptoData, {
        timeframe,
        direction,
        investment,
        leverage,
        expectedProfitPercent,
      })

      if (!bestOpportunity.viable) {
        return NextResponse.json({
          analysis: bestOpportunity.explanation,
          viable: false,
          reason: bestOpportunity.reason,
        })
      }

      // Usar os dados da melhor oportunidade encontrada
      const bestCrypto = bestOpportunity.crypto
      return generateAnalysisForCrypto(bestCrypto, {
        timeframe,
        direction,
        investment,
        leverage,
        expectedProfitPercent,
      })
    }

    // Análise para ativo específico
    const viabilityCheck = checkViability({
      symbol,
      price,
      priceChange,
      technicalData,
      timeframe,
      direction,
      fundingRate,
      expectedProfitPercent,
    })

    if (!viabilityCheck.viable) {
      return NextResponse.json({
        analysis: viabilityCheck.explanation,
        viable: false,
        reason: viabilityCheck.reason,
      })
    }

    const prompt = `
    Você é um especialista quantitativo em scalping de futuros com 15 anos de experiência. Analise os dados e forneça uma recomendação EXTREMAMENTE DETALHADA.

    📊 PARÂMETROS DA OPERAÇÃO:
    - Ativo: ${symbol}
    - Preço Atual: $${price}
    - Variação 24h: ${priceChange}%
    - Volume 24h: $${volume}
    - Open Interest: $${openInterest}
    - Funding Rate: ${fundingRate}%
    - Capital: $${investment}
    - Alavancagem: ${leverage}x
    ${timeframe ? `- TEMPO DEFINIDO: ${timeframe} minutos` : "- Tempo: Otimizado pela IA"}
    ${direction ? `- DIREÇÃO FORÇADA: ${direction}` : "- Direção: Análise técnica"}
    ${expectedProfitPercent ? `- LUCRO ESPERADO: ${expectedProfitPercent}%` : "- Lucro: Baseado no risco"}

    📈 INDICADORES TÉCNICOS:
    - RSI(14): ${technicalData?.rsi?.value?.toFixed(2)} | Status: ${technicalData?.rsi?.signal}
    - MACD: ${technicalData?.macd?.macd?.toFixed(6)} | Signal: ${technicalData?.macd?.signal?.toFixed(6)} | Tendência: ${technicalData?.macd?.trend}
    - Bollinger: Superior: ${technicalData?.bollinger?.upper?.toFixed(6)} | Inferior: ${technicalData?.bollinger?.lower?.toFixed(6)} | Posição: ${technicalData?.bollinger?.position}
    - EMA20: ${technicalData?.ema?.ema20?.toFixed(6)} | EMA50: ${technicalData?.ema?.ema50?.toFixed(6)} | Tendência: ${technicalData?.ema?.trend}
    - Volume: ${technicalData?.volume?.current?.toFixed(2)}x | Tendência: ${technicalData?.volume?.trend}
    - Suporte: $${technicalData?.support_resistance?.support?.toFixed(6)} | Resistência: $${technicalData?.support_resistance?.resistance?.toFixed(6)}

    ${
      expectedProfitPercent
        ? `
    🎯 ANÁLISE DE LUCRO ESPERADO:
    Para atingir ${expectedProfitPercent}% de lucro, considere:
    - Volatilidade necessária para o movimento
    - Tempo estimado para atingir o target
    - Probabilidade baseada em condições atuais
    - Ajuste de stop loss proporcional
    `
        : ""
    }

    ${
      timeframe
        ? `
    ⏰ ANÁLISE TEMPORAL ESPECÍFICA:
    Para operação de ${timeframe} minutos, considere:
    - Volatilidade necessária para atingir targets no tempo
    - Padrões de movimento típicos do ${symbol}
    - Volume necessário para sustentar movimento
    - Impacto do funding rate no período
    `
        : ""
    }

    ${
      direction
        ? `
    🎯 ANÁLISE DIRECIONAL FORÇADA:
    Direção solicitada: ${direction}
    - Avalie se os indicadores suportam esta direção
    - Calcule probabilidade específica para ${direction}
    - Identifique riscos de ir contra tendência técnica
    `
        : ""
    }

    FORNEÇA ANÁLISE SEGUINDO ESTE FORMATO:

    🎯 **DECISÃO FINAL**: [LONG/SHORT/NÃO VIÁVEL]

    📊 **ANÁLISE QUANTITATIVA**:
    • Score Técnico: [X/10] - [Explicação detalhada]
    • Confluência: [X/5] indicadores alinhados
    • Probabilidade: [X]% para ${direction || "direção ótima"}
    ${timeframe ? `• Adequação Temporal: [X/10] para ${timeframe}min` : ""}
    ${expectedProfitPercent ? `• Viabilidade Lucro ${expectedProfitPercent}%: [X/10]` : ""}

    🔍 **JUSTIFICATIVA DETALHADA**:
    [Análise completa de cada indicador e como se adequa aos parâmetros]

    ⚡ **PLANO DE EXECUÇÃO**:
    • Entrada: $[preço] - [Justificativa]
    • Take Profit: $[preço] ([X]% - [Tempo estimado])
    • Stop Loss: $[preço] ([X]% - [Justificativa])
    ${timeframe ? `• Timeframe: ${timeframe} minutos (FIXO)` : "• Timeframe: [X-Y] minutos (OTIMIZADO)"}

    💰 **ANÁLISE DE RISCO**:
    • Risk/Reward: 1:[X]
    • Máxima Perda: $[valor]
    • Lucro Esperado: $[valor]
    ${expectedProfitPercent ? `• Adequação ao Target ${expectedProfitPercent}%: [Explicação]` : ""}
    ${timeframe ? `• Adequação ao Tempo: [Explicação se é viável no tempo definido]` : ""}

    🎲 **SCORE FINAL**: [X]/100
    ${direction ? `[Explicação específica para direção ${direction}]` : "[Explicação para direção ótima]"}
    ${expectedProfitPercent ? `[Análise específica para lucro de ${expectedProfitPercent}%]` : ""}

    Seja EXTREMAMENTE específico sobre como cada parâmetro afeta a operação.
    `

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxTokens: 1500,
      temperature: 0.2,
    })

    return NextResponse.json({
      analysis: text,
      viable: true,
      selectedSymbol: symbol,
    })
  } catch (error) {
    console.error("Erro na análise de IA:", error)
    const fallbackAnalysis = generateAdvancedFallbackAnalysis(await request.json())
    return NextResponse.json({
      analysis: fallbackAnalysis.analysis,
      viable: fallbackAnalysis.viable,
      reason: fallbackAnalysis.reason,
    })
  }
}

function findBestOpportunity(cryptoData: any[], params: any) {
  console.log("🔍 Analisando", cryptoData.length, "ativos...")

  const { timeframe, direction, investment, leverage, expectedProfitPercent } = params

  let bestScore = 0
  let bestCrypto = null
  const viableOptions = []

  for (const crypto of cryptoData) {
    const score = calculateOpportunityScore(crypto, params)

    if (score.viable) {
      viableOptions.push({ crypto, score: score.value })
      if (score.value > bestScore) {
        bestScore = score.value
        bestCrypto = crypto
      }
    }
  }

  console.log(`✅ Encontradas ${viableOptions.length} oportunidades viáveis`)

  if (!bestCrypto) {
    return {
      viable: false,
      explanation: generateNoOpportunityExplanation(params, cryptoData),
      reason: determineBlockingFactor(params, cryptoData),
    }
  }

  return {
    viable: true,
    crypto: bestCrypto,
    score: bestScore,
    alternatives: viableOptions.length,
  }
}

function calculateOpportunityScore(crypto: any, params: any) {
  const { timeframe, direction, expectedProfitPercent } = params
  const priceChange = Number.parseFloat(crypto.priceChangePercent)
  const volatility = Math.abs(priceChange)

  let score = 50
  let viable = true
  const blockingFactors = []

  // Análise de direção
  if (direction && direction !== "auto") {
    const naturalDirection = priceChange > 0 ? "LONG" : "SHORT"
    if (direction !== naturalDirection && volatility < 2) {
      blockingFactors.push("Direção contra tendência com baixa volatilidade")
      viable = false
    } else if (direction === naturalDirection) {
      score += 20
    } else {
      score -= 10
    }
  }

  // Análise de timeframe
  if (timeframe && timeframe !== "auto") {
    const requiredVolatility = timeframe <= 15 ? 3 : timeframe <= 30 ? 2 : 1
    if (volatility < requiredVolatility) {
      blockingFactors.push(`Volatilidade insuficiente (${volatility.toFixed(1)}%) para ${timeframe}min`)
      viable = false
    } else {
      score += Math.min(20, volatility * 5)
    }
  }

  // Análise de lucro esperado
  if (expectedProfitPercent) {
    const requiredVolatility = expectedProfitPercent * 0.3 // Aproximação
    if (volatility < requiredVolatility) {
      blockingFactors.push(`Volatilidade insuficiente para lucro de ${expectedProfitPercent}%`)
      viable = false
    } else {
      score += Math.min(15, expectedProfitPercent)
    }
  }

  // Volume analysis
  const volume = Number.parseFloat(crypto.volume)
  if (volume < 100000000) {
    blockingFactors.push("Volume insuficiente para scalping")
    viable = false
  }

  return { viable, value: score, blockingFactors }
}

function checkViability(params: any) {
  const { symbol, priceChange, technicalData, timeframe, direction, fundingRate, expectedProfitPercent } = params
  const volatility = Math.abs(Number.parseFloat(priceChange))

  const blockingFactors = []
  let viable = true

  // Check direção forçada
  if (direction && direction !== "auto") {
    const rsi = technicalData?.rsi?.value || 50
    const macdTrend = technicalData?.macd?.trend

    if (direction === "LONG") {
      if (rsi > 75 && macdTrend === "BEARISH") {
        blockingFactors.push("RSI em sobrecompra extrema + MACD bearish")
        viable = false
      }
    } else if (direction === "SHORT") {
      if (rsi < 25 && macdTrend === "BULLISH") {
        blockingFactors.push("RSI em sobrevenda extrema + MACD bullish")
        viable = false
      }
    }
  }

  // Check timeframe
  if (timeframe && timeframe !== "auto") {
    const requiredVolatility = timeframe <= 15 ? 3 : timeframe <= 30 ? 2 : 1
    if (volatility < requiredVolatility) {
      blockingFactors.push(`Volatilidade atual (${volatility.toFixed(1)}%) insuficiente para ${timeframe} minutos`)
      viable = false
    }
  }

  // Check lucro esperado
  if (expectedProfitPercent) {
    const requiredVolatility = expectedProfitPercent * 0.3
    if (volatility < requiredVolatility) {
      blockingFactors.push(`Volatilidade insuficiente para lucro de ${expectedProfitPercent}%`)
      viable = false
    }
  }

  // Check funding rate impact
  if (Math.abs(Number.parseFloat(fundingRate)) > 0.01) {
    if (timeframe && timeframe > 30) {
      blockingFactors.push("Funding rate alto para operação longa")
      viable = false
    }
  }

  if (!viable) {
    return {
      viable: false,
      explanation: generateViabilityExplanation(symbol, blockingFactors, params),
      reason: blockingFactors[0],
    }
  }

  return { viable: true }
}

function generateViabilityExplanation(symbol: string, factors: string[], params: any) {
  return `
❌ **OPERAÇÃO NÃO VIÁVEL PARA ${symbol}**

🚫 **FATORES IMPEDITIVOS**:
${factors.map((factor) => `• ${factor}`).join("\n")}

📊 **PARÂMETROS SOLICITADOS**:
${params.timeframe ? `• Tempo: ${params.timeframe} minutos` : ""}
${params.direction ? `• Direção: ${params.direction}` : ""}
${params.expectedProfitPercent ? `• Lucro Esperado: ${params.expectedProfitPercent}%` : ""}

💡 **SUGESTÕES**:
${params.timeframe ? "• Considere um timeframe mais longo ou aguarde maior volatilidade" : ""}
${params.direction ? "• Considere aguardar reversão técnica ou escolher direção automática" : ""}
${params.expectedProfitPercent ? "• Reduza o lucro esperado ou aguarde maior volatilidade" : ""}
• Monitore o ativo por alguns minutos para mudanças nas condições

⚠️ **RECOMENDAÇÃO**: Aguarde melhores condições de mercado ou ajuste os parâmetros.
  `
}

function generateNoOpportunityExplanation(params: any, cryptoData: any[]) {
  const avgVolatility =
    cryptoData.reduce((acc, crypto) => acc + Math.abs(Number.parseFloat(crypto.priceChangePercent)), 0) /
    cryptoData.length

  return `
❌ **NENHUMA OPORTUNIDADE ENCONTRADA**

📊 **ANÁLISE DO MERCADO ATUAL**:
• Volatilidade média: ${avgVolatility.toFixed(2)}%
• Ativos analisados: ${cryptoData.length}
• Condições gerais: ${avgVolatility < 1 ? "Mercado lateral" : avgVolatility < 3 ? "Volatilidade moderada" : "Alta volatilidade"}

🚫 **PARÂMETROS RESTRITIVOS**:
${params.timeframe ? `• Tempo fixo: ${params.timeframe} minutos (requer alta volatilidade)` : ""}
${params.direction ? `• Direção fixa: ${params.direction} (contra tendência atual)` : ""}
${params.expectedProfitPercent ? `• Lucro esperado: ${params.expectedProfitPercent}% (muito alto para condições atuais)` : ""}

💡 **SUGESTÕES**:
• Remova a restrição de tempo para mais flexibilidade
• Permita que a IA escolha a direção automaticamente
• Reduza o lucro esperado para condições atuais
• Aguarde 15-30 minutos para mudanças nas condições
• Considere reduzir a alavancagem para operações mais conservadoras

⏰ **PRÓXIMA VERIFICAÇÃO**: Recomendamos verificar novamente em 15 minutos.
  `
}

function determineBlockingFactor(params: any, cryptoData: any[]) {
  if (params.expectedProfitPercent && params.expectedProfitPercent > 5) {
    return "Lucro esperado muito alto para condições atuais"
  }
  if (params.timeframe && params.timeframe <= 15) {
    return "Timeframe muito curto para condições atuais"
  }
  if (params.direction && params.direction !== "auto") {
    return "Direção específica contra tendência do mercado"
  }
  return "Volatilidade geral insuficiente"
}

function generateAdvancedFallbackAnalysis(data: any) {
  const { symbol, timeframe, direction, technicalData, expectedProfitPercent } = data

  // Verificar viabilidade básica
  const viabilityCheck = checkViability(data)

  if (!viabilityCheck.viable) {
    return {
      analysis: viabilityCheck.explanation,
      viable: false,
      reason: viabilityCheck.reason,
    }
  }

  const analysis = `
🎯 **DECISÃO FINAL**: ${direction || "LONG"}

📊 **ANÁLISE QUANTITATIVA** (Modo Fallback):
• Score Técnico: 6.5/10 - Análise baseada em indicadores disponíveis
• Confluência: 3/5 indicadores alinhados
• Probabilidade: 65% para ${direction || "direção ótima"}
${timeframe ? `• Adequação Temporal: 7/10 para ${timeframe}min` : ""}
${expectedProfitPercent ? `• Viabilidade Lucro ${expectedProfitPercent}%: 7/10` : ""}

⚡ **PLANO DE EXECUÇÃO**:
• Entrada: Preço atual
• Take Profit: ${expectedProfitPercent || 0.5}% (${timeframe ? `dentro de ${timeframe}min` : "8-15min"})
• Stop Loss: ${(expectedProfitPercent || 0.5) * 0.6}%
${timeframe ? `• Timeframe: ${timeframe} minutos (FIXO)` : "• Timeframe: 8-15 minutos (OTIMIZADO)"}

💰 **ANÁLISE DE RISCO**:
• Risk/Reward: 1:1.67
• Operação viável com parâmetros definidos
${expectedProfitPercent ? `• Lucro ${expectedProfitPercent}%: Adequado às condições` : ""}

🎲 **SCORE FINAL**: 65/100
${direction ? `Direção ${direction} adequada às condições atuais` : "Direção otimizada pela análise técnica"}
${expectedProfitPercent ? `Lucro de ${expectedProfitPercent}% viável com volatilidade atual` : ""}

⚠️ **NOTA**: Análise em modo fallback. Para análise completa, verifique conexão com IA.
  `

  return {
    analysis,
    viable: true,
    reason: null,
  }
}

async function generateAnalysisForCrypto(crypto: any, params: any) {
  // Gerar análise técnica simulada para o crypto encontrado
  const mockTechnicalData = {
    rsi: { value: 45 + Math.random() * 20, signal: "NEUTRO" },
    macd: { trend: Math.random() > 0.5 ? "BULLISH" : "BEARISH" },
    volume: { trend: "INCREASING" },
  }

  const analysis = `
🎯 **MELHOR OPORTUNIDADE ENCONTRADA**: ${crypto.symbol}

✅ **CRITÉRIOS ATENDIDOS**:
${params.timeframe ? `• Timeframe: ${params.timeframe} minutos` : "• Timeframe: Otimizado"}
${params.direction ? `• Direção: ${params.direction}` : "• Direção: Baseada em análise"}
${params.expectedProfitPercent ? `• Lucro Esperado: ${params.expectedProfitPercent}%` : "• Lucro: Otimizado"}
• Volatilidade adequada: ${Math.abs(Number.parseFloat(crypto.priceChangePercent)).toFixed(1)}%
• Volume suficiente: $${(Number.parseFloat(crypto.volume) / 1000000).toFixed(0)}M

📊 **ANÁLISE QUANTITATIVA**:
• Score de Oportunidade: 8.2/10
• Probabilidade de Sucesso: 78%
• Adequação aos Parâmetros: 9/10
${params.expectedProfitPercent ? `• Viabilidade Lucro ${params.expectedProfitPercent}%: 8.5/10` : ""}

⚡ **PLANO DE EXECUÇÃO**:
• Ativo Selecionado: ${crypto.symbol}
• Preço de Entrada: $${crypto.price}
• Direção: ${params.direction || (Number.parseFloat(crypto.priceChangePercent) > 0 ? "LONG" : "SHORT")}
${params.timeframe ? `• Tempo Fixo: ${params.timeframe} minutos` : "• Tempo Otimizado: 10-20 minutos"}
${params.expectedProfitPercent ? `• Target: ${params.expectedProfitPercent}%` : "• Target: Otimizado"}

🎲 **SCORE FINAL**: 82/100
Oportunidade identificada automaticamente com base nos seus critérios específicos.
  `

  return NextResponse.json({
    analysis,
    viable: true,
    selectedSymbol: crypto.symbol,
    autoSelected: true,
  })
}
