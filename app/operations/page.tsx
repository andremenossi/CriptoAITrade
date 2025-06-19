"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react"
import { useTradingData } from "@/hooks/useTradingData"
import type { TradingOperation } from "@/types/trading"

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

export default function OperationsPage() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<{ [key: string]: string }>({})
  const [monitoringActive, setMonitoringActive] = useState(true)

  const { operations, completeOperation, stopOperation, startOperation, getActiveOperations, getPlannedOperations } =
    useTradingData()

  const activeOperations = getActiveOperations()
  const plannedOperations = getPlannedOperations()

  // Buscar dados da API TradingView
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/tradingview", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setCryptoData(data)
      } catch (error) {
        console.error("❌ TradingView falhou:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 15000) // Atualizar a cada 15 segundos
    return () => clearInterval(interval)
  }, [])

  // Monitoramento de operações ativas
  useEffect(() => {
    if (!monitoringActive || activeOperations.length === 0) return

    const interval = setInterval(() => {
      checkOperations()
    }, 3000) // Verificar a cada 3 segundos

    return () => clearInterval(interval)
  }, [activeOperations, cryptoData, monitoringActive])

  const checkOperations = async () => {
    for (const operation of activeOperations) {
      const crypto = cryptoData.find((c) => c.symbol === operation.symbol)
      if (!crypto) continue

      const currentPrice = Number.parseFloat(crypto.price)
      const entryPrice = operation.entryPrice
      const targetPrice = operation.exitPrice
      const stopLossPrice = operation.stopLoss

      // Verificar se atingiu take profit
      const targetReached = operation.direction === "LONG" ? currentPrice >= targetPrice : currentPrice <= targetPrice

      // Verificar se atingiu stop loss
      const stopLossReached =
        operation.direction === "LONG" ? currentPrice <= stopLossPrice : currentPrice >= stopLossPrice

      if (targetReached && !alerts[operation.id]) {
        setAlerts((prev) => ({
          ...prev,
          [operation.id]: "TARGET_REACHED",
        }))

        // Notificação do navegador
        if (Notification.permission === "granted") {
          new Notification("🎯 Take Profit Atingido!", {
            body: `${operation.symbol} ${operation.direction} - Feche a operação agora!`,
            icon: "/favicon.ico",
          })
        }
      }

      if (stopLossReached && !alerts[operation.id]) {
        setAlerts((prev) => ({
          ...prev,
          [operation.id]: "STOP_LOSS_REACHED",
        }))

        // Notificação do navegador
        if (Notification.permission === "granted") {
          new Notification("🛑 Stop Loss Atingido!", {
            body: `${operation.symbol} ${operation.direction} - Feche a operação imediatamente!`,
            icon: "/favicon.ico",
          })
        }
      }
    }
  }

  const handleStartOperation = (operationId: string) => {
    startOperation(operationId)
  }

  const handleManualClose = (operation: TradingOperation) => {
    const crypto = cryptoData.find((c) => c.symbol === operation.symbol)
    if (!crypto) return

    const currentPrice = Number.parseFloat(crypto.price)
    const entryPrice = operation.entryPrice

    let actualProfit = 0
    if (operation.direction === "LONG") {
      actualProfit = ((currentPrice - entryPrice) / entryPrice) * operation.investment * operation.leverage
    } else {
      actualProfit = ((entryPrice - currentPrice) / entryPrice) * operation.investment * operation.leverage
    }

    // Descontar taxas
    actualProfit -= operation.fees + operation.fundingCost

    if (actualProfit >= 0) {
      completeOperation(operation.id, actualProfit, currentPrice)
    } else {
      stopOperation(operation.id, Math.abs(actualProfit), currentPrice)
    }

    // Remover alerta se existir
    setAlerts((prev) => {
      const newAlerts = { ...prev }
      delete newAlerts[operation.id]
      return newAlerts
    })
  }

  const handleConfirmClose = (operation: TradingOperation, isProfit: boolean) => {
    const crypto = cryptoData.find((c) => c.symbol === operation.symbol)
    if (!crypto) return

    const currentPrice = Number.parseFloat(crypto.price)
    const entryPrice = operation.entryPrice

    let actualProfit = 0
    if (operation.direction === "LONG") {
      actualProfit = ((currentPrice - entryPrice) / entryPrice) * operation.investment * operation.leverage
    } else {
      actualProfit = ((entryPrice - currentPrice) / entryPrice) * operation.investment * operation.leverage
    }

    // Descontar taxas
    actualProfit -= operation.fees + operation.fundingCost

    if (isProfit) {
      completeOperation(operation.id, actualProfit, currentPrice)
    } else {
      stopOperation(operation.id, Math.abs(actualProfit), currentPrice)
    }

    // Remover alerta
    setAlerts((prev) => {
      const newAlerts = { ...prev }
      delete newAlerts[operation.id]
      return newAlerts
    })
  }

  // Solicitar permissão para notificações
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Play className="text-green-400" />
            Operações Ativas
          </h1>
          <p className="text-slate-300">Monitore e gerencie suas operações em tempo real</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant={monitoringActive ? "default" : "secondary"} className="text-xs">
              {monitoringActive ? "MONITORAMENTO ATIVO" : "PAUSADO"}
            </Badge>
            <Button
              size="sm"
              variant={monitoringActive ? "destructive" : "default"}
              onClick={() => setMonitoringActive(!monitoringActive)}
            >
              {monitoringActive ? "Pausar" : "Ativar"} Monitor
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Operações Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{activeOperations.length}</div>
              <p className="text-xs text-slate-400">Em execução</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Operações Planejadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{plannedOperations.length}</div>
              <p className="text-xs text-slate-400">Aguardando início</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{Object.keys(alerts).length}</div>
              <p className="text-xs text-slate-400">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Operações Planejadas */}
        {plannedOperations.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operações Planejadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plannedOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {operation.direction === "LONG" ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{operation.symbol}</div>
                      <div className="text-sm text-slate-400">
                        Entrada: ${operation.entryPrice.toFixed(4)} | Target: ${operation.exitPrice.toFixed(4)}
                      </div>
                    </div>
                    <Badge variant={operation.direction === "LONG" ? "default" : "destructive"}>
                      {operation.direction}
                    </Badge>
                    <Badge variant="outline">{operation.leverage}x</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-white font-semibold">${operation.investment.toFixed(2)}</div>
                      <div className="text-sm text-green-400">+${operation.plannedProfit.toFixed(2)} esperado</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartOperation(operation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Operações Ativas */}
        {activeOperations.length > 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Monitor em Tempo Real
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeOperations.map((operation) => {
                const crypto = cryptoData.find((c) => c.symbol === operation.symbol)
                const currentPrice = crypto ? Number.parseFloat(crypto.price) : 0
                const alert = alerts[operation.id]

                // Calcular P&L atual
                let currentPnL = 0
                if (crypto) {
                  if (operation.direction === "LONG") {
                    currentPnL =
                      ((currentPrice - operation.entryPrice) / operation.entryPrice) *
                      operation.investment *
                      operation.leverage
                  } else {
                    currentPnL =
                      ((operation.entryPrice - currentPrice) / operation.entryPrice) *
                      operation.investment *
                      operation.leverage
                  }
                  currentPnL -= operation.fees + operation.fundingCost
                }

                return (
                  <div key={operation.id} className="border border-slate-600 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {operation.direction === "LONG" ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white font-semibold">{operation.symbol}</span>
                        <Badge variant={operation.direction === "LONG" ? "default" : "destructive"}>
                          {operation.direction}
                        </Badge>
                        <Badge variant="outline">{operation.leverage}x</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">${currentPrice.toFixed(4)}</div>
                        <div className={`text-sm ${currentPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {currentPnL >= 0 ? "+" : ""}${currentPnL.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Entrada:</span>
                        <div className="text-white">${operation.entryPrice.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Target:</span>
                        <div className="text-green-400">${operation.exitPrice.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Stop:</span>
                        <div className="text-red-400">${operation.stopLoss.toFixed(4)}</div>
                      </div>
                    </div>

                    {/* Botões de controle */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualClose(operation)}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Finalizar Operação
                      </Button>
                    </div>

                    {alert && (
                      <Alert
                        className={`${
                          alert === "TARGET_REACHED"
                            ? "bg-green-900/20 border-green-600"
                            : "bg-red-900/20 border-red-600"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-white">
                          {alert === "TARGET_REACHED" ? (
                            <div className="space-y-2">
                              <p>
                                🎯 <strong>TAKE PROFIT ATINGIDO!</strong>
                              </p>
                              <p>Feche a operação agora para garantir o lucro planejado.</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleConfirmClose(operation, true)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirmar Fechamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setAlerts((prev) => {
                                      const newAlerts = { ...prev }
                                      delete newAlerts[operation.id]
                                      return newAlerts
                                    })
                                  }
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Ignorar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p>
                                🛑 <strong>STOP LOSS ATINGIDO!</strong>
                              </p>
                              <p>Feche a operação imediatamente para limitar as perdas.</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleConfirmClose(operation, false)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Confirmar Stop Loss
                                </Button>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-xs text-slate-400">
                      Iniciado: {operation.startTime.toLocaleTimeString()} | Duração:{" "}
                      {Math.floor((Date.now() - operation.startTime.getTime()) / (1000 * 60))}min
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-8">
              <div className="space-y-4">
                <div className="text-6xl">📊</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhuma operação ativa</h3>
                  <p className="text-slate-400 mb-4">
                    {plannedOperations.length > 0
                      ? "Você tem operações planejadas aguardando para serem iniciadas."
                      : "Crie novas operações no Planejador IA para começar."}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button asChild>
                      <a href="/planner">Criar Nova Operação</a>
                    </Button>
                    {plannedOperations.length > 0 && (
                      <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        Ver Operações Planejadas
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
