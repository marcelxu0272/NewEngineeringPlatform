"use client"

import { ReactNode } from "react"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: ReactNode
}

export function ChartContainer({ config, children }: ChartContainerProps) {
  return (
    <div style={{ "--chart-1": "166 64% 49%" } as any}>
      {children}
    </div>
  )
} 