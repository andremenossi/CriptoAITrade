import { NextResponse } from "next/server"

// Simulação de dados técnicos (em produção, usar APIs como TradingView ou calcular)
export async function POST(request: Request) {
  try {
    const { symbol } = await request.json()

    // Simular indicadores técnicos baseados no símbolo
    const technicalData = generateTechnicalIndicators(symbol)

    return NextResponse.json(technicalData)
  } catch (error) {
    console.error("Erro na análise técnica:", error)
    return NextResponse.json({ error: "Erro ao gerar análise técnica" }, { status: 500 })
  }
}

function generateTechnicalIndicators(symbol: string) {
  // Gerar dados realistas baseados no símbolo
  const baseVolatility = symbol.includes("BTC") ? 0.8 : symbol.includes("ETH") ? 1.2 : 1.5

  return {
    rsi: {
      value: 45 + Math.random() * 20, // RSI entre 45-65
      signal: "NEUTRO",
      description: "RSI indica momentum neutro",
    },
    macd: {
      macd: (Math.random() - 0.5) * baseVolatility,
      signal: (Math.random() - 0.5) * baseVolatility * 0.8,
      histogram: (Math.random() - 0.5) * baseVolatility * 0.3,
      trend: Math.random() > 0.5 ? "BULLISH" : "BEARISH",
    },
    bollinger: {
      upper: 1.02 + Math.random() * 0.01,
      middle: 1.0,
      lower: 0.98 - Math.random() * 0.01,
      position: Math.random() > 0.5 ? "UPPER" : "LOWER",
    },
    ema: {
      ema20: 1.0 + (Math.random() - 0.5) * 0.02,
      ema50: 1.0 + (Math.random() - 0.5) * 0.015,
      trend: Math.random() > 0.5 ? "UP" : "DOWN",
    },
    volume: {
      current: Math.random() * 2,
      average: 1.0,
      trend: Math.random() > 0.5 ? "INCREASING" : "DECREASING",
    },
    support_resistance: {
      support: 0.995 - Math.random() * 0.01,
      resistance: 1.005 + Math.random() * 0.01,
      strength: Math.random() * 100,
    },
  }
}
