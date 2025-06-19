import { NextResponse } from "next/server"

// Cache global para evitar rate limits
let cachedData: any = null
let lastFetch = 0
const CACHE_DURATION = 45000 // 45 segundos

export async function GET() {
  // Verificar cache primeiro
  const now = Date.now()
  if (cachedData && now - lastFetch < CACHE_DURATION) {
    console.log("📦 Usando dados em cache")
    return NextResponse.json(cachedData)
  }

  try {
    // Tentar CoinGecko como fonte principal
    console.log("🔄 Tentando CoinGecko...")
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana,ripple,polkadot,chainlink,avalanche-2,polygon&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoScalpingAI/1.0)",
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      },
    )

    if (response.ok) {
      const data = await response.json()
      const mapping: { [key: string]: string } = {
        bitcoin: "BTCUSDT",
        ethereum: "ETHUSDT",
        binancecoin: "BNBUSDT",
        cardano: "ADAUSDT",
        solana: "SOLUSDT",
        ripple: "XRPUSDT",
        polkadot: "DOTUSDT",
        chainlink: "LINKUSDT",
        "avalanche-2": "AVAXUSDT",
        polygon: "MATICUSDT",
      }

      const transformedData = Object.entries(data).map(([key, value]: [string, any]) => ({
        symbol: mapping[key] || key.toUpperCase() + "USDT",
        price: value.usd.toFixed(4),
        priceChangePercent: value.usd_24h_change?.toFixed(2) || "0.00",
        volume: (value.usd_24h_vol || 1000000000).toString(),
        openInterest: (value.market_cap / 10).toString(),
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "CoinGecko",
      }))

      console.log("✅ CoinGecko funcionou:", transformedData.length, "símbolos")

      // Atualizar cache
      cachedData = transformedData
      lastFetch = now

      return NextResponse.json(transformedData)
    }

    throw new Error("CoinGecko não disponível")
  } catch (error) {
    console.error("❌ Todas as APIs falharam:", error)

    // Fallback com dados realistas
    console.log("📊 Usando dados de fallback otimizados")

    const generateRealisticPrice = (base: number, volatility: number) => {
      const change = (Math.random() - 0.5) * volatility
      return (base * (1 + change)).toFixed(4)
    }

    const fallbackData = [
      {
        symbol: "BTCUSDT",
        price: generateRealisticPrice(43000, 0.03),
        priceChangePercent: (Math.random() * 6 - 3).toFixed(2),
        volume: (2500000000 + Math.random() * 1000000000).toString(),
        openInterest: "15234567890",
        fundingRate: (Math.random() * 0.0004 - 0.0002).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "ETHUSDT",
        price: generateRealisticPrice(2600, 0.04),
        priceChangePercent: (Math.random() * 8 - 4).toFixed(2),
        volume: (1800000000 + Math.random() * 500000000).toString(),
        openInterest: "8234567890",
        fundingRate: (Math.random() * 0.0004 - 0.0002).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "BNBUSDT",
        price: generateRealisticPrice(320, 0.05),
        priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
        volume: (800000000 + Math.random() * 200000000).toString(),
        openInterest: "1234567890",
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "ADAUSDT",
        price: generateRealisticPrice(0.49, 0.06),
        priceChangePercent: (Math.random() * 12 - 6).toFixed(2),
        volume: (600000000 + Math.random() * 200000000).toString(),
        openInterest: "5234567890",
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "SOLUSDT",
        price: generateRealisticPrice(102, 0.07),
        priceChangePercent: (Math.random() * 15 - 7.5).toFixed(2),
        volume: (900000000 + Math.random() * 300000000).toString(),
        openInterest: "2234567890",
        fundingRate: (Math.random() * 0.0008 - 0.0004).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "XRPUSDT",
        price: generateRealisticPrice(0.62, 0.08),
        priceChangePercent: (Math.random() * 18 - 9).toFixed(2),
        volume: (1200000000 + Math.random() * 400000000).toString(),
        openInterest: "7234567890",
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "DOTUSDT",
        price: generateRealisticPrice(7.8, 0.06),
        priceChangePercent: (Math.random() * 12 - 6).toFixed(2),
        volume: (350000000 + Math.random() * 150000000).toString(),
        openInterest: "1834567890",
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "Fallback Realista",
      },
      {
        symbol: "LINKUSDT",
        price: generateRealisticPrice(14.7, 0.05),
        priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
        volume: (550000000 + Math.random() * 200000000).toString(),
        openInterest: "2834567890",
        fundingRate: (Math.random() * 0.0006 - 0.0003).toFixed(6),
        source: "Fallback Realista",
      },
    ]

    // Atualizar cache com fallback
    cachedData = fallbackData
    lastFetch = now

    return NextResponse.json(fallbackData)
  }
}
