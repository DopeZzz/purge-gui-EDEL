"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { KEY_NAME_TO_CODE, keyNameToCode, codeToKeyName } from '@/lib/keycodes'
import {
  WEAPON_NAMES_API,
  WEAPON_DISPLAY_NAMES,
  SCOPE_OPTIONS,
  BARREL_OPTIONS,
  NONE_INTERNAL_VALUE,
  getDisplayWeapon,
  getDisplayScope,
  getDisplayBarrel,
} from '@/lib/options'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { HotkeySelector } from "@/components/hotkey-selector"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import {
  HelpCircle,
  Settings,
  Target,
  Gamepad2,
  Zap,
  Eye,
  Crosshair,
  Radar,
  Wrench,
  Wifi,
  WifiOff,
  Loader2,
  Keyboard,
  Power,
  Download,
  Palette,
  Volume2,
  Mic,
} from "lucide-react"
import {
  submitConfiguration,
  fetchDashboardConfig,
} from "@/app/services/recoil-actions"
import type { RecoilApiPayload } from '@/lib/recoilApi'

type ApiConnectionStatus = "pending" | "connected" | "disconnected"

export default function DashboardPage() {
  const params = useParams()
  const licenseKey = params.license as string
  const { toast } = useToast()

  const [licenseType, setLicenseType] = useState<string | null>(null)
  
  useEffect(() => {
    try {
      const lt = localStorage.getItem('licenseType')
      if (lt) setLicenseType(lt)
    } catch (_) {
      /* ignore */
    }
  }, [])

  const autodetectAllowed = useMemo(() => {
    if (!licenseType) return true
    return !['WEEK', 'TRIAL', 'MONTH', 'LIFETIME'].includes(
      licenseType.toUpperCase()
    )
  }, [licenseType])

  useEffect(() => {
    if (!autodetectAllowed) {
      setAutoDetection(false)
    }
  }, [autodetectAllowed])

  const CODE_ALIAS_MAP: Record<string, string> = {}
  for (const name in KEY_NAME_TO_CODE) {
    if (name.startsWith('Left')) {
      CODE_ALIAS_MAP[name.slice(4) + 'Left'] = name
    } else if (name.startsWith('Right')) {
      CODE_ALIAS_MAP[name.slice(5) + 'Right'] = name
    }
  }

  // Script/Feature states (no longer control connection badge)
  const [autoDetection, setAutoDetection] = useState(true)
  const [scriptEnabled, setScriptEnabled] = useState(false)

  // Configuration states
  // Initialise with the first weapon option. Explicitly type as string so the
  // setter can be used wherever a `(value: string) => void` is expected.
  const [selectedWeapon, setSelectedWeapon] = useState<string>(
    WEAPON_NAMES_API[0]
  )
  const [selectedScope, setSelectedScope] = useState(SCOPE_OPTIONS[0].value)
  const [selectedBarrel, setSelectedBarrel] = useState(BARREL_OPTIONS[0].value)
  const [fov, setFov] = useState([90.0])
  const [sensitivity, setSensitivity] = useState([0.5])
  const [scopeSensitivity, setScopeSensitivity] = useState([0.5])
  const [randomness, setRandomness] = useState([0])

  // UI states
  const [activeTab, setActiveTab] = useState("controls")
  const initialMountRef = useRef(true)
  const [isSendingDebounced, setIsSendingDebounced] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // New API connection status state
  const [apiConnectionStatus, setApiConnectionStatus] = useState<ApiConnectionStatus>("pending")

  // Misc states from original code
  const [detectionAccuracy, setDetectionAccuracy] = useState([0.8])
  const [hipfire, setHipfire] = useState(false)
  const [hipfireKey, setHipfireKey] = useState("")
  const [zoom, setZoom] = useState(false)
  const [zoomKey, setZoomKey] = useState("")
  const [weaponHotkeys, setWeaponHotkeys] = useState<Record<string, string>>({})
  const [scopeHotkeys, setScopeHotkeys] = useState<Record<string, string>>({})
  const [barrelHotkeys, setBarrelHotkeys] = useState<Record<string, string>>({})
  // Default hotkeys for first time users
  const [crouchKey, setCrouchKey] = useState(codeToKeyName(162))
  const [aimKey, setAimKey] = useState(codeToKeyName(2))
  const [scriptToggleKey, setScriptToggleKey] = useState("")
  const [autoDetectToggleKey, setAutoDetectToggleKey] = useState("")
  const [configLoaded, setConfigLoaded] = useState(false)

  const themeOptions = [
    { value: "default", label: "Default", primary: "142 76% 36%", secondary: "203 39% 20%" },
    { value: "sunset", label: "Sunset", primary: "14 90% 50%", secondary: "30 90% 40%" },
    { value: "ocean", label: "Ocean", primary: "198 90% 50%", secondary: "171 80% 40%" },
    { value: "amethyst", label: "Amethyst", primary: "262 52% 47%", secondary: "292 60% 40%" },
    { value: "mono", label: "Mono", primary: "0 0% 50%", secondary: "0 0% 30%" },
  ] as const
  const [selectedTheme, setSelectedTheme] = useState<string>(themeOptions[0].value)

  const voiceOptions = ["Brittany Voice", "Grandpa Voice", "Matt Voice"] as const
  const [selectedVoice, setSelectedVoice] = useState<string>(voiceOptions[0])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voicesEnabled, setVoicesEnabled] = useState(false)
  const [voiceVolume, setVoiceVolume] = useState([100])

  const applyTheme = useCallback(
    (themeValue: string) => {
      const t = themeOptions.find((th) => th.value === themeValue)
      if (t) {
        document.documentElement.style.setProperty("--primary", t.primary)
        document.documentElement.style.setProperty("--secondary", t.secondary)
      }
    },
    [themeOptions],
  )

  useEffect(() => {
    applyTheme(selectedTheme)
  }, [selectedTheme, applyTheme])

  const playToggleFeedback = useCallback(
    (isOn: boolean) => {
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.value = isOn ? 880 : 220
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.15)
        } catch (_) {
          /* ignore */
        }
      }
      if (voicesEnabled) {
        const utter = new SpeechSynthesisUtterance(isOn ? "On" : "Off")
        const match = speechSynthesis
          .getVoices()
          .find((v) => v.name.toLowerCase().includes(selectedVoice.split(" ")[0].toLowerCase()))
        if (match) utter.voice = match
        utter.volume = voiceVolume[0] / 100
        speechSynthesis.speak(utter)
      }
    },
    [soundEnabled, voicesEnabled, selectedVoice, voiceVolume],
  )

  const handleScriptEnabledChange = useCallback(
    (val: boolean) => {
      setScriptEnabled(val)
      playToggleFeedback(val)
    },
    [playToggleFeedback],
  )


  // Load saved configuration on initial mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!licenseKey) {
        setConfigLoaded(true)
        return
      }
      const cfg = await fetchDashboardConfig(licenseKey)
      if (!cfg) {
        setConfigLoaded(true)
        return
      }
      if (cfg.weapon) setSelectedWeapon(cfg.weapon)
      if (cfg.scope) {
        const sc = SCOPE_OPTIONS.find((s) => s.apiValue === cfg.scope)
        if (sc) setSelectedScope(sc.value)
      }
      if (cfg.barrel) {
        const br = BARREL_OPTIONS.find((b) => b.apiValue === cfg.barrel)
        if (br) setSelectedBarrel(br.value)
      }
      if (typeof cfg.fov === 'number') setFov([cfg.fov])
      if (typeof cfg.sens === 'number') setSensitivity([cfg.sens])
      if (typeof cfg.imsens === 'number') setScopeSensitivity([cfg.imsens])
      if (typeof cfg.randomness === 'number') setRandomness([cfg.randomness])
      if (typeof cfg.crouch_key === 'number') setCrouchKey(codeToKeyName(cfg.crouch_key))
      if (typeof cfg.aim_key === 'number') setAimKey(codeToKeyName(cfg.aim_key))
      if (typeof cfg.detection_accuracy === 'number') setDetectionAccuracy([cfg.detection_accuracy])
      if (cfg.weapon_hotkeys && typeof cfg.weapon_hotkeys === 'object') {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.weapon_hotkeys as Record<string, number>)) {
          if (typeof v === 'number') map[k] = codeToKeyName(v)
        }
        setWeaponHotkeys(map)
      }
      if (cfg.scope_hotkeys && typeof cfg.scope_hotkeys === 'object') {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.scope_hotkeys as Record<string, number>)) {
          if (typeof v === 'number') map[k] = codeToKeyName(v)
        }
        setScopeHotkeys(map)
      }
      if (cfg.barrel_hotkeys && typeof cfg.barrel_hotkeys === 'object') {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.barrel_hotkeys as Record<string, number>)) {
          if (typeof v === 'number') map[k] = codeToKeyName(v)
        }
        setBarrelHotkeys(map)
      }
      if (typeof cfg.hipfire === 'boolean') setHipfire(cfg.hipfire)
      if (typeof cfg.hipfire_key === 'number') setHipfireKey(codeToKeyName(cfg.hipfire_key))
      if (typeof cfg.zoom === 'boolean') setZoom(cfg.zoom)
      if (typeof cfg.zoom_key === 'number') setZoomKey(codeToKeyName(cfg.zoom_key))
      if (typeof cfg.auto_detection === 'boolean') setAutoDetection(cfg.auto_detection)
      if (typeof cfg.script_on === 'boolean') handleScriptEnabledChange(cfg.script_on)
      if (typeof cfg.script_toggle_key === 'number')
        setScriptToggleKey(codeToKeyName(cfg.script_toggle_key))
      if (typeof cfg.auto_detection_toggle_key === 'number')
        setAutoDetectToggleKey(codeToKeyName(cfg.auto_detection_toggle_key))
      setConfigLoaded(true)
    }
    loadConfig()
  }, [licenseKey])

  const getCurrentPayload = useCallback((): RecoilApiPayload => {
    const convertMap = (map: Record<string, string>): Record<string, number> => {
      const out: Record<string, number> = {}
      for (const [k, v] of Object.entries(map)) {
        const code = keyNameToCode(v)
        if (code != null) out[k] = code
      }
      return out
    }
    return {
      serial: licenseKey,
      weapon: selectedWeapon,
      scope: SCOPE_OPTIONS.find((opt) => opt.value === selectedScope)?.apiValue ?? "",
      barrel: BARREL_OPTIONS.find((opt) => opt.value === selectedBarrel)?.apiValue ?? "",
      fov: fov[0],
      sens: sensitivity[0],
      imsens: scopeSensitivity[0],
      randomness: randomness[0],
      crouch_key: keyNameToCode(crouchKey) ?? 162,
      aim_key: keyNameToCode(aimKey) ?? 2,
      detection_accuracy: detectionAccuracy[0],
      hipfire,
      hipfire_key: keyNameToCode(hipfireKey) ?? undefined,
      zoom: zoom,
      zoom_key: zoom ? keyNameToCode(zoomKey) ?? 0 : undefined,
      weapon_hotkeys: convertMap(weaponHotkeys),
      scope_hotkeys: convertMap(scopeHotkeys),
      barrel_hotkeys: convertMap(barrelHotkeys),
      script_toggle_key: keyNameToCode(scriptToggleKey) ?? undefined,
      auto_detection_toggle_key: keyNameToCode(autoDetectToggleKey) ?? undefined,
      auto_detection: autoDetection,
      script_on: scriptEnabled,
    }
  }, [
    licenseKey,
    selectedWeapon,
    selectedScope,
    selectedBarrel,
    fov,
    sensitivity,
    scopeSensitivity,
    randomness,
    crouchKey,
    aimKey,
    detectionAccuracy,
    hipfire,
    hipfireKey,
    zoom,
    zoomKey,
    weaponHotkeys,
    scopeHotkeys,
    barrelHotkeys,
    scriptToggleKey,
    autoDetectToggleKey,
    autoDetection,
    scriptEnabled,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      let key = event.code
      if (!KEY_NAME_TO_CODE[key] && CODE_ALIAS_MAP[key]) {
        key = CODE_ALIAS_MAP[key]
      }
      if (scriptToggleKey && key === scriptToggleKey) {
        event.preventDefault()
        handleScriptEnabledChange(!scriptEnabled)
      }
      if (autoDetectToggleKey && key === autoDetectToggleKey) {
        event.preventDefault()
        setAutoDetection((p) => !p)
      }
      if (hipfireKey && key === hipfireKey) {
        event.preventDefault()
        setHipfire((p) => !p)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [scriptToggleKey, autoDetectToggleKey, hipfireKey, scriptEnabled, handleScriptEnabledChange])

  const checkApiConnection = useCallback(
    async (isSilent = false) => {
      if (!licenseKey) {
        setApiConnectionStatus("disconnected")
        return
      }
      if (!isSilent) {
        setApiConnectionStatus("pending")
      }

      const payload = { ...getCurrentPayload(), save_config: false }
      // console.log("Checking API connection with payload:", payload);
      try {
        const result = await submitConfiguration(payload)
        if (result.success) {
          setApiConnectionStatus("connected")
          if (!isSilent) {
            // console.log("API Connection Check: Connected");
          }
        } else {
          setApiConnectionStatus("disconnected")
          if (!isSilent) {
            console.error("API Connection Check: Disconnected -", result.error)
            // toast({ title: "API Connection Issue", description: result.error || "Failed to connect to API.", variant: "destructive" });
          }
        }
      } catch (error) {
        setApiConnectionStatus("disconnected")
        if (!isSilent) {
          console.error("API Connection Check: Failed -", error)
          // toast({ title: "API Connection Error", description: "Network error during connection check.", variant: "destructive" });
        }
      }
    },
    [licenseKey, getCurrentPayload, toast],
  )

  const handleSendConfiguration = useCallback(async () => {
    const payload = { ...getCurrentPayload(), save_config: true }
    // console.log("Auto-sending configuration:", payload);
    const result = await submitConfiguration(payload)
    if (result.success) {
      setApiConnectionStatus("connected")
      toast({
        title: "Configuration Updated!",
        description: "Parameters sent and pattern generated.",
        variant: "default",
      })
    } else {
      setApiConnectionStatus("disconnected")
      toast({
        title: "Error Updating Configuration",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      })
    }
  }, [getCurrentPayload, toast])

  const handleProgramConnected = useCallback(() => {
    handleSendConfiguration();
  }, [handleSendConfiguration])

  const realtimeHandlers = useMemo(
    () => ({
      setSelectedWeapon,
      setSelectedScope,
      setSelectedBarrel,
      onProgramConnected: handleProgramConnected,
      handleScriptEnabledChange,
      setAutoDetection,
      setHipfire,
    }),
    [
      setSelectedWeapon,
      setSelectedScope,
      setSelectedBarrel,
      handleProgramConnected,
      handleScriptEnabledChange,
      setAutoDetection,
      setHipfire,
    ]
  )

  useRealtimeUpdates(licenseKey, realtimeHandlers)

  const hasCheckedRef = useRef(false)
  useEffect(() => {
    if (!licenseKey || !configLoaded || hasCheckedRef.current) return
    hasCheckedRef.current = true
    const intervalId = setInterval(() => checkApiConnection(true), 5 * 60 * 1000) // 5 minutes, silent check
    return () => clearInterval(intervalId)
  }, [licenseKey, checkApiConnection, configLoaded])

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      return
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    setIsSendingDebounced(true)
    debounceTimeoutRef.current = setTimeout(async () => {
      await handleSendConfiguration()
      setIsSendingDebounced(false)
    }, 1000)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [
    selectedWeapon,
    selectedScope,
    selectedBarrel,
    fov,
    sensitivity,
    scopeSensitivity,
    crouchKey,
    aimKey,
    weaponHotkeys,
    scopeHotkeys,
    barrelHotkeys,
    detectionAccuracy,
    hipfire,
    hipfireKey,
    zoom,
    zoomKey,
    scriptToggleKey,
    autoDetectToggleKey,
    autoDetection,
    scriptEnabled,
    handleSendConfiguration,
  ])

  const getStatusColor = () => {
    if (apiConnectionStatus === "connected") return "text-green-400 border-green-400"
    if (apiConnectionStatus === "pending") return "text-yellow-400 border-yellow-400"
    return "text-red-400 border-red-400"
  }

  const getStatusText = () => {
    if (apiConnectionStatus === "connected") return "Active & Connected"
    if (apiConnectionStatus === "pending") return "Checking..."
    return "Disconnected"
  }

  const getStatusIcon = () => {
    if (apiConnectionStatus === "connected") return <Wifi className="w-4 h-4 mr-2" />
    if (apiConnectionStatus === "pending") return <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    return <WifiOff className="w-4 h-4 mr-2" />
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="/images/purge-logo.png" alt="PURGE Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Purge 2.0
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Rust Cloud Scripting - License: <span className="font-bold text-green-400">{licenseKey}</span>
            {isSendingDebounced && <span className="ml-2 text-sm text-yellow-400">(Saving...)</span>}
          </p>
          <Badge variant="outline" className={`text-lg px-4 py-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            API Connection: {getStatusText()}
          </Badge>
        </div>
        <div className="flex justify-center gap-4 mb-12">
          <Button
            variant="outline"
            asChild
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 rounded-lg transition-all duration-200"
          >
            <a href="/docs">
              <HelpCircle className="w-5 h-5 mr-2" />
              How to use?
            </a>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 rounded-lg transition-all duration-200"
          >
            <a href={`/dashboard/${licenseKey}/download`}>
              <Download className="w-5 h-5 mr-2" />
              Download
            </a>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Script ON / OFF</p>
                </div>
                <Switch
                  checked={scriptEnabled}
                  onCheckedChange={handleScriptEnabledChange}
                  className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-red-500/80"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Auto Detection</p>
                </div>
                <Switch
                  checked={autoDetection}
                  onCheckedChange={setAutoDetection}
                  disabled={!autodetectAllowed}
                  className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-red-500/80"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Weapon Selected</p>
                  <p className="text-lg font-semibold text-green-400">{getDisplayWeapon(selectedWeapon)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Scope Selected</p>
                  <p className="text-lg font-semibold text-blue-400">{getDisplayScope(selectedScope)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Barrel Selected</p>
                  <p className="text-lg font-semibold text-purple-400">{getDisplayBarrel(selectedBarrel)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger
              value="controls"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Crosshair className="w-4 h-4 mr-2" />
              Selections
            </TabsTrigger>
            <TabsTrigger
              value="keybinds"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Keybinds
            </TabsTrigger>
            {autodetectAllowed && (
              <TabsTrigger
                value="autodetect"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Radar className="w-4 h-4 mr-2" />
                Autodetect
              </TabsTrigger>
            )}
            <TabsTrigger
              value="miscellaneous"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Miscellaneous
            </TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-green-400 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Aim Settings
                    <Badge variant="outline" className="ml-auto text-xs border-green-400/50 text-green-400/80">
                      Precision
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sensitivity</span>
                      <Badge variant="secondary" className="text-green-400 bg-green-900/50 border-green-400/30">
                        {sensitivity[0].toFixed(2)}
                      </Badge>
                    </div>
                    <Slider
                      value={sensitivity}
                      onValueChange={setSensitivity}
                      min={0.1}
                      max={2.0}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Mouse sensitivity multiplier</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Scope Sensitivity</span>
                      <Badge variant="secondary" className="text-green-400 bg-green-900/50 border-green-400/30">
                        {scopeSensitivity[0].toFixed(2)}
                      </Badge>
                    </div>
                    <Slider
                      value={scopeSensitivity}
                      onValueChange={setScopeSensitivity}
                      min={0.1}
                      max={2.0}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Sensitivity when scoped</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-green-400 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    General Settings
                    <Badge variant="outline" className="ml-auto text-xs border-green-400/50 text-green-400/80">
                      Core
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">FOV</span>
                      <Badge variant="secondary" className="text-green-400 bg-green-900/50 border-green-400/30">
                        {fov[0]}°
                      </Badge>
                    </div>
                    <Slider value={fov} onValueChange={setFov} min={60} max={90} step={0.1} className="w-full" />
                    <p className="text-xs text-gray-500">Field of view setting</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Randomness</span>
                      <Badge variant="secondary" className="text-green-400 bg-green-900/50 border-green-400/30">
                        {randomness[0]}%
                      </Badge>
                    </div>
                    <Slider value={randomness} onValueChange={setRandomness} max={100} step={1} className="w-full" />
                    <p className="text-xs text-gray-500">Adds natural variation</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="equipment" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Weapon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-12">
                      <SelectValue placeholder="Choose weapon" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 max-h-60 text-white">
                      {WEAPON_NAMES_API.map((weapon, idx) => (
                        <SelectItem
                          key={weapon}
                          value={weapon}
                          className="text-white focus:bg-gray-700 focus:text-white"
                        >
                          {WEAPON_DISPLAY_NAMES[idx]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">Primary weapon selection</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Scope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedScope} onValueChange={setSelectedScope}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-12">
                      <SelectValue placeholder="Choose scope" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {SCOPE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-white focus:bg-gray-700 focus:text-white"
                        >
                          {option.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">Optic attachment</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Barrel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedBarrel} onValueChange={setSelectedBarrel}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-12">
                      <SelectValue placeholder="Choose barrel" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {BARREL_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-white focus:bg-gray-700 focus:text-white"
                        >
                          {option.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">Barrel attachment</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="keybinds" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2 w-full">
                  <CardTitle className="text-green-400 flex items-center">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Crouch Key
                  </CardTitle>
                  <HotkeySelector
                    value={crouchKey}
                    onValueChange={setCrouchKey}
                    placeholder="Click to set crouch key"
                  />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500">Select the key you use to crouch in game</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2 w-full">
                  <CardTitle className="text-green-400 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Aim Key
                  </CardTitle>
                  <HotkeySelector
                    value={aimKey}
                    onValueChange={setAimKey}
                    placeholder="Click to set aim key"
                  />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500">Select the key you use to aim in game</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2 w-full">
                  <CardTitle className="text-green-400 flex items-center">
                    <Power className="w-5 h-5 mr-2" />
                    Script ON / OFF
                  </CardTitle>
                  <HotkeySelector
                    value={scriptToggleKey}
                    onValueChange={setScriptToggleKey}
                    placeholder="Set toggle key"
                  />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500">Select the key to turn the script on or off</p>
                </CardContent>
              </Card>
              {autodetectAllowed && (
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2 w-full">
                    <CardTitle className="text-green-400 flex items-center">
                      <Radar className="w-5 h-5 mr-2" />
                      Auto Detect
                    </CardTitle>
                    <HotkeySelector
                      value={autoDetectToggleKey}
                      onValueChange={setAutoDetectToggleKey}
                      placeholder="Set toggle key"
                    />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-500">Select the key to enable or disable auto detection</p>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Keyboard className="w-5 h-5 mr-2" />
                    Weapon Binds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-x-12">
                    {WEAPON_NAMES_API.map((weapon, idx) => (
                      <div key={weapon} className="flex items-center justify-between space-x-2">
                        <span>{WEAPON_DISPLAY_NAMES[idx]}</span>
                        <HotkeySelector
                          value={weaponHotkeys[weapon] || ""}
                          onValueChange={(k) =>
                            setWeaponHotkeys((p) => ({ ...p, [weapon]: k }))
                          }
                          placeholder="Set hotkey"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Keyboard className="w-5 h-5 mr-2" />
                    Scope Binds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SCOPE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center justify-between space-x-2">
                      <span>{opt.display}</span>
                      <HotkeySelector
                        value={scopeHotkeys[opt.value] || ""}
                        onValueChange={(k) =>
                          setScopeHotkeys((p) => ({ ...p, [opt.value]: k }))
                        }
                        placeholder="Set hotkey"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Keyboard className="w-5 h-5 mr-2" />
                    Barrel Binds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {BARREL_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center justify-between space-x-2">
                      <span>{opt.display}</span>
                      <HotkeySelector
                        value={barrelHotkeys[opt.value] || ""}
                        onValueChange={(k) =>
                          setBarrelHotkeys((p) => ({ ...p, [opt.value]: k }))
                        }
                        placeholder="Set hotkey"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {autodetectAllowed && (
            <TabsContent value="autodetect" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center">
                      <Radar className="w-5 h-5 mr-2" />
                      Detection Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Accuracy</span>
                      <Badge variant="secondary" className="text-green-400 bg-green-900/50 border-green-400/30">
                        {detectionAccuracy[0].toFixed(1)}
                      </Badge>
                    </div>
                    <Slider
                      value={detectionAccuracy}
                      onValueChange={setDetectionAccuracy}
                      min={0.1}
                      max={0.9}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Detection precision level</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          <TabsContent value="miscellaneous" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Hipfire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Enable Hipfire</p>
                      <p className="text-xs text-gray-500">Activate to fire from the hip and cursor check.</p>
                    </div>
                    <Switch
                      checked={hipfire}
                      onCheckedChange={setHipfire}
                      className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  {hipfire && (
                    <div className="space-y-2">
                      <HotkeySelector value={hipfireKey} onValueChange={setHipfireKey} placeholder="Set hotkey" />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Zoom
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Enable Zoom</p>
                      <p className="text-xs text-gray-500">To activate the Zoom assign a hotkey.</p>
                    </div>
                    <Switch
                      checked={zoom}
                      onCheckedChange={setZoom}
                      className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  {zoom && (
                    <div className="space-y-2">
                      <HotkeySelector
                        value={zoomKey}
                        onValueChange={setZoomKey}
                        placeholder="Set hotkey"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Theme Selector
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-12">
                      <SelectValue placeholder="Choose theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {themeOptions.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-white focus:bg-gray-700 focus:text-white"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 mt-6">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Volume2 className="w-5 h-5 mr-2" />
                    Audio Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Sound Effects</p>
                      <p className="text-xs text-gray-500">Play sound on toggle</p>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                      className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Weapon Voices</p>
                      <p className="text-xs text-gray-500">Speak toggle state</p>
                    </div>
                    <Switch
                      checked={voicesEnabled}
                      onCheckedChange={setVoicesEnabled}
                      className="data-[state=checked]:bg-green-500/80 data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white h-12">
                        <SelectValue placeholder="Choose voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 text-white">
                        {voiceOptions.map((v) => (
                          <SelectItem
                            key={v}
                            value={v}
                            className="text-white focus:bg-gray-700 focus:text-white"
                          >
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Slider
                      value={voiceVolume}
                      onValueChange={setVoiceVolume}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
