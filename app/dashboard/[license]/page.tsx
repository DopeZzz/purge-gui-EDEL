"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { KEY_NAME_TO_CODE, keyNameToCode, codeToKeyName } from "@/lib/keycodes"
import {
  WEAPON_NAMES_API,
  WEAPON_DISPLAY_NAMES,
  SCOPE_OPTIONS,
  BARREL_OPTIONS,
  getDisplayWeapon,
  getDisplayScope,
  getDisplayBarrel,
} from "@/lib/options"
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
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
  Keyboard,
  Palette,
  Power,
  Download,
  Volume2,
  Wrench,
} from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ThemeSelector } from "@/components/theme-selector"
import { submitConfiguration, fetchDashboardConfig } from "@/app/services/recoil-actions"
import type { RecoilApiPayload } from "@/lib/recoilApi"

type ApiConnectionStatus = "pending" | "connected" | "disconnected"

export default function DashboardPage() {
  const params = useParams()
  const licenseKey = params.license as string
  const { toast } = useToast()
  const [licenseType, setLicenseType] = useState<string | null>(null)

  useEffect(() => {
    try {
      const lt = localStorage.getItem("licenseType")
      if (lt) setLicenseType(lt)
    } catch (_) {
      /* ignore */
    }
  }, [])

  const autodetectAllowed = useMemo(() => {
    if (!licenseType) return true
    return !["WEEK", "TRIAL", "MONTH", "LIFETIME"].includes(licenseType.toUpperCase())
  }, [licenseType])

  useEffect(() => {
    if (!autodetectAllowed) {
      setAutoDetection(false)
    }
  }, [autodetectAllowed])

  const CODE_ALIAS_MAP: Record<string, string> = {}
  for (const name in KEY_NAME_TO_CODE) {
    if (name.startsWith("Left")) {
      CODE_ALIAS_MAP[name.slice(4) + "Left"] = name
    } else if (name.startsWith("Right")) {
      CODE_ALIAS_MAP[name.slice(5) + "Right"] = name
    }
  }

  // Script/Feature states (no longer control connection badge)
  const [autoDetection, setAutoDetection] = useState(true)
  const [scriptEnabled, setScriptEnabled] = useState(false)

  // Configuration states
  // Initialise with the first weapon option. Explicitly type as string so the
  // setter can be used wherever a `(value: string) => void` is expected.
  const [selectedWeapon, setSelectedWeapon] = useState<string>(WEAPON_NAMES_API[0])
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
  const API_COLORS = {
    connected: "#22c55e", // verde  (green‑500)
    pending: "#facc15", // amarillo (yellow‑400)
    disconnected: "#ef4444", // rojo   (red‑500)
  } as const

  // Misc states from original code
  const [detectionAccuracy, setDetectionAccuracy] = useState([0.8])
  const [hipfire, setHipfire] = useState(false)

  // Función para reproducir audio de voz
  const playWeaponVoice = async (weaponName: string) => {
    if (!selectedVoice || weaponName === "__NONE__") return

    // Mapeo de nombres de armas del sistema a nombres de archivos
    const weaponFileMap: Record<string, string> = {
      "Assault Rifle": "Assault Riffle", // Note: matches the actual file name with "Riffle"
      "Custom SMG": "Custom SMG",
      "HighCaliber Revolver": "Highcaliber Revolver", // Note: no space in "Highcaliber"
      HMLMG: "HMLMG",
      "LR-300": "LR-300",
      M249: "M249",
      "M39 Rifle": "M39 Rifle",
      "M92 Pistol": "M92 Pistol",
      MP5A4: "MP5A4",
      Python: "Python",
      Revolver: "Revolver",
      "SemiAutomatic Rifle": "Semiautomatic Rifle", // Note: no capital A in "automatic"
      "SemiAutomatic Pistol": "Semiautomatic Pistol", // Note: no capital A in "automatic"
      SKS: "SKS",
      "Handmade SMG": "Handmade SMG",
      Thompson: "Thompson",
      __NONE__: "None",
    }
    const fileName = weaponFileMap[weaponName] || "None"
    const audioPath = `/voices/${selectedVoice}/${fileName}.mp3`

    // Crear y reproducir audio ----------------- ⬇️ pega esto
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5 // volumen al 50 %
      await audio.play()
    } catch (err) {
      console.error(`Could not play voice for ${weaponName} (${audioPath}):`, err)
    }
  }

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
    {
      value: "default",
      label: "Default",
      primary: "142 76% 36%",
      secondary: "203 39% 20%",
      accent: "142 76% 46%",
    },
    {
      value: "sunset",
      label: "Sunset",
      primary: "14 90% 50%",
      secondary: "30 90% 40%",
      accent: "45 100% 60%",
    },
    {
      value: "ocean",
      label: "Ocean",
      primary: "198 90% 50%",
      secondary: "171 80% 40%",
      accent: "180 100% 50%",
    },
    {
      value: "amethyst",
      label: "Amethyst",
      primary: "262 52% 47%",
      secondary: "292 60% 40%",
      accent: "320 70% 60%",
    },
    {
      value: "mono",
      label: "Mono",
      primary: "0 0% 50%",
      secondary: "0 0% 30%",
      accent: "0 0% 70%",
    },
  ] as const
  const [selectedTheme, setSelectedTheme] = useState<string>(themeOptions[0].value)
  const [backgroundGradient, setBackgroundGradient] = useState<string>("")

  const voiceOptions = [
    { value: "britney", label: "Britney" },
    { value: "grandpa", label: "Grandpa" },
    { value: "john", label: "John" },
  ] as const
  const [selectedVoice, setSelectedVoice] = useState<string>(voiceOptions[0].value)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voicesEnabled, setVoicesEnabled] = useState(false)
  const [voiceVolume, setVoiceVolume] = useState([100])
  const [soundEffects, setSoundEffects] = useState(true)

  // Reproducir voz cuando cambia el arma seleccionada
  useEffect(() => {
    if (selectedWeapon && selectedWeapon !== "__NONE__") {
      playWeaponVoice(selectedWeapon)
    }
  }, [selectedWeapon, selectedVoice])

  const applyTheme = useCallback(
    (themeValue: string) => {
      const theme = themeOptions.find((th) => th.value === themeValue)
      if (theme) {
        document.documentElement.style.setProperty("--primary", theme.primary)
        document.documentElement.style.setProperty("--secondary", theme.secondary)
        document.documentElement.style.setProperty("--accent", theme.accent)

        // Set smooth background gradients for each theme with multiple color stops
        let gradient = ""
        switch (themeValue) {
          case "default":
            gradient =
              "linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #1e3a8a 45%, #1e3a8a 55%, #1e293b 80%, #0f172a 100%)"
            break
          case "sunset":
            gradient =
              "linear-gradient(135deg, #451a03 0%, #7c2d12 18%, #ea580c 38%, #ea580c 62%, #7c2d12 82%, #451a03 100%)"
            break
          case "ocean":
            gradient =
              "linear-gradient(135deg, #0c4a6e 0%, #0369a1 18%, #0ea5e9 38%, #0ea5e9 62%, #0369a1 82%, #0c4a6e 100%)"
            break
          case "amethyst":
            gradient =
              "linear-gradient(135deg, #581c87 0%, #7c3aed 18%, #a855f7 38%, #a855f7 62%, #7c3aed 82%, #581c87 100%)"
            break
          case "mono":
            gradient =
              "linear-gradient(135deg, #1f2937 0%, #374151 18%, #4b5563 38%, #4b5563 62%, #374151 82%, #1f2937 100%)"
            break
          default:
            gradient =
              "linear-gradient(135deg, #0f172a 0%, #1e293b 15%, #334155 30%, #475569 45%, #334155 60%, #1e293b 75%, #0f172a 90%, #0f172a 100%)"
        }
        setBackgroundGradient(gradient)
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
        const match = speechSynthesis.getVoices().find((v) => v.name.toLowerCase().includes(selectedVoice))
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
      if (typeof cfg.fov === "number") setFov([cfg.fov])
      if (typeof cfg.sens === "number") setSensitivity([cfg.sens])
      if (typeof cfg.imsens === "number") setScopeSensitivity([cfg.imsens])
      if (typeof cfg.randomness === "number") setRandomness([cfg.randomness])
      if (typeof cfg.crouch_key === "number") setCrouchKey(codeToKeyName(cfg.crouch_key))
      if (typeof cfg.aim_key === "number") setAimKey(codeToKeyName(cfg.aim_key))
      if (typeof cfg.detection_accuracy === "number") setDetectionAccuracy([cfg.detection_accuracy])
      if (cfg.weapon_hotkeys && typeof cfg.weapon_hotkeys === "object") {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.weapon_hotkeys as Record<string, number>)) {
          if (typeof v === "number") map[k] = codeToKeyName(v)
        }
        setWeaponHotkeys(map)
      }
      if (cfg.scope_hotkeys && typeof cfg.scope_hotkeys === "object") {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.scope_hotkeys as Record<string, number>)) {
          if (typeof v === "number") map[k] = codeToKeyName(v)
        }
        setScopeHotkeys(map)
      }
      if (cfg.barrel_hotkeys && typeof cfg.barrel_hotkeys === "object") {
        const map: Record<string, string> = {}
        for (const [k, v] of Object.entries(cfg.barrel_hotkeys as Record<string, number>)) {
          if (typeof v === "number") map[k] = codeToKeyName(v)
        }
        setBarrelHotkeys(map)
      }
      if (typeof cfg.hipfire === "boolean") setHipfire(cfg.hipfire)
      if (typeof cfg.hipfire_key === "number") setHipfireKey(codeToKeyName(cfg.hipfire_key))
      if (typeof cfg.zoom === "boolean") setZoom(cfg.zoom)
      if (typeof cfg.zoom_key === "number") setZoomKey(codeToKeyName(cfg.zoom_key))
      if (typeof cfg.auto_detection === "boolean") setAutoDetection(cfg.auto_detection)
      if (typeof cfg.script_on === "boolean") handleScriptEnabledChange(cfg.script_on)
      if (typeof cfg.script_toggle_key === "number") setScriptToggleKey(codeToKeyName(cfg.script_toggle_key))
      if (typeof cfg.auto_detection_toggle_key === "number")
        setAutoDetectToggleKey(codeToKeyName(cfg.auto_detection_toggle_key))
      setConfigLoaded(true)
    }
    loadConfig()
  }, [licenseKey, handleScriptEnabledChange])

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
      zoom_key: zoom ? (keyNameToCode(zoomKey) ?? 0) : undefined,
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
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
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
    handleSendConfiguration()
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
    ],
  )

  const handleLogout = () => {
    localStorage.clear() // limpia preferencias
    window.location.href = "/" // vuelve al login
  }

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
  ]) // cierra array

  return (
    <div
      className="min-h-screen transition-all duration-500"
      style={{
        background:
          backgroundGradient ||
          "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)",
      }}
    >
      {/* Theme Selector - Esquina superior derecha */}
      <div className="fixed top-4 right-32 z-50">
        <ThemeSelector />
      </div>

      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img src="/images/purge-logo.png" alt="PURGE Logo" className="h-14 w-auto" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Purge 2.0
            </h1>
          </div>
          <p className="text-gray-400 self-center">
            License:&nbsp;
            <span style={{ color: `hsl(var(--accent))` }} className="font-semibold">
              {licenseKey}
            </span>
          </p>
          {/* API Connection Status */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2"
            style={{ borderColor: API_COLORS[apiConnectionStatus] }}
          >
            {apiConnectionStatus === "pending" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: API_COLORS.pending }} />
                <span style={{ color: API_COLORS.pending }} className="font-medium">
                  API Connection: Checking…
                </span>
              </>
            )}
            {apiConnectionStatus === "connected" && (
              <>
                <Wifi className="w-4 h-4" style={{ color: API_COLORS.connected }} />
                <span style={{ color: API_COLORS.connected }} className="font-medium">
                  API Connection: Active&nbsp;&amp;&nbsp;Connected
                </span>
              </>
            )}
            {apiConnectionStatus === "disconnected" && (
              <>
                <WifiOff className="w-4 h-4" style={{ color: API_COLORS.disconnected }} />
                <span style={{ color: API_COLORS.disconnected }} className="font-medium">
                  API Connection: Disconnected
                </span>
              </>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                style={{
                  borderColor: `hsl(var(--accent) / 0.5)`,
                  color: `hsl(var(--accent))`,
                }}
                className="hover:bg-transparent hover:opacity-80 transition-colors bg-transparent"
                onClick={() => window.open("/docs", "_blank")}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                How to use?
              </Button>
            </div>
            <Button
              style={{ backgroundColor: `hsl(var(--accent))` }}
              className="hover:opacity-90 text-black"
              onClick={() => window.open(`/dashboard/${licenseKey}/download`, "_blank")}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <NotificationsDropdown />
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-700/50 text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Power className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                <span className="text-sm font-medium">Script ON / OFF</span>
              </div>
              <Switch
                checked={scriptEnabled}
                onCheckedChange={handleScriptEnabledChange}
                style={{
                  backgroundColor: scriptEnabled ? `hsl(var(--accent))` : undefined,
                }}
              />
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Radar className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                <span className="text-sm font-medium">Auto Detection</span>
              </div>
              <Switch
                checked={autoDetection}
                onCheckedChange={setAutoDetection}
                disabled={!autodetectAllowed}
                style={{ backgroundColor: autoDetection ? `hsl(var(--accent))` : undefined }}
              />
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                <span className="text-xs font-medium">Weapon Selected</span>
              </div>
              <Badge
                variant="secondary"
                style={{
                  color: `hsl(var(--accent))`,
                  backgroundColor: `hsl(var(--accent) / 0.15)`,
                  borderColor: `hsl(var(--accent) / 0.3)`,
                }}
                className="text-xs"
              >
                {getDisplayWeapon(selectedWeapon)}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                <span className="text-xs font-medium">Scope Selected</span>
              </div>
              <Badge
                variant="secondary"
                style={{
                  color: `hsl(var(--accent))`,
                  backgroundColor: `hsl(var(--accent) / 0.15)`,
                  borderColor: `hsl(var(--accent) / 0.3)`,
                }}
                className="text-xs"
              >
                {getDisplayScope(selectedScope)}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50 text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                <span className="text-xs font-medium">Barrel Selected</span>
              </div>
              <Badge
                variant="secondary"
                style={{
                  color: `hsl(