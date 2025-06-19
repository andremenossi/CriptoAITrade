"use client"

import type React from "react"
import { useState, useEffect } from "react"
import LayoutHeader from "@/components/layout-header"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedAPI, setSelectedAPI] = useState("tradingview")
  const [apiStatus, setApiStatus] = useState<{ [key: string]: "connected" | "error" | "loading" }>({})
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Função para testar status das APIs
  const testAPIStatus = async (apiId: string) => {
    setApiStatus((prev) => ({ ...prev, [apiId]: "loading" }))

    try {
      console.log(`🔍 Testando API: ${apiId}`)

      const response = await fetch(`/api/${apiId}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      })

      console.log(`📡 API ${apiId} - Status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ API ${apiId} funcionando - ${data.length} símbolos`)
        setApiStatus((prev) => ({ ...prev, [apiId]: "connected" }))
      } else {
        console.log(`⚠️ API ${apiId} retornou status ${response.status}`)
        setApiStatus((prev) => ({ ...prev, [apiId]: "error" }))
      }
    } catch (error) {
      console.error(`❌ Erro ao testar API ${apiId}:`, error)
      setApiStatus((prev) => ({ ...prev, [apiId]: "error" }))
    }
  }

  // Testar todas as APIs no carregamento
  useEffect(() => {
    const apis = ["tradingview", "binance-spot", "coingecko"]
    apis.forEach((api) => testAPIStatus(api))

    // Testar periodicamente
    const interval = setInterval(() => {
      apis.forEach((api) => testAPIStatus(api))
      setLastUpdate(new Date())
    }, 60000) // A cada 1 minuto

    return () => clearInterval(interval)
  }, [])

  // Quando trocar de API, testar imediatamente
  const handleAPIChange = (newAPI: string) => {
    console.log(`🔄 Trocando para API: ${newAPI}`)
    setSelectedAPI(newAPI)
    testAPIStatus(newAPI)
    setLastUpdate(new Date())
  }

  return (
    <>
      <LayoutHeader
        selectedAPI={selectedAPI}
        onAPIChange={handleAPIChange}
        apiStatus={apiStatus}
        lastUpdate={lastUpdate}
      />
      <div className="pt-0">{children}</div>
    </>
  )
}
