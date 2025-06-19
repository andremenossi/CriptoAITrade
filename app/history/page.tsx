"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Brain,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useTradingData } from "@/hooks/useTradingData"
import type { TradingOperation } from "@/types/trading"

interface OperationAnalysis {
  analysis: string
  metrics: {
    profitDifference: number
    profitDifferencePercent: number
    duration: number
    success: boolean
    accuracyScore: number
  }
}

export default function HistoryPage() {
  const { operations, stats, deleteOperation, deleteAllOperations } = useTradingData()
  const [selectedOperation, setSelectedOperation] = useState<TradingOperation | null>(null)
  const [operationAnalysis, setOperationAnalysis] = useState<{ [key: string]: OperationAnalysis }>({})
  const [loadingAnalysis, setLoadingAnalysis] = useState<{ [key: string]: boolean }>({})
  const [analysisType, setAnalysisType] = useState<{ [key: string]: "simple" | "detailed" }>({})
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)

  // Carregar análises automáticas para operações finalizadas
  useEffect(() => {
    const completedOperations = operations.filter(
      (op) => (op.status === "COMPLETED" || op.status === "STOPPED") && !operationAnalysis[op.id],
    )

    completedOperations.forEach((operation) => {
      generateQuickAnalysis(operation)
    })
  }, [operations])

  const generateQuickAnalysis = async (operation: TradingOperation) => {
    if (loadingAnalysis[operation.id]) return

    setLoadingAnalysis((prev) => ({ ...prev, [operation.id]: true }))
    setAnalysisType((prev) => ({ ...prev, [operation.id]: "simple" }))

    try {
      const response = await fetch("/api/operation-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, detailed: false }),
      })

      const data = await response.json()
      setOperationAnalysis((prev) => ({
        ...prev,
        [operation.id]: data,
      }))
    } catch (error) {
      console.error("Erro ao gerar análise:", error)
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [operation.id]: false }))
    }
  }

  const generateDetailedAnalysis = async (operation: TradingOperation) => {
    setLoadingAnalysis((prev) => ({ ...prev, [operation.id + "_detailed"]: true }))

    try {
      const response = await fetch("/api/operation-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, detailed: true }),
      })

      const data = await response.json()
      setOperationAnalysis((prev) => ({
        ...prev,
        [operation.id]: data,
      }))
      setAnalysisType((prev) => ({ ...prev, [operation.id]: "detailed" }))
    } catch (error) {
      console.error("Erro ao gerar análise detalhada:", error)
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [operation.id + "_detailed"]: false }))
    }
  }

  const toggleAnalysisType = (operation: TradingOperation) => {
    const currentType = analysisType[operation.id] || "simple"

    if (currentType === "simple") {
      generateDetailedAnalysis(operation)
    } else {
      generateQuickAnalysis(operation)
    }
  }

  const handleDeleteOperation = (operationId: string) => {
    setOperationToDelete(operationId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteOperation = () => {
    if (operationToDelete) {
      deleteOperation(operationToDelete)
      setOperationToDelete(null)
    }
    setDeleteConfirmOpen(false)
  }

  const handleDeleteAllOperations = () => {
    setDeleteAllConfirmOpen(true)
  }

  const confirmDeleteAllOperations = () => {
    deleteAllOperations()
    setDeleteAllConfirmOpen(false)
  }

  const filteredOperations = operations
    .filter((op) => {
      if (filter === "completed") return op.status === "COMPLETED"
      if (filter === "stopped") return op.status === "STOPPED"
      if (filter === "active") return op.status === "ACTIVE"
      if (filter === "planned") return op.status === "PLANNED"
      return op.status === "COMPLETED" || op.status === "STOPPED"
    })
    .filter(
      (op) =>
        op.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.direction.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return (b.actualProfit || 0) - (a.actualProfit || 0)
        case "duration":
          const aDuration = a.endTime ? a.endTime.getTime() - a.startTime.getTime() : 0
          const bDuration = b.endTime ? b.endTime.getTime() - b.startTime.getTime() : 0
          return bDuration - aDuration
        case "symbol":
          return a.symbol.localeCompare(b.symbol)
        default: // date
          return b.startTime.getTime() - a.startTime.getTime()
      }
    })

  const completedOperations = operations.filter((op) => op.status === "COMPLETED" || op.status === "STOPPED")
  const successfulOperations = completedOperations.filter((op) => (op.actualProfit || 0) > 0)
  const totalProfit = completedOperations.reduce((sum, op) => sum + (op.actualProfit || 0), 0)
  const avgDuration =
    completedOperations.length > 0
      ? completedOperations.reduce((sum, op) => {
          if (!op.endTime) return sum
          return sum + (op.endTime.getTime() - op.startTime.getTime()) / (1000 * 60)
        }, 0) / completedOperations.length
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Histórico de Operações</h1>
            <p className="text-slate-400">Análise completa das suas operações com IA</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={operations.length === 0}
                  onClick={handleDeleteAllOperations}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Histórico
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Confirmar Exclusão Total
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Esta ação irá excluir TODAS as operações do histórico permanentemente. Esta ação não pode ser
                    desfeita.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                  <p className="text-red-200 text-sm">
                    ⚠️ <strong>Atenção:</strong> Você perderá todas as análises, estatísticas e dados históricos.
                  </p>
                  <p className="text-red-200 text-sm mt-2">
                    Total de operações: <strong>{operations.length}</strong>
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteAllConfirmOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteAllOperations}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Tudo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total de Operações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completedOperations.length}</div>
              <p className="text-xs text-slate-400">
                {successfulOperations.length} sucessos, {completedOperations.length - successfulOperations.length}{" "}
                falhas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Lucro Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400">
                Média: $
                {completedOperations.length > 0 ? (totalProfit / completedOperations.length).toFixed(2) : "0.00"} por
                operação
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {completedOperations.length > 0
                  ? ((successfulOperations.length / completedOperations.length) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-400">
                {successfulOperations.length}/{completedOperations.length} operações
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duração Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{Math.round(avgDuration)}min</div>
              <p className="text-xs text-slate-400">Por operação</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">
                      Todas
                    </SelectItem>
                    <SelectItem value="completed" className="text-white">
                      Concluídas
                    </SelectItem>
                    <SelectItem value="stopped" className="text-white">
                      Stop Loss
                    </SelectItem>
                    <SelectItem value="active" className="text-white">
                      Ativas
                    </SelectItem>
                    <SelectItem value="planned" className="text-white">
                      Planejadas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por símbolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="date" className="text-white">
                    Data
                  </SelectItem>
                  <SelectItem value="profit" className="text-white">
                    Lucro
                  </SelectItem>
                  <SelectItem value="duration" className="text-white">
                    Duração
                  </SelectItem>
                  <SelectItem value="symbol" className="text-white">
                    Símbolo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Operations List */}
        <div className="space-y-4">
          {filteredOperations.map((operation) => {
            const analysis = operationAnalysis[operation.id]
            const isLoading = loadingAnalysis[operation.id]
            const isLoadingDetailed = loadingAnalysis[operation.id + "_detailed"]
            const currentAnalysisType = analysisType[operation.id] || "simple"

            const duration = operation.endTime
              ? Math.floor((operation.endTime.getTime() - operation.startTime.getTime()) / (1000 * 60))
              : 0

            const profitPercent =
              operation.investment > 0 ? ((operation.actualProfit || 0) / operation.investment) * 100 : 0

            return (
              <Card key={operation.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {operation.direction === "LONG" ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <h3 className="text-white font-semibold">{operation.symbol}</h3>
                        <p className="text-sm text-slate-400">{operation.startTime.toLocaleString()}</p>
                      </div>
                      <Badge variant={operation.direction === "LONG" ? "default" : "destructive"}>
                        {operation.direction}
                      </Badge>
                      <Badge variant="outline">{operation.leverage}x</Badge>
                      <Badge
                        variant={
                          operation.status === "COMPLETED"
                            ? "default"
                            : operation.status === "STOPPED"
                              ? "destructive"
                              : operation.status === "ACTIVE"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {operation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            (operation.actualProfit || 0) >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {(operation.actualProfit || 0) >= 0 ? "+" : ""}${(operation.actualProfit || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {profitPercent >= 0 ? "+" : ""}
                          {profitPercent.toFixed(2)}%
                        </div>
                      </div>
                      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOperation(operation.id)}
                            className="text-red-400 border-red-600 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              Confirmar Exclusão
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Tem certeza que deseja excluir esta operação? Esta ação não pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {operation.direction === "LONG" ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-white font-semibold">{operation.symbol}</span>
                              <Badge variant={operation.direction === "LONG" ? "default" : "destructive"}>
                                {operation.direction}
                              </Badge>
                            </div>
                            <p className="text-slate-300 text-sm">
                              Lucro: ${(operation.actualProfit || 0).toFixed(2)} | Data:{" "}
                              {operation.startTime.toLocaleDateString()}
                            </p>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                              Cancelar
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteOperation}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comparativo Planejado vs Real */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-700 rounded-lg">
                    <div>
                      <div className="text-xs text-slate-400">Entrada</div>
                      <div className="text-white font-semibold">${operation.entryPrice.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Saída</div>
                      <div className="text-white font-semibold">${operation.exitPrice.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Lucro Planejado</div>
                      <div className="text-green-400">${operation.plannedProfit.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Duração</div>
                      <div className="text-white">{duration}min</div>
                    </div>
                  </div>

                  {/* Análise da IA */}
                  {(operation.status === "COMPLETED" || operation.status === "STOPPED") && (
                    <div className="border border-slate-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          Análise da IA
                        </h4>
                        <div className="flex gap-2">
                          {analysis && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAnalysisType(operation)}
                              disabled={isLoadingDetailed || isLoading}
                              className="text-slate-200 border-slate-600 hover:bg-slate-700 bg-slate-800"
                            >
                              {isLoadingDetailed || isLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <Brain className="w-4 h-4 mr-1" />
                              )}
                              {currentAnalysisType === "simple" ? "Análise Detalhada" : "Análise Simples"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {isLoading || isLoadingDetailed ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Gerando análise...
                        </div>
                      ) : analysis ? (
                        <div className="space-y-3">
                          <div className="text-slate-300 text-sm whitespace-pre-line">{analysis.analysis}</div>
                          {analysis.metrics && (
                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-slate-400">
                                  Precisão: {analysis.metrics.accuracyScore.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    analysis.metrics.success ? "bg-green-400" : "bg-red-400"
                                  }`}
                                ></div>
                                <span className="text-slate-400">{analysis.metrics.success ? "Sucesso" : "Falha"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm">Análise será gerada automaticamente...</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredOperations.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-8">
              <p className="text-slate-400">Nenhuma operação encontrada com os filtros aplicados.</p>
              {operations.length === 0 && (
                <p className="text-slate-500 text-sm mt-2">
                  Comece criando operações no{" "}
                  <a href="/planner" className="text-purple-400 hover:underline">
                    Planejador IA
                  </a>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
