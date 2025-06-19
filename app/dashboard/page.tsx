"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, Target, Zap, TrendingUp, RefreshCw } from "lucide-react"
import { useTradingData } from "@/hooks/useTradingData"
import RealTimeMonitor from "@/components/real-time-monitor"

interface CryptoData {
  symbol: string
  price: string
  priceChangePercent: string
  volume: string
  openInterest?: string
  fundingRate?: string
  source?: string
  technicals?: any
  tradingview?: any
}

export default function DashboardPage() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [currentAPI, setCurrentAPI] = useState("tradingview")

  const { operations, stats, completeOperation, stopOperation, getActiveOperations } = useTradingData()

  // Detectar mudança de API do localStorage ou context
  useEffect(() => {
    const detectAPIChange = () => {
      // Aqui você pode implementar lógica para detectar mudança de API
      // Por enquanto, vamos usar um valor padrão
      setCurrentAPI("tradingview")
    }

    detectAPIChange()
  }, [])

  // Buscar dados da API selecionada
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true)
        console.log(`🔄 Buscando dados da API: ${currentAPI}`)

        const response = await fetch(`/api/${currentAPI}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        console.log(`✅ ${currentAPI} funcionou:`, data.length, "símbolos", `BTC: $${data[0]?.price}`)

        setCryptoData(data)
        setLastUpdate(new Date())
      } catch (error) {
        console.error(`❌ ${currentAPI} falhou:`, error)

        // Tentar fallback
        if (currentAPI !== "tradingview") {
          console.log("🔄 Tentando fallback para TradingView...")
          try {
            const fallbackResponse = await fetch("/api/tradingview")
            const fallbackData = await fallbackResponse.json()
            setCryptoData(fallbackData)
            setLastUpdate(new Date())
          } catch (fallbackError) {
            console.error("❌ Fallback também falhou:", fallbackError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()

    // Atualizar a cada 15 segundos
    const interval = setInterval(fetchCryptoData, 15000)
    return () => clearInterval(interval)
  }, [currentAPI])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Zap className="text-yellow-400" />
            Dashboard - Crypto Scalping AI
          </h1>
          <p className="text-slate-300">Monitoramento em tempo real com dados atualizados</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant="outline" className="text-xs">
              {cryptoData[0]?.source || "Multi-Source"} Ativa
            </Badge>
            <span className="text-xs text-slate-400">Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Capital Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.totalCapital.toFixed(2)}</div>
              <p className="text-xs text-green-400">+{stats.todayProfit.toFixed(2)} hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Operações Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.todayOperations}</div>
              <p className="text-xs text-green-400">
                {stats.longOperations} LONG, {stats.shortOperations} SHORT
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-400">Com IA otimizada</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{Math.round(stats.averageDuration)}min</div>
              <p className="text-xs text-slate-400">Por operação</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Operations Monitor */}
        {getActiveOperations().length > 0 && (
          <div className="mb-6">
            <RealTimeMonitor
              activeOperations={getActiveOperations()}
              cryptoData={cryptoData}
              onCompleteOperation={completeOperation}
              onStopOperation={stopOperation}
            />
          </div>
        )}

        {/* Market Data */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Mercado de Futuros - {cryptoData[0]?.source || "Multi-Source"}
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Dados em tempo real com análise de volatilidade para scalping
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                <span className="ml-2 text-slate-400">Carregando dados de mercado...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {cryptoData.map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-white text-lg">{crypto.symbol}</div>
                      <Badge variant={Number.parseFloat(crypto.priceChangePercent) > 0 ? "default" : "destructive"}>
                        {Number.parseFloat(crypto.priceChangePercent) > 0 ? "+" : ""}
                        {crypto.priceChangePercent}%
                      </Badge>

                      {/* TradingView Signals */}
                      {crypto.tradingview?.recommendation && (
                        <Badge
                          variant={
                            crypto.tradingview.recommendation === "BUY"
                              ? "default"
                              : crypto.tradingview.recommendation === "SELL"
                                ? "destructive"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {crypto.source?.includes("TradingView") ? "TV" : "Signal"}:{" "}
                          {crypto.tradingview.recommendation}
                        </Badge>
                      )}

                      {/* Technical Indicators */}
                      {crypto.technicals?.rsiSignal && (
                        <Badge
                          variant={
                            crypto.technicals.rsiSignal === "OVERSOLD"
                              ? "default"
                              : crypto.technicals.rsiSignal === "OVERBOUGHT"
                                ? "destructive"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          RSI: {crypto.technicals.rsiSignal}
                        </Badge>
                      )}

                      {Math.abs(Number.parseFloat(crypto.priceChangePercent)) > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Alta Volatilidade
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-white text-lg">${crypto.price}</div>
                      <div className="text-xs text-slate-400 space-x-2">
                        <span>Vol: ${(Number.parseFloat(crypto.volume) / 1000000).toFixed(1)}M</span>
                        {crypto.openInterest && (
                          <span>OI: ${(Number.parseFloat(crypto.openInterest) / 1000000).toFixed(0)}M</span>
                        )}
                        {crypto.technicals?.rsi && <span>RSI: {crypto.technicals.rsi}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
