import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔄 Iniciando busca na Binance Spot API...")

    // Tentar buscar dados reais da Binance
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; TradingBot/1.0)",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Binance API retornou status ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Dados recebidos da Binance:", data.length, "símbolos")

      // Filtrar apenas os principais pares USDT
      const mainPairs = [
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "ADAUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "DOTUSDT",
        "DOGEUSDT",
        "AVAXUSDT",
        "MATICUSDT",
        "LINKUSDT",
        "LTCUSDT",
        "UNIUSDT",
        "ATOMUSDT",
        "FILUSDT",
      ]

      const filteredData = data
        .filter((item: any) => mainPairs.includes(item.symbol))
        .map((item: any) => ({
          symbol: item.symbol,
          price: Number.parseFloat(item.lastPrice).toFixed(item.symbol === "BTCUSDT" ? 0 : 4),
          priceChangePercent: Number.parseFloat(item.priceChangePercent).toFixed(2),
          volume: Number.parseFloat(item.volume).toFixed(0),
          source: "Binance Spot",
        }))

      console.log("✅ Binance Spot API funcionou:", filteredData.length, "símbolos filtrados")
      return NextResponse.json(filteredData)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log("⚠️ Binance API indisponível, usando fallback...")
      throw fetchError
    }
  } catch (error) {
    console.log("🔄 Usando dados simulados realistas...")

    // Fallback com dados simulados realistas
    const fallbackData = [
      {
        symbol: "BTCUSDT",
        price: "104765.00",
        priceChangePercent: (Math.random() * 4 - 2).toFixed(2),
        volume: "28547",
        source: "Binance Spot (Simulado)",
      },
      {
        symbol: "ETHUSDT",
        price: "3890.45",
        priceChangePercent: (Math.random() * 6 - 3).toFixed(2),
        volume: "156789",
        source: "Binance Spot (Simulado)",
      },
      {
        symbol: "BNBUSDT",
        price: "692.30",
        priceChangePercent: (Math.random() * 5 - 2.5).toFixed(2),
        volume: "45123",
        source: "Binance Spot (Simulado)",
      },
      {
        symbol: "SOLUSDT",
        price: "258.67",
        priceChangePercent: (Math.random() * 8 - 4).toFixed(2),
        volume: "89456",
        source: "Binance Spot (Simulado)",
      },
      {
        symbol: "XRPUSDT",
        price: "3.12",
        priceChangePercent: (Math.random() * 6 - 3).toFixed(2),
        volume: "234567",
        source: "Binance Spot (Simulado)",
      },
    ]

    console.log("✅ Retornando dados simulados:", fallbackData.length, "símbolos")
    return NextResponse.json(fallbackData)
  }
}
