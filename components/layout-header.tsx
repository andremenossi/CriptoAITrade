"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Settings,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Home,
  Brain,
  BarChart3,
  Play,
  Cog,
  Database,
  Bell,
  Shield,
  ExternalLink,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface LayoutHeaderProps {
  selectedAPI: string
  onAPIChange: (api: string) => void
  apiStatus: { [key: string]: "connected" | "error" | "loading" }
  lastUpdate: Date
}

const API_OPTIONS = [
  {
    id: "tradingview",
    name: "TradingView Pro",
    description: "Dados simulados com indicadores técnicos completos",
    features: ["Indicadores Técnicos", "Sinais de Trading", "Recomendações IA", "Análise Avançada"],
    region: "✅ Disponível globalmente",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "bg-blue-600",
    status: "Recomendado",
    type: "Simulado",
  },
  {
    id: "binance-spot",
    name: "Binance Spot API",
    description: "API oficial da Binance com dados reais de mercado",
    features: ["Dados Reais", "Alta Precisão", "Volume Real", "Preços Oficiais"],
    region: "✅ API oficial Binance",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "bg-yellow-600",
    status: "Oficial",
    type: "Real",
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    description: "API global confiável e estável",
    features: ["Disponível Globalmente", "Dados Históricos", "Market Cap", "Estável"],
    region: "✅ Funciona em todo o mundo",
    icon: <Globe className="w-4 h-4" />,
    color: "bg-emerald-600",
    status: "Estável",
    type: "Global",
  },
]

export default function LayoutHeader({ selectedAPI, onAPIChange, apiStatus, lastUpdate }: LayoutHeaderProps) {
  const pathname = usePathname()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-3 h-3 text-emerald-400" />
      case "error":
        return <XCircle className="w-3 h-3 text-red-400" />
      case "loading":
        return <Clock className="w-3 h-3 text-amber-400 animate-spin" />
      default:
        return <Clock className="w-3 h-3 text-slate-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado"
      case "error":
        return "Erro"
      case "loading":
        return "Carregando"
      default:
        return "Desconhecido"
    }
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      description: "Visão geral e monitoramento",
    },
    {
      href: "/planner",
      label: "Planejador IA",
      icon: Brain,
      description: "Criar e planejar operações",
    },
    {
      href: "/operations",
      label: "Operações",
      icon: Play,
      description: "Operações ativas e planejadas",
    },
    {
      href: "/history",
      label: "Histórico",
      icon: History,
      description: "Análise de operações passadas",
    },
  ]

  const currentAPI = API_OPTIONS.find((api) => api.id === selectedAPI)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-bold text-white">Crypto Scalping AI</span>
          <Badge variant="outline" className="text-xs">
            v2.1
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    isActive
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side - API Status & Settings */}
        <div className="flex items-center gap-3">
          {/* API Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(apiStatus[selectedAPI] || "unknown")}
            <Badge variant="secondary" className="text-xs">
              {currentAPI?.name || "TradingView"}
            </Badge>
          </div>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700"
            >
              <DropdownMenuLabel className="text-white">Configurações do Sistema</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />

              {/* API Selection */}
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block">Fonte de Dados</label>
                  <Select value={selectedAPI} onValueChange={onAPIChange}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {API_OPTIONS.map((api) => (
                        <SelectItem key={api.id} value={api.id} className="text-slate-100">
                          <div className="flex items-center gap-2">
                            {api.icon}
                            <span>{api.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                api.status === "Recomendado"
                                  ? "border-blue-500 text-blue-400"
                                  : api.status === "Oficial"
                                    ? "border-yellow-500 text-yellow-400"
                                    : "border-emerald-500 text-emerald-400"
                              }`}
                            >
                              {api.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 mt-1">{currentAPI?.description}</p>
                </div>

                {/* Current API Details */}
                {currentAPI && (
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${currentAPI.color}`} />
                      <span className="text-slate-100 text-sm font-medium">{currentAPI.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {currentAPI.type}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {currentAPI.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Status */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Status das APIs</label>
                  {API_OPTIONS.map((api) => (
                    <div key={api.id} className="flex items-center justify-between p-2 bg-slate-700 rounded text-xs">
                      <div className="flex items-center gap-2">
                        {api.icon}
                        <span className="text-slate-100">{api.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(apiStatus[api.id] || "unknown")}
                        <span className="text-slate-300">{getStatusText(apiStatus[api.id] || "unknown")}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Info */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Sistema</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-slate-300">Auto-refresh</span>
                      <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                        15s
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-slate-300">Cache</span>
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                        15s
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-slate-300">Indicadores</span>
                      <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                        Live
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <span className="text-slate-300">Sinais IA</span>
                      <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Last Update */}
                <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-700">
                  Última atualização: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-slate-700" />

              {/* Quick Actions */}
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Database className="w-4 h-4 mr-2" />
                Limpar Cache
              </DropdownMenuItem>

              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Bell className="w-4 h-4 mr-2" />
                Configurar Alertas
              </DropdownMenuItem>

              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Shield className="w-4 h-4 mr-2" />
                Gestão de Risco
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-700" />

              {/* Settings Page Link */}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="text-slate-300 hover:text-white hover:bg-slate-700 flex items-center">
                  <Cog className="w-4 h-4 mr-2" />
                  Configurações Avançadas
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Link>
              </DropdownMenuItem>

              {/* Footer */}
              <div className="p-3 border-t border-slate-700">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Crypto Scalping AI v2.1</p>
                  <p className="text-xs text-slate-500">Multi-Source Data + Groq AI</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
