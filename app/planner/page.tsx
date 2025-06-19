"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { useTradingData } from "@/hooks/useTradingData"

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

export default function PlannerPage() {
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
  const [timeframe, setTimeframe] = useState("")
  const [operationDirection, setOperationDirection] = useState("")
  const [expectedProfitPercent, setExpectedProfitPercent] = useState("")

  const { addOperation, startOperation } = useTradingData()

  // Buscar dados da API TradingView
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/tradingview", { cache: "no-store" })
        const data = await response.json()
        setCryptoData(data)
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 30000)
    return () => clearInterval(interval)
  }, [])

  const calculateScalpingPlan = async () => {
    setIsAnalyzing(true)

    try {
      let crypto = null
      const selectedSymbol = selectedCrypto

      // Se selecionou um ativo específico
      if (selectedCrypto && selectedCrypto !== "auto") {
        crypto = cryptoData.find((c) => c.symbol === selectedCrypto)
        if (!crypto) {
          setAiRecommendation("Ativo selecionado não encontrado.")
          return
        }
      }

      // Usar dados técnicos do TradingView se disponível
      const techData = crypto?.technicals || null
      setTechnicalData(techData)

      // Análise de IA avançada
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

      // Se a IA não encontrou oportunidade viável
      if (!aiData.viable) {
        setScalpingPlan(null)
        return
      }

      // Se a IA selecionou automaticamente um ativo
      if (aiData.autoSelected && aiData.selectedSymbol) {
        setSelectedCrypto(aiData.selectedSymbol)
        crypto = cryptoData.find((c) => c.symbol === aiData.selectedSymbol)
      }

      // Gerar plano de scalping se tiver crypto
      if (crypto) {
        const currentPrice = Number.parseFloat(crypto.price)
        const priceChange = Number.parseFloat(crypto.priceChangePercent)
        const fundingRate = Number.parseFloat(crypto.fundingRate || "0")

        // Determinar direção baseada em indicadores técnicos
        const direction = determineDirection(techData, priceChange, crypto.tradingview)

        // Cálculos para futuros
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

        // Taxas para futuros (0.02% maker, 0.04% taker)
        const tradingFee = 0.0004
        const totalFees = investment * leverage * tradingFee * 2

        // Custo de funding (8h)
        const fundingCost = Math.abs(fundingRate) * investment * leverage * 0.33 // ~8h

        const grossProfit = (investment * leverage * targetProfitPercent) / 100
        const netProfit = grossProfit - totalFees - fundingCost

        // Duração baseada em volatilidade e indicadores
        const volatility = Math.abs(priceChange)
        const estimatedDuration = getEstimatedDuration(volatility, techData)

        // Taxa de sucesso baseada em confluência técnica
        const successRate = calculateSuccessRate(techData, volatility, riskMultiplier, crypto.tradingview)

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

  const determineDirection = (techData: any, priceChange: number, tradingview: any) => {
    let bullishSignals = 0
    let bearishSignals = 0

    // TradingView recommendation
    if (tradingview?.recommendation === "BUY") bullishSignals += 2
    if (tradingview?.recommendation === "SELL") bearishSignals += 2

    // RSI
    if (techData?.rsiSignal === "OVERSOLD") bullishSignals++
    if (techData?.rsiSignal === "OVERBOUGHT") bearishSignals++

    // MACD
    if (techData?.macd?.trend === "BULLISH") bullishSignals++
    if (techData?.macd?.trend === "BEARISH") bearishSignals++

    // EMA
    if (techData?.ema?.trend === "UPTREND") bullishSignals++
    if (techData?.ema?.trend === "DOWNTREND") bearishSignals++

    // Price momentum
    if (priceChange > 1) bullishSignals++
    if (priceChange < -1) bearishSignals++

    return bullishSignals > bearishSignals ? "LONG" : "SHORT"
  }

  const getEstimatedDuration = (volatility: number, techData: any) => {
    if (volatility > 3 || techData?.volume?.trend === "INCREASING") return "3-8 min"
    if (volatility > 1.5) return "8-15 min"
    return "15-30 min"
  }

  const calculateSuccessRate = (techData: any, volatility: number, riskMultiplier: number, tradingview: any) => {
    let baseRate = 55

    // TradingView signals
    if (tradingview?.recommendation !== "NEUTRAL") baseRate += 15
    if (tradingview?.oscillators > 60 || tradingview?.oscillators < 40) baseRate += 5
    if (tradingview?.movingAverages > 60 || tradingview?.movingAverages < 40) baseRate += 5

    // Confluência técnica
    if (techData?.macd?.trend === techData?.ema?.trend) baseRate += 10
    if (techData?.volume?.trend === "INCREASING") baseRate += 8
    if (volatility > 2) baseRate += 5

    // Ajuste por risco
    baseRate += riskMultiplier * 5

    return Math.min(90, Math.max(45, baseRate))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Brain className="text-purple-400" />
            Planejador IA - Análise Técnica Avançada
          </h1>
          <p className="text-slate-300">Estratégias otimizadas com dados do TradingView e IA</p>
        </div>

        <Tabs defaultValue="planner" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="planner" className="text-white">
              Planejador IA
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-white">
              Análise Técnica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Configuração da Estratégia IA
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    IA otimizada com dados do TradingView em tempo real
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
                  </div>

                  <div>
                    <Label className="text-slate-300">Tempo de Operação (Opcional)</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="IA escolhe o melhor tempo" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="auto" className="text-white">
                          🤖 IA Otimizada
                        </SelectItem>
                        <SelectItem value="5" className="text-white">
                          ⚡ 5 minutos
                        </SelectItem>
                        <SelectItem value="10" className="text-white">
                          🚀 10 minutos
                        </SelectItem>
                        <SelectItem value="15" className="text-white">
                          ⏱️ 15 minutos
                        </SelectItem>
                        <SelectItem value="30" className="text-white">
                          🕐 30 minutos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Direção da Operação (Opcional)</Label>
                    <Select value={operationDirection} onValueChange={setOperationDirection}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="IA analisa a melhor direção" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="auto" className="text-white">
                          🤖 IA Decide
                        </SelectItem>
                        <SelectItem value="LONG" className="text-white">
                          📈 LONG
                        </SelectItem>
                        <SelectItem value="SHORT" className="text-white">
                          📉 SHORT
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                            {crypto.tradingview?.recommendation && (
                              <span className="ml-2 text-xs">({crypto.tradingview.recommendation})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {scalpingPlan.symbol} - Alavancagem {scalpingPlan.leverage}x | TradingView
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

            {aiRecommendation && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Análise Quantitativa Completa da IA
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Análise detalhada com dados do TradingView e indicadores técnicos
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
                    <div className="text-2xl font-bold text-white">{technicalData.rsi}</div>
                    <p className="text-xs text-slate-400">{technicalData.rsiSignal}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          technicalData.rsiSignal === "OVERSOLD"
                            ? "bg-green-500"
                            : technicalData.rsiSignal === "OVERBOUGHT"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                        style={{ width: `${technicalData.rsi}%` }}
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
                      <div>MACD: {technicalData.macd?.macd}</div>
                      <div>Signal: {technicalData.macd?.signal}</div>
                      <div>Histogram: {technicalData.macd?.histogram}</div>
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
                      <div>Upper: {technicalData.bollinger?.upper}</div>
                      <div>Middle: {technicalData.bollinger?.middle}</div>
                      <div>Lower: {technicalData.bollinger?.lower}</div>
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
                      <div>EMA20: {technicalData.ema?.ema20}</div>
                      <div>EMA50: {technicalData.ema?.ema50}</div>
                      <Badge
                        variant={technicalData.ema?.trend === "UPTREND" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {technicalData.ema?.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
