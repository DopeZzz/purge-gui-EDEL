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

  // Load saved theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedTheme")
      if (saved && themeOptions.some((t) => t.value === saved)) {
        setSelectedTheme(saved)
      }
    } catch (_) {
      /* ignore */
    }
  }, [])

  const voiceOptions = [
    { value: "britney", label: "Britney" },
    { value: "grandpa", label: "Grandpa" },
    { value: "john", label: "John" },
  ] as const
  const [selectedVoice, setSelectedVoice] = useState<string>(voiceOptions[0].value)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voicesEnabled, setVoicesEnabled] = useState(false)
  const [soundEffects, setSoundEffects] = useState(true)

  // Load saved voice selection from localStorage
  useEffect(() => {
    try {
      const savedVoice = localStorage.getItem("selectedVoice")
      if (savedVoice && voiceOptions.some((v) => v.value === savedVoice)) {
        setSelectedVoice(savedVoice)
      }
    } catch (_) {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("selectedVoice", selectedVoice)
    } catch (_) {
      /* ignore */
    }
  }, [selectedVoice])

  // Persistir estado de voz activada en localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("voicesEnabled")
      if (stored !== null) {
        setVoicesEnabled(stored === "true")
      }
    } catch (_) {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("voicesEnabled", voicesEnabled.toString())
    } catch (_) {
      /* ignore */
    }
  }, [voicesEnabled])

  // Reproducir voz cuando cambia el arma seleccionada si la opción está activada
  useEffect(() => {
    if (
      voicesEnabled &&
      selectedWeapon &&
      selectedWeapon !== "__NONE__"
    ) {
      playWeaponVoice(selectedWeapon)
    }
  }, [selectedWeapon, voicesEnabled])

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
    try {
      localStorage.setItem("selectedTheme", selectedTheme)
    } catch (_) {
      /* ignore */
    }
  }, [selectedTheme, applyTheme])

  // SOUND: Plays a short beep when the script is toggled on or off
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
    },
    [soundEnabled],
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
    try {
      localStorage.removeItem("licenseType")
      localStorage.removeItem("licenseExpiresAt")
    } catch (_) {
      /* ignore */
    }
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
                onClick={() => window.open(`/docs?license=${licenseKey}`, "_blank")}
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
                  color: `hsl(var(--accent))`,
                  backgroundColor: `hsl(var(--accent) / 0.15)`,
                  borderColor: `hsl(var(--accent) / 0.3)`,
                }}
                className="text-xs"
              >
                {getDisplayBarrel(selectedBarrel)}
              </Badge>
            </CardContent>
          </Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-12 items-center bg-gray-900/50 border-gray-700/50">
            <TabsTrigger
              value="controls"
              className="txt w-full h-full flex items-center justify-center gap-2 px-4 rounded-lg transition-colors data-[state=active]:bg-[hsl(var(--accent))] data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="txt w-full h-full flex items-center justify-center gap-2 px-4 rounded-lg transition-colors data-[state=active]:bg-[hsl(var(--accent))] data-[state=active]:text-white"
            >
              <Crosshair className="w-4 h-4" />
              Selections
            </TabsTrigger>
            <TabsTrigger
              value="keybinds"
              className="txt w-full h-full flex items-center justify-center gap-2 px-4 rounded-lg transition-colors data-[state=active]:bg-[hsl(var(--accent))] data-[state=active]:text-white"
            >
              <Keyboard className="w-4 h-4" />
              Keybinds
            </TabsTrigger>
            {autodetectAllowed && (
              <TabsTrigger
                value="autodetect"
                className="txt w-full h-full flex items-center justify-center gap-2 px-4 rounded-lg transition-colors data-[state=active]:bg-[hsl(var(--accent))] data-[state=active]:text-white"
              >
                <Radar className="w-4 h-4" />
                Autodetect
              </TabsTrigger>
            )}
            <TabsTrigger
              value="miscellaneous"
              className="txt w-full h-full flex items-center justify-center gap-2 px-4 rounded-lg transition-colors data-[state=active]:bg-[hsl(var(--accent))] data-[state=active]:text-white"
            >
              <Wrench className="w-4 h-4" />
              Miscellaneous
            </TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Target className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    Aim Settings
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: `hsl(var(--accent) / 0.5)`,
                        color: `hsl(var(--accent) / 0.8)`,
                      }}
                      className="ml-auto text-xs"
                    >
                      Precision
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sensitivity</span>
                      <Badge
                        variant="secondary"
                        style={{
                          color: `hsl(var(--accent))`,
                          backgroundColor: `hsl(var(--accent) / 0.15)`,
                          borderColor: `hsl(var(--accent) / 0.3)`,
                        }}
                      >
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
                      <span className="text-sm font-medium">Aim Sensitivity</span>
                      <Badge
                        variant="secondary"
                        style={{
                          color: `hsl(var(--accent))`,
                          backgroundColor: `hsl(var(--accent) / 0.15)`,
                          borderColor: `hsl(var(--accent) / 0.3)`,
                        }}
                      >
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Settings className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    General Settings
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: `hsl(var(--accent) / 0.5)`,
                        color: `hsl(var(--accent) / 0.8)`,
                      }}
                      className="ml-auto text-xs"
                    >
                      Core
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">FOV</span>
                      <Badge
                        variant="secondary"
                        style={{
                          color: `hsl(var(--accent))`,
                          backgroundColor: `hsl(var(--accent) / 0.15)`,
                          borderColor: `hsl(var(--accent) / 0.3)`,
                        }}
                      >
                        {fov[0]}°
                      </Badge>
                    </div>
                    <Slider value={fov} onValueChange={setFov} min={60} max={90} step={0.1} className="w-full" />
                    <p className="text-xs text-gray-500">Field of view setting</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Randomness</span>
                      <Badge
                        variant="secondary"
                        style={{
                          color: `hsl(var(--accent))`,
                          backgroundColor: `hsl(var(--accent) / 0.15)`,
                          borderColor: `hsl(var(--accent) / 0.3)`,
                        }}
                      >
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Target className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    {" "}
                    <Eye className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                  {" "}
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    {" "}
                    <Zap className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Gamepad2 className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Target className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    Aim Key
                  </CardTitle>
                  <HotkeySelector value={aimKey} onValueChange={setAimKey} placeholder="Click to set aim key" />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500">Select the key you use to aim in game</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2 w-full">
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Power className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                    <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                      <Radar className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Keyboard className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                          onValueChange={(k) => setWeaponHotkeys((p) => ({ ...p, [weapon]: k }))}
                          placeholder="Set hotkey"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Keyboard className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    Scope Binds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SCOPE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center justify-between space-x-2">
                      <span>{opt.display}</span>
                      <HotkeySelector
                        value={scopeHotkeys[opt.value] || ""}
                        onValueChange={(k) => setScopeHotkeys((p) => ({ ...p, [opt.value]: k }))}
                        placeholder="Set hotkey"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Keyboard className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    Barrel Binds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {BARREL_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center justify-between space-x-2">
                      <span>{opt.display}</span>
                      <HotkeySelector
                        value={barrelHotkeys[opt.value] || ""}
                        onValueChange={(k) => setBarrelHotkeys((p) => ({ ...p, [opt.value]: k }))}
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
              <div className="grid grid-cols-1 gap-8">
                {/* Detection Accuracy Card */}
                <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle
                      className="text-xl font-bold text-white flex items-center gap-3"
                      style={{ color: `hsl(var(--accent))` }}
                    >
                      <Radar className="w-6 h-6" style={{ color: `hsl(var(--accent))` }} />
                      Detection Accuracy
                    </CardTitle>
                    <p className="text-gray-400 text-sm">Adjust detection sensitivity</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">Higher values increase accuracy but may reduce performance.</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Accuracy</span>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          <TabsContent value="miscellaneous" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Target className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                      style={{
                        backgroundColor: hipfire ? `hsl(var(--accent) / 0.8)` : undefined,
                      }}
                      className="data-[state=unchecked]:bg-gray-600"
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
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Eye className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                      style={{
                        backgroundColor: zoom ? `hsl(var(--accent) / 0.8)` : undefined,
                      }}
                      className="data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  {zoom && (
                    <div className="space-y-2">
                      <HotkeySelector value={zoomKey} onValueChange={setZoomKey} placeholder="Set hotkey" />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Palette className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
                    Theme Selector
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-white">Select a theme to customize the interface.</p>
                  <p className="text-xs text-gray-500">Your choice will apply immediately.</p>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-9">
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
              <Card className="bg-gray-900/50 border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: `hsl(var(--accent))` }}>
                    <Volume2 className="w-5 h-5 mr-2" style={{ color: `hsl(var(--accent))` }} />
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
                      style={{
                        backgroundColor: soundEnabled ? `hsl(var(--accent) / 0.8)` : undefined,
                      }}
                      className="data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Voice Feedback</p>
                      <p className="text-xs text-gray-500">Enable voice announcements</p>
                    </div>
                    <Switch
                      checked={voicesEnabled}
                      onCheckedChange={setVoicesEnabled}
                      style={{
                        backgroundColor: voicesEnabled ? `hsl(var(--accent) / 0.8)` : undefined,
                      }}
                      className="data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  {voicesEnabled && (
                    <>
                      {/* Voice Selector */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <span style={{ color: "var(--theme-accent)" }}>🎵</span>
                          Voice Selection
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Weapon Voice</label>
                            <select
                              value={selectedVoice}
                              onChange={(e) => setSelectedVoice(e.target.value)}
                              className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              {voiceOptions.map((v) => (
                                <option key={v.value} value={v.value}>
                                  {v.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-400">Voice that announces weapon names when selected</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}