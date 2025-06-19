"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TradingOperation } from "@/types/trading"
import { Bell, TrendingUp, TrendingDown, X, CheckCircle, AlertTriangle, Square } from "lucide-react"

interface RealTimeMonitorProps {
  activeOperations: TradingOperation[]
  cryptoData: any[]
  onCompleteOperation: (id: string, profit: number, exitPrice: number) => void
  onStopOperation: (id: string, loss: number, exitPrice: number) => void
}

export default function RealTimeMonitor({
  activeOperations,
  cryptoData,
  onCompleteOperation,
  onStopOperation,
}: RealTimeMonitorProps) {
  const [alerts, setAlerts] = useState<{ [key: string]: string }>({})
  const [monitoringActive, setMonitoringActive] = useState(true)

  useEffect(() => {
    if (!monitoringActive || activeOperations.length === 0) return

    const interval = setInterval(() => {
      checkOperations()
    }, 5000) // Verificar a cada 5 segundos

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
      onCompleteOperation(operation.id, actualProfit, currentPrice)
    } else {
      onStopOperation(operation.id, Math.abs(actualProfit), currentPrice)
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
      onCompleteOperation(operation.id, actualProfit, currentPrice)
    } else {
      onStopOperation(operation.id, Math.abs(actualProfit), currentPrice)
    }

    // Remover alerta
    setAlerts((prev) => {
      const newAlerts = { ...prev }
      delete newAlerts[operation.id]
      return newAlerts
    })
  }

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  if (activeOperations.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Monitor em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-4">Nenhuma operação ativa para monitorar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Monitor em Tempo Real
          <Badge variant={monitoringActive ? "default" : "secondary"} className="ml-2">
            {monitoringActive ? "ATIVO" : "PAUSADO"}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={monitoringActive ? "destructive" : "default"}
            onClick={() => setMonitoringActive(!monitoringActive)}
          >
            {monitoringActive ? "Pausar" : "Ativar"} Monitor
          </Button>
        </div>
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

              {/* Botões de controle manual */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleManualClose(operation)} className="flex-1">
                  <Square className="w-4 h-4 mr-1" />
                  Finalizar Operação
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setMonitoringActive(!monitoringActive)}>
                  {monitoringActive ? "Pausar" : "Retomar"}
                </Button>
              </div>

              {alert && (
                <Alert
                  className={`${
                    alert === "TARGET_REACHED" ? "bg-green-900/20 border-green-600" : "bg-red-900/20 border-red-600"
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
                          <Button size="sm" variant="destructive" onClick={() => handleConfirmClose(operation, false)}>
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
  )
}
