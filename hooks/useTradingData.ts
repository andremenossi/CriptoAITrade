"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { TradingOperation, TradingStats, UserSettings } from "@/types/trading"

export function useTradingData() {
  const router = useRouter()
  const [operations, setOperations] = useState<TradingOperation[]>([])
  const [stats, setStats] = useState<TradingStats>({
    totalCapital: 1000,
    totalOperations: 0,
    successfulOperations: 0,
    totalProfit: 0,
    todayOperations: 0,
    todayProfit: 0,
    successRate: 0,
    averageDuration: 0,
    longOperations: 0,
    shortOperations: 0,
  })
  const [settings, setSettings] = useState<UserSettings>({
    autoCalculateCapital: true,
    riskPercentage: 2,
    maxSimultaneousOperations: 3,
    enableRealTimeAlerts: true,
  })

  // Carregar dados do localStorage
  useEffect(() => {
    const savedOperations = localStorage.getItem("trading-operations")
    const savedStats = localStorage.getItem("trading-stats")
    const savedSettings = localStorage.getItem("user-settings")

    if (savedOperations) {
      const parsedOps = JSON.parse(savedOperations).map((op: any) => ({
        ...op,
        startTime: new Date(op.startTime),
        endTime: op.endTime ? new Date(op.endTime) : undefined,
      }))
      setOperations(parsedOps)
    }

    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem("trading-operations", JSON.stringify(operations))
  }, [operations])

  useEffect(() => {
    localStorage.setItem("trading-stats", JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    localStorage.setItem("user-settings", JSON.stringify(settings))
  }, [settings])

  // Calcular estatísticas automaticamente
  useEffect(() => {
    calculateStats()
  }, [operations, settings])

  const calculateStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedOps = operations.filter((op) => op.status === "COMPLETED" || op.status === "STOPPED")
    const todayOps = completedOps.filter((op) => op.endTime && op.endTime >= today)
    const successfulOps = completedOps.filter((op) => op.actualProfit && op.actualProfit > 0)

    const totalProfit = completedOps.reduce((sum, op) => sum + (op.actualProfit || 0), 0)
    const todayProfit = todayOps.reduce((sum, op) => sum + (op.actualProfit || 0), 0)

    const longOps = completedOps.filter((op) => op.direction === "LONG").length
    const shortOps = completedOps.filter((op) => op.direction === "SHORT").length

    // Calcular duração média
    const durationsInMinutes = completedOps
      .filter((op) => op.endTime)
      .map((op) => {
        const duration = (op.endTime!.getTime() - op.startTime.getTime()) / (1000 * 60)
        return duration
      })

    const averageDuration =
      durationsInMinutes.length > 0
        ? durationsInMinutes.reduce((sum, dur) => sum + dur, 0) / durationsInMinutes.length
        : 0

    // Calcular capital total
    let totalCapital = settings.initialCapital || 1000
    if (settings.autoCalculateCapital) {
      totalCapital = (settings.initialCapital || 1000) + totalProfit
    }

    setStats({
      totalCapital,
      totalOperations: completedOps.length,
      successfulOperations: successfulOps.length,
      totalProfit,
      todayOperations: todayOps.length,
      todayProfit,
      successRate: completedOps.length > 0 ? (successfulOps.length / completedOps.length) * 100 : 0,
      averageDuration,
      longOperations: longOps,
      shortOperations: shortOps,
    })
  }

  const addOperation = (operation: Omit<TradingOperation, "id" | "startTime" | "status">) => {
    const newOperation: TradingOperation = {
      ...operation,
      id: Date.now().toString(),
      startTime: new Date(),
      status: "PLANNED",
    }
    setOperations((prev) => [...prev, newOperation])
    return newOperation.id
  }

  const startOperation = (id: string) => {
    setOperations((prev) => prev.map((op) => (op.id === id ? { ...op, status: "ACTIVE", startTime: new Date() } : op)))

    // Redirecionar para a página de operações
    router.push("/operations")
  }

  const completeOperation = (id: string, actualProfit: number, actualExitPrice: number) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === id
          ? {
              ...op,
              status: "COMPLETED",
              endTime: new Date(),
              actualProfit,
              exitPrice: actualExitPrice,
            }
          : op,
      ),
    )
  }

  const stopOperation = (id: string, actualLoss: number, actualExitPrice: number) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === id
          ? {
              ...op,
              status: "STOPPED",
              endTime: new Date(),
              actualProfit: -actualLoss,
              exitPrice: actualExitPrice,
            }
          : op,
      ),
    )
  }

  const deleteOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id))
  }

  const deleteAllOperations = () => {
    setOperations([])
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const getActiveOperations = () => operations.filter((op) => op.status === "ACTIVE")
  const getPlannedOperations = () => operations.filter((op) => op.status === "PLANNED")

  return {
    operations,
    stats,
    settings,
    addOperation,
    startOperation,
    completeOperation,
    stopOperation,
    deleteOperation,
    deleteAllOperations,
    updateSettings,
    getActiveOperations,
    getPlannedOperations,
  }
}
