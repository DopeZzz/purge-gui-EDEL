"use client"

import { useState } from "react"

export interface GameConfig {
  autoDetection: boolean
  legit: boolean
  randomness: number
  scale: number
  sensitivity: number
  scopeSensitivity: number
  fov: number
  crouchKey: string
  selectedWeapon: string
  selectedScope: string
  selectedBarrel: string
}

export function useConfig() {
  const [config, setConfig] = useState<GameConfig>({
    autoDetection: true,
    legit: true,
    randomness: 0,
    scale: 100,
    sensitivity: 0.28,
    scopeSensitivity: 1,
    fov: 90,
    crouchKey: "LeftControl",
    selectedWeapon: "None",
    selectedScope: "16x Scope",
    selectedBarrel: "Muzzleboost",
  })

  const updateConfig = (key: keyof GameConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const exportConfig = () => {
    return JSON.stringify(config, null, 2)
  }

  const importConfig = (configString: string) => {
    try {
      const parsedConfig = JSON.parse(configString)
      setConfig(parsedConfig)
      return true
    } catch (error) {
      console.error("Error importing config:", error)
      return false
    }
  }

  return {
    config,
    updateConfig,
    exportConfig,
    importConfig,
  }
}
