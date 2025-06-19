"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Calculator, Brain, DollarSign, Clock, Target, Zap, TrendingDown, RefreshCw } from "lucide-react"
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
}

interface ScalpingPlan {
  symbol: string
  direction: "LONG" | "SHORT"
  entryPrice: number
  exitPrice: number
  stopLoss: number
  leverage: number
  investment: number
  expectedProfit: number
  riskReward: number
  duration: string
  successRate: number
  fees: number
  netProfit: number
  fundingCost: number
}

export default function CryptoScalpingAI() {
  const router = useRouter()
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [selectedCrypto, setSelectedCrypto] = useState("")
  const [investment, setInvestment] = useState(100)
  const [leverage, setLeverage] = useState(10)
  const [riskTolerance, setRiskTolerance] = useState("medium")
  const [scalpingPlan, setScalpingPlan] = useState<ScalpingPlan | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState("")
  const [technicalData, setTechnicalData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedAPI, setSelectedAPI] = useState("binance")
  const [timeframe, setTimeframe] = useState("")
  const [operationDirection, setOperationDirection] = useState("")
  const [expectedProfitPercent, setExpectedProfitPercent] = useState("")

  const {
    operations,
    stats,
    settings,
    addOperation,
    startOperation,
    completeOperation,
    stopOperation,
    updateSettings,
    getActiveOperations,
    getPlannedOperations,
  } = useTradingData()

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true)
        console.log(`🔄 Buscando dados da API: ${selectedAPI}`)

        const response = await fetch(`/api/${selectedAPI}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        console.log(`✅ ${selectedAPI} funcionou:`, data.length, "símbolos")

        setCryptoData(data)
        setLastUpdate(new Date())
      } catch (error) {
        console.error(`❌ ${selectedAPI} falhou:`, error)

        if (selectedAPI !== "binance") {
          console.log("🔄 Tentando fallback para Multi-Source...")
          try {
            const fallbackResponse = await fetch("/api/binance")
            const fallbackData = await fallbackResponse.json()
            setCryptoData(fallbackData)
          } catch (fallbackError) {
            console.error("❌ Fallback também falhou:", fallbackError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()

    const interval = setInterval(fetchCryptoData, 60000)
    return () => clearInterval(interval)
  }, [selectedAPI])

  useEffect(() => {
    // Redirecionar automaticamente para o dashboard
    router.replace("/dashboard")
  }, [router])

  const calculateScalpingPlan = async () => {
    setIsAnalyzing(true)

    try {
      let crypto = null
      const selectedSymbol = selectedCrypto

      if (selectedCrypto && selectedCrypto !== "auto") {
        crypto = cryptoData.find((c) => c.symbol === selectedCrypto)
        if (!crypto) {
          setAiRecommendation("Ativo selecionado não encontrado.")
          return
        }
      }

      let techData = null
      if (crypto) {
        const techResponse = await fetch("/api/technical-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: selectedSymbol }),
        })
        techData = await techResponse.json()
        setTechnicalData(techData)
      }

      const aiResponse = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol && selectedSymbol !== "auto" ? selectedSymbol : null,
          price: crypto?.price,
          priceChange: crypto?.priceChangePercent,
          volume: crypto?.volume,
          investment,
          leverage,
          technicalData: techData,
          openInterest: crypto?.openInterest,
          fundingRate: crypto?.fundingRate,
          timeframe: timeframe && timeframe !== "auto" ? Number.parseInt(timeframe) : null,
          direction: operationDirection && operationDirection !== "auto" ? operationDirection : null,
          allCryptoData: !selectedCrypto || selectedCrypto === "auto" ? cryptoData : null,
          expectedProfitPercent: expectedProfitPercent ? Number.parseFloat(expectedProfitPercent) : null,
        }),
      })

      const aiData = await aiResponse.json()
      setAiRecommendation(aiData.analysis)

      if (!aiData.viable) {
        setScalpingPlan(null)
        return
      }

      if (aiData.autoSelected && aiData.selectedSymbol) {
        setSelectedCrypto(aiData.selectedSymbol)
        crypto = cryptoData.find((c) => c.symbol === aiData.selectedSymbol)
      }

      if (crypto) {
        const currentPrice = Number.parseFloat(crypto.price)
        const priceChange = Number.parseFloat(crypto.priceChangePercent)
        const fundingRate = Number.parseFloat(crypto.fundingRate || "0")

        const direction = determineDirection(techData, priceChange)

        const riskMultiplier = riskTolerance === "low" ? 0.5 : riskTolerance === "medium" ? 1 : 1.5
        const targetProfitPercent = expectedProfitPercent
          ? Number.parseFloat(expectedProfitPercent)
          : 0.3 + riskMultiplier * 0.2
        const stopLossPercent = targetProfitPercent * 0.6

        const entryPrice = currentPrice
        const exitPrice =
          direction === "LONG"
            ? entryPrice * (1 + targetProfitPercent / 100)
            : entryPrice * (1 - targetProfitPercent / 100)

        const stopLoss =
          direction === "LONG" ? entryPrice * (1 - stopLossPercent / 100) : entryPrice * (1 + stopLossPercent / 100)

        const tradingFee = 0.0004
        const totalFees = investment * leverage * tradingFee * 2

        const fundingCost = Math.abs(fundingRate) * investment * leverage * 0.33 // ~8h

        const grossProfit = (investment * leverage * targetProfitPercent) / 100
        const netProfit = grossProfit - totalFees - fundingCost

        const volatility = Math.abs(priceChange)
        const estimatedDuration = getEstimatedDuration(volatility, techData)

        const successRate = calculateSuccessRate(techData, volatility, riskMultiplier)

        const plan: ScalpingPlan = {
          symbol: crypto.symbol,
          direction,
          entryPrice,
          exitPrice,
          stopLoss,
          leverage,
          investment,
          expectedProfit: grossProfit,
          riskReward: targetProfitPercent / stopLossPercent,
          duration: estimatedDuration,
          successRate,
          fees: totalFees,
          netProfit,
          fundingCost,
        }

        setScalpingPlan(plan)
      }
    } catch (error) {
      console.error("Erro na análise:", error)
      setAiRecommendation("Erro ao gerar análise. Tente novamente.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const determineDirection = (techData: any, priceChange: number) => {
    let bullishSignals = 0
    let bearishSignals = 0

    if (techData?.rsi?.value < 30) bullishSignals++
    if (techData?.rsi?.value > 70) bearishSignals++

    if (techData?.macd?.trend === "BULLISH") bullishSignals++
    if (techData?.macd?.trend === "BEARISH") bearishSignals++

    if (techData?.ema?.trend === "UP") bullishSignals++
    if (techData?.ema?.trend === "DOWN") bearishSignals++

    if (priceChange > 1) bullishSignals++
    if (priceChange < -1) bearishSignals++

    return bullishSignals > bearishSignals ? "LONG" : "SHORT"
  }

  const getEstimatedDuration = (volatility: number, techData: any) => {
    if (volatility > 3 || techData?.volume?.trend === "INCREASING") return "3-8 min"
    if (volatility > 1.5) return "8-15 min"
    return "15-30 min"
  }

  const calculateSuccessRate = (techData: any, volatility: number, riskMultiplier: number) => {
    let baseRate = 55

    if (techData?.macd?.trend === techData?.ema?.trend) baseRate += 10
    if (techData?.volume?.trend === "INCREASING") baseRate += 8
    if (volatility > 2) baseRate += 5

    baseRate += riskMultiplier * 5

    return Math.min(85, Math.max(45, baseRate))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Zap className="text-yellow-400" />
            Crypto Futures Scalping AI
          </h1>
          <p className="text-slate-300">Análise técnica avançada com IA otimizada para scalping</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant="outline" className="text-xs">
              Multi-Source API Ativa
            </Badge>
            <span className="text-xs text-slate-400">Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="dashboard" className="text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="planner" className="text-white">
              Planejador IA
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-white">
              Análise Técnica
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-white">
              Calculadora
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Contratos de Futuros - {cryptoData[0]?.source || "Multi-Source"}
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
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-white">{crypto.symbol}</div>
                          <Badge variant={Number.parseFloat(crypto.priceChangePercent) > 0 ? "default" : "destructive"}>
                            {Number.parseFloat(crypto.priceChangePercent) > 0 ? "+" : ""}
                            {crypto.priceChangePercent}%
                          </Badge>
                          {crypto.fundingRate && (
                            <Badge variant="outline" className="text-xs">
                              FR: {(Number.parseFloat(crypto.fundingRate) * 100).toFixed(4)}%
                            </Badge>
                          )}
                          {Math.abs(Number.parseFloat(crypto.priceChangePercent)) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              Alta Volatilidade
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${crypto.price}</div>
                          <div className="text-xs text-slate-400">
                            Vol: ${(Number.parseFloat(crypto.volume) / 1000000).toFixed(1)}M
                            {crypto.openInterest && (
                              <span className="ml-2">
                                OI: ${(Number.parseFloat(crypto.openInterest) / 1000000).toFixed(0)}M
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planner" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Configuração da Estratégia IA
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    IA otimizada com análise quantitativa avançada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Valor do Investimento ($)</Label>
                    <Input
                      type="number"
                      value={investment}
                      onChange={(e) => setInvestment(Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Alavancagem (x)</Label>
                    <Select value={leverage.toString()} onValueChange={(value) => setLeverage(Number(value))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="5" className="text-white">
                          5x
                        </SelectItem>
                        <SelectItem value="10" className="text-white">
                          10x
                        </SelectItem>
                        <SelectItem value="20" className="text-white">
                          20x
                        </SelectItem>
                        <SelectItem value="50" className="text-white">
                          50x
                        </SelectItem>
                        <SelectItem value="100" className="text-white">
                          100x
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Perfil de Risco</Label>
                    <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="low" className="text-white">
                          Conservador (0.3-0.5%)
                        </SelectItem>
                        <SelectItem value="medium" className="text-white">
                          Moderado (0.5-0.7%)
                        </SelectItem>
                        <SelectItem value="high" className="text-white">
                          Agressivo (0.7-0.9%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Lucro Esperado (%) - Opcional</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 2.5 para 2.5%"
                      value={expectedProfitPercent}
                      onChange={(e) => setExpectedProfitPercent(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {expectedProfitPercent
                        ? `Target fixo de ${expectedProfitPercent}% - IA avalia viabilidade`
                        : "IA otimiza o lucro baseado no risco e volatilidade"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Tempo de Operação (Opcional)</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="IA escolhe o melhor tempo" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="auto" className="text-white">
                          🤖 IA Otimizada (Recomendado)
                        </SelectItem>
                        <SelectItem value="5" className="text-white">
                          ⚡ 5 minutos (Ultra rápido)
                        </SelectItem>
                        <SelectItem value="10" className="text-white">
                          🚀 10 minutos (Rápido)
                        </SelectItem>
                        <SelectItem value="15" className="text-white">
                          ⏱️ 15 minutos (Padrão)
                        </SelectItem>
                        <SelectItem value="30" className="text-white">
                          🕐 30 minutos (Conservador)
                        </SelectItem>
                        <SelectItem value="60" className="text-white">
                          ⏰ 60 minutos (Longo prazo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      {timeframe && timeframe !== "auto"
                        ? `Operação fixa de ${timeframe} minutos`
                        : "IA escolhe o tempo ideal baseado na volatilidade"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Direção da Operação (Opcional)</Label>
                    <Select value={operationDirection} onValueChange={setOperationDirection}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="IA analisa a melhor direção" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="auto" className="text-white">
                          🤖 IA Decide (Recomendado)
                        </SelectItem>
                        <SelectItem value="LONG" className="text-white">
                          📈 LONG (Compra)
                        </SelectItem>
                        <SelectItem value="SHORT" className="text-white">
                          📉 SHORT (Venda)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      {operationDirection && operationDirection !== "auto"
                        ? `Forçar direção ${operationDirection}`
                        : "IA escolhe baseado em análise técnica"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Seleção de Ativo (Opcional)</Label>
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="IA encontra a melhor oportunidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="auto" className="text-white">
                          🎯 IA Busca Melhor Oportunidade
                        </SelectItem>
                        {cryptoData.map((crypto) => (
                          <SelectItem key={crypto.symbol} value={crypto.symbol} className="text-white">
                            {crypto.symbol} - ${crypto.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCrypto && selectedCrypto !== "auto"
                        ? `Análise específica para ${selectedCrypto}`
                        : "IA busca automaticamente a melhor oportunidade"}
                    </p>
                  </div>

                  <Button
                    onClick={calculateScalpingPlan}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analisando com IA...
                      </div>
                    ) : (
                      "🧠 Gerar Análise Completa com IA"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {scalpingPlan && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {scalpingPlan.direction === "LONG" ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      Plano de Operação - {scalpingPlan.direction}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {scalpingPlan.symbol} - Alavancagem {scalpingPlan.leverage}x | Fonte:{" "}
                      {cryptoData.find((c) => c.symbol === scalpingPlan.symbol)?.source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700 p-3 rounded">
                        <div className="text-xs text-slate-400">Entrada</div>
                        <div className="font-semibold text-white">${scalpingPlan.entryPrice.toFixed(4)}</div>
                      </div>
                      <div className="bg-slate-700 p-3 rounded">
                        <div className="text-xs text-slate-400">Take Profit</div>
                        <div className="font-semibold text-green-400">${scalpingPlan.exitPrice.toFixed(4)}</div>
                      </div>
                      <div className="bg-slate-700 p-3 rounded">
                        <div className="text-xs text-slate-400">Stop Loss</div>
                        <div className="font-semibold text-red-400">${scalpingPlan.stopLoss.toFixed(4)}</div>
                      </div>
                      <div className="bg-slate-700 p-3 rounded">
                        <div className="text-xs text-slate-400">Duração Estimada</div>
                        <div className="font-semibold text-white">{scalpingPlan.duration}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lucro Bruto:</span>
                        <span className="text-green-400">${scalpingPlan.expectedProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxas Trading:</span>
                        <span className="text-red-400">-${scalpingPlan.fees.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Custo Funding:</span>
                        <span className="text-red-400">-${scalpingPlan.fundingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-slate-600 pt-2">
                        <span className="text-white">Lucro Líquido:</span>
                        <span className="text-green-400">${scalpingPlan.netProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Probabilidade IA:</span>
                        <span className="text-white">{scalpingPlan.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk/Reward:</span>
                        <span className="text-white">1:{scalpingPlan.riskReward.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          const operationId = addOperation({
                            symbol: scalpingPlan.symbol,
                            direction: scalpingPlan.direction,
                            entryPrice: scalpingPlan.entryPrice,
                            exitPrice: scalpingPlan.exitPrice,
                            stopLoss: scalpingPlan.stopLoss,
                            leverage: scalpingPlan.leverage,
                            investment: scalpingPlan.investment,
                            plannedProfit: scalpingPlan.expectedProfit,
                            fees: scalpingPlan.fees,
                            fundingCost: scalpingPlan.fundingCost,
                            duration: scalpingPlan.duration,
                            successRate: scalpingPlan.successRate,
                            aiRecommendation: aiRecommendation,
                          })
                          startOperation(operationId)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🚀 Iniciar Operação
                      </Button>
                      <Button variant="outline">📋 Salvar Plano</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {getActiveOperations().length > 0 && (
              <RealTimeMonitor
                activeOperations={getActiveOperations()}
                cryptoData={cryptoData}
                onCompleteOperation={completeOperation}
                onStopOperation={stopOperation}
              />
            )}

            {aiRecommendation && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Análise Quantitativa Completa da IA
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Análise detalhada com justificativas baseadas em dados técnicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">{aiRecommendation}</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            {technicalData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">RSI (14)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{technicalData.rsi?.value?.toFixed(1)}</div>
                    <p className="text-xs text-slate-400">{technicalData.rsi?.signal}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          technicalData.rsi?.value < 30
                            ? "bg-green-500"
                            : technicalData.rsi?.value > 70
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                        style={{ width: `${technicalData.rsi?.value}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">MACD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white space-y-1">
                      <div>MACD: {technicalData.macd?.macd?.toFixed(6)}</div>
                      <div>Signal: {technicalData.macd?.signal?.toFixed(6)}</div>
                      <div>Histogram: {technicalData.macd?.histogram?.toFixed(6)}</div>
                      <Badge
                        variant={technicalData.macd?.trend === "BULLISH" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {technicalData.macd?.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Bollinger Bands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white space-y-1">
                      <div>Upper: {technicalData.bollinger?.upper?.toFixed(6)}</div>
                      <div>Middle: {technicalData.bollinger?.middle?.toFixed(6)}</div>
                      <div>Lower: {technicalData.bollinger?.lower?.toFixed(6)}</div>
                      <Badge variant="outline" className="text-xs">
                        {technicalData.bollinger?.position}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">EMAs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white space-y-1">
                      <div>EMA20: {technicalData.ema?.ema20?.toFixed(6)}</div>
                      <div>EMA50: {technicalData.ema?.ema50?.toFixed(6)}</div>
                      <Badge
                        variant={technicalData.ema?.trend === "UP" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {technicalData.ema?.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Volume Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white space-y-1">
                      <div>Current/Avg: {technicalData.volume?.current?.toFixed(2)}x</div>
                      <Badge
                        variant={technicalData.volume?.trend === "INCREASING" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {technicalData.volume?.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Support & Resistance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white space-y-1">
                      <div>Support: ${technicalData.support_resistance?.support?.toFixed(6)}</div>
                      <div>Resistance: ${technicalData.support_resistance?.resistance?.toFixed(6)}</div>
                      <div className="text-xs text-slate-400">
                        Strength: {technicalData.support_resistance?.strength?.toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Calculadora Avançada de Futuros
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Calcule lucros, perdas, taxas, funding e liquidação para operações de futuros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-yellow-900/20 border-yellow-600">
                  <AlertDescription className="text-yellow-200">
                    ⚠️ Trading de futuros envolve alto risco de liquidação. Use sempre stop loss e gestão de risco
                    adequada. Nunca arrisque mais de 2% do seu capital por operação.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
