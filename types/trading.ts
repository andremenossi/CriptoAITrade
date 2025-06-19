export interface TradingOperation {
  id: string
  symbol: string
  direction: "LONG" | "SHORT"
  entryPrice: number
  exitPrice: number
  stopLoss: number
  leverage: number
  investment: number
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "STOPPED"
  startTime: Date
  endTime?: Date
  plannedProfit: number
  actualProfit?: number
  fees: number
  fundingCost: number
  duration: string
  successRate: number
  aiRecommendation: string
  alertSent?: boolean
  userConfirmed?: boolean
}

export interface TradingStats {
  totalCapital: number
  totalOperations: number
  successfulOperations: number
  totalProfit: number
  todayOperations: number
  todayProfit: number
  successRate: number
  averageDuration: number
  longOperations: number
  shortOperations: number
}

export interface UserSettings {
  initialCapital?: number
  autoCalculateCapital: boolean
  riskPercentage: number
  maxSimultaneousOperations: number
  enableRealTimeAlerts: boolean
}
