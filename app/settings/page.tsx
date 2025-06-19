"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Settings,
  Shield,
  Bell,
  Database,
  DollarSign,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  Activity,
} from "lucide-react"
import { useTradingData } from "@/hooks/useTradingData"

export default function SettingsPage() {
  const { settings, updateSettings } = useTradingData()
  const [localSettings, setLocalSettings] = useState(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    updateSettings(localSettings)
    setIsSaving(false)
    setSaveSuccess(true)

    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleReset = () => {
    setLocalSettings({
      autoCalculateCapital: true,
      riskPercentage: 2,
      maxSimultaneousOperations: 3,
      enableRealTimeAlerts: true,
      initialCapital: 1000,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Settings className="text-purple-400" />
            Configurações Avançadas
          </h1>
          <p className="text-slate-300">Personalize sua experiência de trading</p>
        </div>

        {/* Save Success Alert */}
        {saveSuccess && (
          <Alert className="mb-6 bg-green-900/20 border-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">Configurações salvas com sucesso!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="trading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="trading" className="text-white">
              Trading
            </TabsTrigger>
            <TabsTrigger value="apis" className="text-white">
              APIs
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-white">
              Gestão de Risco
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-white">
              Alertas
            </TabsTrigger>
            <TabsTrigger value="system" className="text-white">
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Trading Settings */}
          <TabsContent value="trading" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Configurações de Capital
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure seu capital inicial e gestão automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Capital Inicial ($)</Label>
                    <Input
                      type="number"
                      value={localSettings.initialCapital || 1000}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          initialCapital: Number(e.target.value),
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Valor base para cálculos de risco e alavancagem</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label className="text-slate-300">Cálculo Automático de Capital</Label>
                      <p className="text-xs text-slate-400">Atualiza automaticamente com lucros/perdas</p>
                    </div>
                    <Switch
                      checked={localSettings.autoCalculateCapital}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          autoCalculateCapital: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Operações Simultâneas Máximas</Label>
                  <Select
                    value={localSettings.maxSimultaneousOperations?.toString() || "3"}
                    onValueChange={(value) =>
                      setLocalSettings({
                        ...localSettings,
                        maxSimultaneousOperations: Number(value),
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="1" className="text-white">
                        1 operação
                      </SelectItem>
                      <SelectItem value="2" className="text-white">
                        2 operações
                      </SelectItem>
                      <SelectItem value="3" className="text-white">
                        3 operações
                      </SelectItem>
                      <SelectItem value="5" className="text-white">
                        5 operações
                      </SelectItem>
                      <SelectItem value="10" className="text-white">
                        10 operações
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 mt-1">Limite de operações ativas ao mesmo tempo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* APIs Settings */}
          <TabsContent value="apis" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Configurações de APIs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure e gerencie suas fontes de dados de mercado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TradingView Pro */}
                  <div className="p-4 bg-slate-700 rounded-lg border-2 border-blue-600">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold">TradingView Pro</h3>
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                        Recomendado
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      Dados simulados com indicadores técnicos completos e sinais de trading avançados.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Indicadores Técnicos Completos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Sinais de Trading IA</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Recomendações Automáticas</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Análise de Momentum</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Atualização:</span>
                        <span className="text-blue-400">15s</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Latência:</span>
                        <span className="text-emerald-400">Baixa</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Confiabilidade:</span>
                        <span className="text-emerald-400">99.9%</span>
                      </div>
                    </div>
                  </div>

                  {/* Binance Spot */}
                  <div className="p-4 bg-slate-700 rounded-lg border-2 border-yellow-600">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-white font-semibold">Binance Spot</h3>
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                        Oficial
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      API oficial da Binance com dados reais de mercado spot e volume real.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Dados Oficiais Binance</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Preços Reais de Mercado</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Volume Real 24h</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">High/Low 24h</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Atualização:</span>
                        <span className="text-yellow-400">30s</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Latência:</span>
                        <span className="text-emerald-400">Muito Baixa</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Confiabilidade:</span>
                        <span className="text-emerald-400">99.8%</span>
                      </div>
                    </div>
                  </div>

                  {/* CoinGecko */}
                  <div className="p-4 bg-slate-700 rounded-lg border-2 border-emerald-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-white font-semibold">CoinGecko</h3>
                      <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                        Estável
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      API global confiável com dados agregados de múltiplas exchanges.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Disponível Globalmente</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Dados Históricos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Market Cap</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300">Múltiplas Exchanges</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Atualização:</span>
                        <span className="text-emerald-400">60s</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Latência:</span>
                        <span className="text-yellow-400">Média</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Confiabilidade:</span>
                        <span className="text-emerald-400">99.5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Configurações de Performance
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Intervalo de Atualização</span>
                        <Select defaultValue="15">
                          <SelectTrigger className="w-20 h-8 bg-slate-600 border-slate-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            <SelectItem value="5" className="text-white">
                              5s
                            </SelectItem>
                            <SelectItem value="15" className="text-white">
                              15s
                            </SelectItem>
                            <SelectItem value="30" className="text-white">
                              30s
                            </SelectItem>
                            <SelectItem value="60" className="text-white">
                              60s
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Cache Duration</span>
                        <Select defaultValue="15">
                          <SelectTrigger className="w-20 h-8 bg-slate-600 border-slate-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            <SelectItem value="10" className="text-white">
                              10s
                            </SelectItem>
                            <SelectItem value="15" className="text-white">
                              15s
                            </SelectItem>
                            <SelectItem value="30" className="text-white">
                              30s
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Auto-Fallback</span>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Rate Limiting</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Status das APIs
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-slate-600 rounded">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-100 text-sm">TradingView Pro</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Online</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-600 rounded">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                          <span className="text-slate-100 text-sm">Binance Spot</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Online</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-600 rounded">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-100 text-sm">CoinGecko</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Online</span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Testar Todas as APIs
                    </Button>
                  </div>
                </div>

                {/* API Recommendations */}
                <Alert className="bg-blue-900/20 border-blue-600">
                  <Zap className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    <strong>Recomendação:</strong> Use TradingView Pro para análise técnica completa, Binance Spot para
                    dados reais de preços, e CoinGecko como backup confiável.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Management */}
          <TabsContent value="risk" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Gestão de Risco
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure limites de risco e proteções automáticas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Risco por Operação (%)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={localSettings.riskPercentage || 2}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          riskPercentage: Number(e.target.value),
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Badge variant="outline" className="text-xs">
                      Recomendado: 1-3%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Percentual máximo do capital a ser arriscado por operação
                  </p>
                </div>

                <Alert className="bg-yellow-900/20 border-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-200">
                    <strong>Importante:</strong> Nunca arrisque mais de 5% do seu capital em uma única operação. O
                    trading de futuros envolve alto risco de liquidação.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Proteções Automáticas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Stop Loss Obrigatório</span>
                        <Badge variant="default" className="text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Limite de Alavancagem</span>
                        <Badge variant="default" className="text-xs">
                          100x Max
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Verificação de Liquidação</span>
                        <Badge variant="default" className="text-xs">
                          Ativo
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Limites Diários</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Perda Máxima Diária</span>
                        <span className="text-red-400">-5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Operações Máximas</span>
                        <span className="text-blue-400">20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Tempo de Pausa</span>
                        <span className="text-yellow-400">30min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Configurações de Alertas
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure notificações e alertas em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label className="text-slate-300">Alertas em Tempo Real</Label>
                      <p className="text-xs text-slate-400">Notificações para take profit e stop loss</p>
                    </div>
                    <Switch
                      checked={localSettings.enableRealTimeAlerts}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          enableRealTimeAlerts: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label className="text-slate-300">Notificações do Navegador</Label>
                      <p className="text-xs text-slate-400">Alertas mesmo com a aba fechada</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label className="text-slate-300">Alertas de Volatilidade</Label>
                      <p className="text-xs text-slate-400">Notificar quando volatilidade &gt; 5%</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label className="text-slate-300">Alertas de Funding Rate</Label>
                      <p className="text-xs text-slate-400">Notificar quando funding rate &gt; 0.1%</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <h4 className="text-blue-200 font-semibold mb-2">Configuração de Notificações</h4>
                  <p className="text-blue-200 text-sm mb-3">
                    Para receber alertas, permita notificações no seu navegador.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if ("Notification" in window) {
                        Notification.requestPermission()
                      }
                    }}
                  >
                    Permitir Notificações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Performance, cache e configurações técnicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Atualização de Dados</span>
                        <Select defaultValue="15">
                          <SelectTrigger className="w-20 h-8 bg-slate-600 border-slate-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            <SelectItem value="5" className="text-white">
                              5s
                            </SelectItem>
                            <SelectItem value="15" className="text-white">
                              15s
                            </SelectItem>
                            <SelectItem value="30" className="text-white">
                              30s
                            </SelectItem>
                            <SelectItem value="60" className="text-white">
                              60s
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Cache de Dados</span>
                        <Select defaultValue="15">
                          <SelectTrigger className="w-20 h-8 bg-slate-600 border-slate-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            <SelectItem value="10" className="text-white">
                              10s
                            </SelectItem>
                            <SelectItem value="15" className="text-white">
                              15s
                            </SelectItem>
                            <SelectItem value="30" className="text-white">
                              30s
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Dados Armazenados</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Operações</span>
                        <span className="text-blue-400">Local Storage</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Configurações</span>
                        <span className="text-blue-400">Local Storage</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Cache API</span>
                        <span className="text-blue-400">Memória</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        localStorage.clear()
                        window.location.reload()
                      }}
                    >
                      Limpar Todos os Dados
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">Informações do Sistema</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Versão</span>
                      <div className="text-white font-medium">v2.1.0</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Build</span>
                      <div className="text-white font-medium">2025.01.18</div>
                    </div>
                    <div>
                      <span className="text-slate-400">APIs</span>
                      <div className="text-white font-medium">3 Fontes</div>
                    </div>
                    <div>
                      <span className="text-slate-400">IA</span>
                      <div className="text-white font-medium">Groq AI</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="text-slate-300 text-sm">Lembre-se de salvar suas alterações antes de sair da página.</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Padrões
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
