import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana,ripple,polkadot,chainlink,avalanche-2,polygon&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoScalpingAI/1.0)",
          Accept: "application/json",
        },
        next: { revalidate: 45 },
      },
    )

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP error! status: ${response.status}`)
    }

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

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("CoinGecko API falhou:", error)
    return NextResponse.json({ error: "CoinGecko não disponível" }, { status: 500 })
  }
}
