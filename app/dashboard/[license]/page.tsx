"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Lock, Shield, LogIn, Volume2, Mic, Settings, Target, Zap, Eye } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import { ThemeSelector } from "@/components/theme-selector"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { HotkeySelector } from "@/components/hotkey-selector"
import { useConfig } from "@/hooks/use-config"
import { WEAPON_NAMES_API, SCOPE_OPTIONS, BARREL_OPTIONS, getDisplayWeapon, getDisplayScope, getDisplayBarrel } from "@/lib/options"
import { keyNameToCode, codeToKeyName } from "@/lib/keycodes"
import { submitConfiguration, fetchDashboardConfig } from "@/app/services/recoil-actions"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import { format } from 'date-fns'

export default function DashboardPage() {
  const params = useParams()
  const licenseKey = params.license as string
  const router = useRouter()

  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClientConnected, setIsClientConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  // Estados para la configuración
  const { config, updateConfig, exportConfig, importConfig } = useConfig()
  const [voiceVolume, setVoiceVolume] = useState(0.5)
  const [selectedVoice, setSelectedVoice] = useState("John")
  const [detectionAccuracy, setDetectionAccuracy] = useState(0.8)

  // NUEVO: Estado para controlar si el audio está listo
  const [isAudioReady, setIsAudioReady] = useState(false)

  // NUEVO: Función playVoiceSample con verificación de audio listo
  const playVoiceSample = useCallback((voice: string, weaponName: string, volume: number) => {
    if (!isAudioReady) {
      console.log("Audio not ready, skipping playback.")
      return
    }
    try {
      const audio = new Audio(`/voices/${voice}/${weaponName}.mp3`)
      audio.volume = volume
      audio.play().catch(e => console.error("Audio playback error:", e))
    } catch (e) {
      console.error("Error creating audio:", e)
    }
  }, [isAudioReady])

  // NUEVO: Manejador para habilitar el audio
  const handleEnableAudio = () => {
    try {
      // Intenta reproducir un sonido silencioso para "desbloquear" el audio en el navegador
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      gainNode.gain.value = 0 // Volumen a cero para que sea silencioso
      oscillator.start(0)
      oscillator.stop(audioContext.currentTime + 0.01) // Reproduce por una duración muy corta

      setIsAudioReady(true)
      console.log("Audio enabled by user interaction.")
    } catch (e) {
      console.error("Failed to enable audio:", e)
      setSubmitMessage("Error: Could not enable audio. Please check browser settings.")
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedExpiresAt = localStorage.getItem('licenseExpiresAt')
      if (storedExpiresAt) {
        setExpiresAt(storedExpiresAt)
      }
    }
  }, [])

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true)
      const fetchedConfig = await fetchDashboardConfig(licenseKey)
      if (fetchedConfig) {
        updateConfig("autoDetection", fetchedConfig.auto_detection ?? config.autoDetection)
        updateConfig("legit", fetchedConfig.legit ?? config.legit)
        updateConfig("randomness", fetchedConfig.randomness ?? config.randomness)
        updateConfig("scale", fetchedConfig.scale ?? config.scale)
        updateConfig("sensitivity", fetchedConfig.sens ?? config.sensitivity)
        updateConfig("scopeSensitivity", fetchedConfig.imsens ?? config.scopeSensitivity)
        updateConfig("fov", fetchedConfig.fov ?? config.fov)
        updateConfig("crouchKey", codeToKeyName(fetchedConfig.crouch_key) ?? config.crouchKey)
        updateConfig("selectedWeapon", fetchedConfig.weapon ?? config.selectedWeapon)
        updateConfig("selectedScope", fetchedConfig.scope ?? config.selectedScope)
        updateConfig("selectedBarrel", fetchedConfig.barrel ?? config.selectedBarrel)
        setVoiceVolume(fetchedConfig.voice_volume ?? voiceVolume)
        setSelectedVoice(fetchedConfig.voice_name ?? selectedVoice)
        setDetectionAccuracy(fetchedConfig.detection_accuracy ?? detectionAccuracy)
      }
      setIsLoading(false)
    }
    loadConfig()
  }, [licenseKey, updateConfig])

  const realtimeHandlers = useMemo(() => ({
    setSelectedWeapon: (id: string) => {
      updateConfig("selectedWeapon", id)
      playVoiceSample(selectedVoice, getDisplayWeapon(id), voiceVolume)
    },
    setSelectedScope: (id: string) => {
      updateConfig("selectedScope", id)
      playVoiceSample(selectedVoice, getDisplayScope(id), voiceVolume)
    },
    setSelectedBarrel: (id: string) => {
      updateConfig("selectedBarrel", id)
      playVoiceSample(selectedVoice, getDisplayBarrel(id), voiceVolume)
    },
    onProgramConnected: () => {
      setIsClientConnected(true)
      playVoiceSample(selectedVoice, "connected", voiceVolume)
    },
    setScriptEnabled: (val: boolean) => updateConfig("scriptOn", val),
    setAutoDetection: (val: boolean) => updateConfig("autoDetection", val),
    setHipfire: (val: boolean) => updateConfig("hipfire", val),
  }), [updateConfig, playVoiceSample, selectedVoice, voiceVolume])

  useRealtimeUpdates(licenseKey, realtimeHandlers)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitMessage(null)

    const payload = {
      serial: licenseKey,
      weapon: config.selectedWeapon,
      scope: config.selectedScope,
      barrel: config.selectedBarrel,
      fov: config.fov,
      sens: config.sensitivity,
      imsens: config.scopeSensitivity,
      crouch_key: keyNameToCode(config.crouchKey) || 0,
      aim_key: keyNameToCode(config.aimKey || "MouseRight") || 0,
      detection_accuracy: detectionAccuracy,
      hipfire: config.hipfire,
      hipfire_key: keyNameToCode(config.hipfireKey) || 0,
      zoom: config.zoom,
      zoom_key: keyNameToCode(config.zoomKey) || 0,
      auto_detection: config.autoDetection,
      script_on: config.scriptOn,
      script_toggle_key: keyNameToCode(config.scriptToggleKey) || 0,
      auto_detection_toggle_key: keyNameToCode(config.autoDetectionToggleKey) || 0,
      randomness: config.randomness,
      save_config: true,
    }

    const result = await submitConfiguration(payload)
    if (result.success) {
      setSubmitMessage("Configuration saved successfully!")
    } else {
      setSubmitMessage(`Error saving configuration: ${result.error}`)
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-xl font-semibold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex flex-col items-center p-6 relative">
      {/* NUEVO: Modal para habilitar audio */}
      {!isAudioReady && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="bg-gray-900/90 border-gray-700/50 shadow-2xl backdrop-blur-sm p-8 text-center max-w-md">
            <CardHeader>
              <CardTitle className="text-white mb-4 flex items-center justify-center gap-2">
                <Volume2 className="w-6 h-6 text-green-400" />
                Enable Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-6">
                Click the button below to enable audio notifications and voice feedback in the application.
              </p>
              <Button 
                onClick={handleEnableAudio} 
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 font-semibold rounded-lg transition-all duration-200"
              >
                <Mic className="w-5 h-5 mr-2" />
                Enable Audio
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <NotificationsDropdown />
        <ThemeSelector />
        <LogoutButton />
      </div>

      <div className="w-full max-w-6xl mt-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="/images/purge-logo.png" alt="PURGE Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Purge 2.0 Dashboard
            </h1>
          </div>
          <p className="text-gray-400 mb-4">Rust Cloud Scripting</p>
          <p className="text-lg text-gray-300">
            License: <span className="font-semibold text-white">{licenseKey}</span>
          </p>
          {expiresAt && (
            <p className="text-lg text-gray-300">
              Time left: <span className="font-semibold text-white">{format(new Date(expiresAt), 'PPP')}</span>
            </p>
          )}
          <p className={`text-sm font-semibold mt-2 ${isClientConnected ? 'text-green-400' : 'text-red-400'}`}>
            Status: {isClientConnected ? 'Client Connected' : 'Client Disconnected'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Script Control */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Script Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="script-enabled" className="text-gray-300">Script Enabled</Label>
                <Switch
                  id="script-enabled"
                  checked={config.scriptOn}
                  onCheckedChange={(checked) => updateConfig("scriptOn", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detection" className="text-gray-300">Auto Detection</Label>
                <Switch
                  id="auto-detection"
                  checked={config.autoDetection}
                  onCheckedChange={(checked) => updateConfig("autoDetection", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Weapon Selection */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Weapon Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weapon-select" className="text-gray-300 mb-2 block">Weapon</Label>
                <Select value={config.selectedWeapon} onValueChange={(value) => updateConfig("selectedWeapon", value)}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select weapon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    {WEAPON_NAMES_API.map((weapon) => (
                      <SelectItem key={weapon} value={weapon}>
                        {getDisplayWeapon(weapon)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scope-select" className="text-gray-300 mb-2 block">Scope</Label>
                <Select value={config.selectedScope} onValueChange={(value) => updateConfig("selectedScope", value)}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    {SCOPE_OPTIONS.map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        {scope.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="barrel-select" className="text-gray-300 mb-2 block">Barrel</Label>
                <Select value={config.selectedBarrel} onValueChange={(value) => updateConfig("selectedBarrel", value)}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select barrel" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    {BARREL_OPTIONS.map((barrel) => (
                      <SelectItem key={barrel.value} value={barrel.value}>
                        {barrel.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Game Settings */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sensitivity" className="text-gray-300 mb-2 block">
                  Sensitivity: {config.sensitivity}
                </Label>
                <Input
                  id="sensitivity"
                  type="number"
                  step="0.01"
                  value={config.sensitivity}
                  onChange={(e) => updateConfig("sensitivity", parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="scope-sensitivity" className="text-gray-300 mb-2 block">
                  Scope Sensitivity: {config.scopeSensitivity}
                </Label>
                <Input
                  id="scope-sensitivity"
                  type="number"
                  step="0.01"
                  value={config.scopeSensitivity}
                  onChange={(e) => updateConfig("scopeSensitivity", parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="fov" className="text-gray-300 mb-2 block">
                  FOV: {config.fov}
                </Label>
                <Input
                  id="fov"
                  type="number"
                  value={config.fov}
                  onChange={(e) => updateConfig("fov", parseInt(e.target.value) || 90)}
                  className="w-full bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detection Accuracy */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-400" />
                Detection Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Adjust detection sensitivity</p>
              <p className="text-gray-400 text-sm mb-4">
                Higher values increase accuracy but may reduce performance.
              </p>
              <div className="flex items-center gap-4">
                <Label htmlFor="detection-accuracy-slider" className="text-white text-sm min-w-[60px]">
                  Value: <span className="font-semibold text-[#00ff88]">{detectionAccuracy.toFixed(1)}</span>
                </Label>
                <Slider
                  id="detection-accuracy-slider"
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  value={[detectionAccuracy]}
                  onValueChange={(val) => setDetectionAccuracy(val[0])}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-green-400" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voice-volume" className="text-gray-300 mb-2 block">Voice Volume</Label>
                <Slider
                  id="voice-volume"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[voiceVolume]}
                  onValueChange={(val) => setVoiceVolume(val[0])}
                  className="w-full"
                />
                <span className="text-sm text-gray-400 mt-2 block">Current Volume: {(voiceVolume * 100).toFixed(0)}%</span>
              </div>
              <div>
                <Label htmlFor="voice-selection" className="text-gray-300 mb-2 block">Select Voice</Label>
                <Select value={selectedVoice} onValueChange={(val) => setSelectedVoice(val)}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="John">John</SelectItem>
                    <SelectItem value="Brittney">Brittney</SelectItem>
                    <SelectItem value="Grandpa">Grandpa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Randomness */}
          <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                Randomness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Add human-like variations</p>
              <div className="flex items-center gap-4">
                <Label htmlFor="randomness-slider" className="text-white text-sm min-w-[60px]">
                  Value: <span className="font-semibold text-[#00ff88]">{config.randomness}</span>
                </Label>
                <Slider
                  id="randomness-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[config.randomness]}
                  onValueChange={(val) => updateConfig("randomness", val[0])}
                  className="w-full"
                />
              </div>
              <p className="text-gray-400 text-xs mt-2">
                0 = Perfect accuracy, 100 = Maximum randomness
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hotkeys Section */}
        <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-green-400" />
              Hotkey Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Crouch Key</Label>
                <HotkeySelector
                  value={config.crouchKey}
                  onValueChange={(key) => updateConfig("crouchKey", key)}
                  placeholder="Set key"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Script Toggle</Label>
                <HotkeySelector
                  value={config.scriptToggleKey || ""}
                  onValueChange={(key) => updateConfig("scriptToggleKey", key)}
                  placeholder="Set key"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Auto Detection Toggle</Label>
                <HotkeySelector
                  value={config.autoDetectionToggleKey || ""}
                  onValueChange={(key) => updateConfig("autoDetectionToggleKey", key)}
                  placeholder="Set key"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving Configuration...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Settings className="w-5 h-5 mr-2" />
                Save Configuration
              </div>
            )}
          </Button>
          
          <Button
            onClick={() => router.push(`/dashboard/${licenseKey}/download`)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
          >
            <Key className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>

        {submitMessage && (
          <p className={`text-center mt-4 text-sm ${submitMessage.includes("Error") ? "text-red-400" : "text-green-400"}`}>
            {submitMessage}
          </p>
        )}
      </div>
    </div>
  )
}