"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HotkeySelector } from "@/components/hotkey-selector"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import { submitConfiguration, fetchDashboardConfig, type DashboardConfig } from "@/app/services/recoil-actions"
import type { RecoilApiPayload } from "@/lib/recoilApi"
import { keyNameToCode } from "@/lib/keycodes"
import { 
  WEAPON_NAMES_API, 
  WEAPON_DISPLAY_NAMES, 
  SCOPE_OPTIONS, 
  BARREL_OPTIONS,
  NONE_INTERNAL_VALUE,
  getDisplayWeapon,
  getDisplayScope,
  getDisplayBarrel
} from "@/lib/options"
import { 
  Settings, 
  Target, 
  Keyboard, 
  Eye, 
  Crosshair, 
  Zap, 
  Volume2, 
  Palette,
  Download,
  FileText,
  ExternalLink
} from "lucide-react"

export default function DashboardPage() {
  const params = useParams()
  const licenseKey = params.license as string
  const { toast } = useToast()

  // Core settings
  const [selectedWeapon, setSelectedWeapon] = useState("noneweapon")
  const [selectedScope, setSelectedScope] = useState("__NONE__")
  const [selectedBarrel, setSelectedBarrel] = useState("__NONE__")
  const [fov, setFov] = useState([90])
  const [sensitivity, setSensitivity] = useState([0.28])
  const [scopeSensitivity, setScopeSensitivity] = useState([1.0])
  const [crouchKey, setCrouchKey] = useState("LeftControl")
  const [aimKey, setAimKey] = useState("MouseRight")
  
  // Advanced settings
  const [detectionAccuracy, setDetectionAccuracy] = useState([85])
  const [hipfire, setHipfire] = useState(false)
  const [hipfireKey, setHipfireKey] = useState("MouseLeft")
  const [zoom, setZoom] = useState(false)
  const [zoomKey, setZoomKey] = useState("MouseMiddle")
  const [autoDetection, setAutoDetection] = useState(true)
  const [scriptEnabled, setScriptEnabled] = useState(true)
  const [scriptToggleKey, setScriptToggleKey] = useState("F1")
  const [autoDetectionToggleKey, setAutoDetectionToggleKey] = useState("F2")
  const [randomness, setRandomness] = useState([50])
  const [saveConfig, setSaveConfig] = useState(true)

  // Audio settings
  const [soundEffects, setSoundEffects] = useState(true)
  const [voiceFeedback, setVoiceFeedback] = useState(false)
  const [volume, setVolume] = useState([75])

  // Theme settings
  const [selectedTheme, setSelectedTheme] = useState("Default")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchDashboardConfig(licenseKey)
        if (config) {
          setSelectedWeapon(config.weapon || "noneweapon")
          setSelectedScope(config.scope || "__NONE__")
          setSelectedBarrel(config.barrel || "__NONE__")
          setFov([config.fov || 90])
          setSensitivity([config.sens || 0.28])
          setScopeSensitivity([config.imsens || 1.0])
          setCrouchKey(config.crouch_key ? String(config.crouch_key) : "LeftControl")
          setAimKey(config.aim_key ? String(config.aim_key) : "MouseRight")
          setDetectionAccuracy([config.detection_accuracy || 85])
          setHipfire(config.hipfire || false)
          setHipfireKey(config.hipfire_key ? String(config.hipfire_key) : "MouseLeft")
          setZoom(config.zoom || false)
          setZoomKey(config.zoom_key ? String(config.zoom_key) : "MouseMiddle")
          setAutoDetection(config.auto_detection !== false)
          setScriptEnabled(config.script_on !== false)
          setScriptToggleKey(config.script_toggle_key ? String(config.script_toggle_key) : "F1")
          setAutoDetectionToggleKey(config.auto_detection_toggle_key ? String(config.auto_detection_toggle_key) : "F2")
          setRandomness([config.randomness || 50])
          setSaveConfig(config.save_config !== false)
        }
        setConnectionStatus("connected")
      } catch (error) {
        console.error("Failed to load config:", error)
        setConnectionStatus("disconnected")
      }
    }

    if (licenseKey) {
      loadConfig()
    }
  }, [licenseKey])

  // Real-time updates
  useRealtimeUpdates(licenseKey, {
    setSelectedWeapon,
    setSelectedScope,
    setSelectedBarrel,
    onProgramConnected: () => {
      setConnectionStatus("connected")
      toast({
        title: "Program Connected",
        description: "Purge 2.0 client has connected successfully.",
      })
    },
    setScriptEnabled,
    setAutoDetection,
    setHipfire,
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const payload: RecoilApiPayload = {
        serial: licenseKey,
        weapon: selectedWeapon,
        scope: selectedScope,
        barrel: selectedBarrel,
        fov: fov[0],
        sens: sensitivity[0],
        imsens: scopeSensitivity[0],
        crouch_key: keyNameToCode(crouchKey) || 17,
        aim_key: keyNameToCode(aimKey) || 2,
        detection_accuracy: detectionAccuracy[0],
        hipfire,
        hipfire_key: hipfire ? keyNameToCode(hipfireKey) || 1 : undefined,
        zoom,
        zoom_key: zoom ? keyNameToCode(zoomKey) || 4 : undefined,
        auto_detection: autoDetection,
        script_on: scriptEnabled,
        script_toggle_key: keyNameToCode(scriptToggleKey) || 112,
        auto_detection_toggle_key: keyNameToCode(autoDetectionToggleKey) || 113,
        randomness: randomness[0],
        save_config: saveConfig,
      }

      const result = await submitConfiguration(payload)
      
      if (result.success) {
        setLastSaved(new Date())
        toast({
          title: "Configuration Saved",
          description: "Your settings have been applied successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to save configuration")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-500"
      case "disconnected": return "bg-red-500"
      case "connecting": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected": return "Connected"
      case "disconnected": return "Disconnected"
      case "connecting": return "Connecting..."
      default: return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="/images/purge-logo.png" alt="PURGE Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Purge 2.0 Dashboard
          </h1>
          <p className="text-gray-400 mb-6">Advanced Rust Cloud Scripting Configuration</p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-gray-300">{getConnectionStatusText()}</span>
            </div>
            {lastSaved && (
              <div className="text-sm text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={() => window.open('/docs', '_blank')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </Button>
            <Button
              onClick={() => window.open(`/dashboard/${licenseKey}/download`, '_blank')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Client
            </Button>
            <Button
              onClick={() => window.open('https://discord.gg/purge', '_blank')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Discord Support
            </Button>
          </div>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900/50 border border-gray-700/50">
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="selections" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Target className="w-4 h-4 mr-2" />
              Selections
            </TabsTrigger>
            <TabsTrigger value="keybinds" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Keyboard className="w-4 h-4 mr-2" />
              Keybinds
            </TabsTrigger>
            <TabsTrigger value="autodetect" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Eye className="w-4 h-4 mr-2" />
              Autodetect
            </TabsTrigger>
            <TabsTrigger value="miscellaneous" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Zap className="w-4 h-4 mr-2" />
              Miscellaneous
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Crosshair className="w-5 h-5" />
                    Aim Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sensitivity: {sensitivity[0].toFixed(2)}
                    </label>
                    <Slider
                      value={sensitivity}
                      onValueChange={setSensitivity}
                      min={0.1}
                      max={2.0}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mouse sensitivity multiplier</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scope Sensitivity: {scopeSensitivity[0].toFixed(2)}
                    </label>
                    <Slider
                      value={scopeSensitivity}
                      onValueChange={setScopeSensitivity}
                      min={0.1}
                      max={3.0}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sensitivity when using scoped weapons</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Field of View: {fov[0]}°
                    </label>
                    <Slider
                      value={fov}
                      onValueChange={setFov}
                      min={60}
                      max={120}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must match your in-game FOV setting</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Settings className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Randomness: {randomness[0]}%
                    </label>
                    <Slider
                      value={randomness}
                      onValueChange={setRandomness}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Adds natural variation to movement patterns</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Script Enabled</label>
                      <p className="text-xs text-gray-500">Enable or disable the entire script</p>
                    </div>
                    <Switch
                      checked={scriptEnabled}
                      onCheckedChange={setScriptEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Save Configuration</label>
                      <p className="text-xs text-gray-500">Automatically save settings to server</p>
                    </div>
                    <Switch
                      checked={saveConfig}
                      onCheckedChange={setSaveConfig}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="selections" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Target className="w-5 h-5" />
                    Weapon Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select weapon" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {WEAPON_NAMES_API.map((weapon, index) => (
                        <SelectItem key={weapon} value={weapon} className="text-white hover:bg-gray-700">
                          {WEAPON_DISPLAY_NAMES[index]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong>Selected:</strong> {getDisplayWeapon(selectedWeapon)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Eye className="w-5 h-5" />
                    Scope Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedScope} onValueChange={setSelectedScope}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {SCOPE_OPTIONS.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value} className="text-white hover:bg-gray-700">
                          {scope.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong>Selected:</strong> {getDisplayScope(selectedScope)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Settings className="w-5 h-5" />
                    Barrel Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedBarrel} onValueChange={setSelectedBarrel}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select barrel" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {BARREL_OPTIONS.map((barrel) => (
                        <SelectItem key={barrel.value} value={barrel.value} className="text-white hover:bg-gray-700">
                          {barrel.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong>Selected:</strong> {getDisplayBarrel(selectedBarrel)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keybinds" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Keyboard className="w-5 h-5" />
                    Core Keybinds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Crouch Key</label>
                      <p className="text-xs text-gray-500">Key used for crouching</p>
                    </div>
                    <HotkeySelector
                      value={crouchKey}
                      onValueChange={setCrouchKey}
                      placeholder="Set crouch key"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Aim Key</label>
                      <p className="text-xs text-gray-500">Key used for aiming</p>
                    </div>
                    <HotkeySelector
                      value={aimKey}
                      onValueChange={setAimKey}
                      placeholder="Set aim key"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Script Toggle</label>
                      <p className="text-xs text-gray-500">Toggle script on/off</p>
                    </div>
                    <HotkeySelector
                      value={scriptToggleKey}
                      onValueChange={setScriptToggleKey}
                      placeholder="Set toggle key"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Auto Detection Toggle</label>
                      <p className="text-xs text-gray-500">Toggle auto detection</p>
                    </div>
                    <HotkeySelector
                      value={autoDetectionToggleKey}
                      onValueChange={setAutoDetectionToggleKey}
                      placeholder="Set detection key"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Target className="w-5 h-5" />
                    Feature Keybinds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hipfire && (
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Hipfire Key</label>
                        <p className="text-xs text-gray-500">Key for hipfire mode</p>
                      </div>
                      <HotkeySelector
                        value={hipfireKey}
                        onValueChange={setHipfireKey}
                        placeholder="Set hipfire key"
                      />
                    </div>
                  )}

                  {zoom && (
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Zoom Key</label>
                        <p className="text-xs text-gray-500">Key for zoom mode</p>
                      </div>
                      <HotkeySelector
                        value={zoomKey}
                        onValueChange={setZoomKey}
                        placeholder="Set zoom key"
                      />
                    </div>
                  )}

                  {!hipfire && !zoom && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Enable Hipfire or Zoom in Miscellaneous tab to configure their keybinds</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="autodetect" className="space-y-8">
            <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Eye className="w-5 h-5" />
                  Auto Detection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Enable Auto Detection</label>
                    <p className="text-xs text-gray-500">Automatically detect equipped weapons</p>
                  </div>
                  <Switch
                    checked={autoDetection}
                    onCheckedChange={setAutoDetection}
                  />
                </div>

                {autoDetection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Detection Accuracy: {detectionAccuracy[0]}%
                    </label>
                    <Slider
                      value={detectionAccuracy}
                      onValueChange={setDetectionAccuracy}
                      min={50}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher values reduce false positives but may miss some weapons</p>
                  </div>
                )}

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={autoDetection ? "default" : "secondary"}>
                      {autoDetection ? "Active" : "Disabled"}
                    </Badge>
                    {autoDetection && (
                      <span className="text-xs text-gray-500">
                        Monitoring for weapon changes...
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="miscellaneous" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Hipfire Card */}
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <Crosshair className="w-5 h-5" />
                      Hipfire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Enable Hipfire</label>
                        <p className="text-xs text-gray-300 mt-1">Activate to fire from the hip and cursor check.</p>
                      </div>
                      <Switch
                        checked={hipfire}
                        onCheckedChange={setHipfire}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Settings Card */}
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <Volume2 className="w-5 h-5" />
                      Audio Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Sound Effects</label>
                        <p className="text-xs text-gray-300 mt-1">Play sound on toggle</p>
                      </div>
                      <Switch
                        checked={soundEffects}
                        onCheckedChange={setSoundEffects}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Voice Feedback</label>
                        <p className="text-xs text-gray-300 mt-1">Enable voice announcements</p>
                      </div>
                      <Switch
                        checked={voiceFeedback}
                        onCheckedChange={setVoiceFeedback}
                      />
                    </div>

                    {(soundEffects || voiceFeedback) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Volume: {volume[0]}%
                        </label>
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Audio volume level</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Zoom Card */}
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <Eye className="w-5 h-5" />
                      Zoom
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Enable Zoom</label>
                        <p className="text-xs text-gray-300 mt-1">To activate the Zoom assign a hotkey.</p>
                      </div>
                      <Switch
                        checked={zoom}
                        onCheckedChange={setZoom}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Selector Card */}
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <Palette className="w-5 h-5" />
                      Theme Selector
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Select a theme to customize the interface.</label>
                      <p className="text-xs text-gray-300 mt-1 mb-4">Your choice will apply immediately.</p>
                      <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="Default" className="text-white hover:bg-gray-700">Default</SelectItem>
                          <SelectItem value="Dark" className="text-white hover:bg-gray-700">Dark</SelectItem>
                          <SelectItem value="Blue" className="text-white hover:bg-gray-700">Blue</SelectItem>
                          <SelectItem value="Green" className="text-white hover:bg-gray-700">Green</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || connectionStatus !== "connected"}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving Configuration...
              </div>
            ) : (
              "Save Configuration"
            )}
          </Button>
          
          {connectionStatus !== "connected" && (
            <p className="text-sm text-red-400 mt-2">
              Cannot save: Client not connected
            </p>
          )}
        </div>
      </div>
    </div>
  )
}