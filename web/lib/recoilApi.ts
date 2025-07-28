
export interface RecoilApiPayload {
  serial: string
  weapon: string
  scope: string
  barrel: string
  fov: number
  sens: number
  imsens: number
  /** Key code used to crouch */
  crouch_key: number
  /** Key code used to aim */
  aim_key: number
  /** Detection accuracy value */
  detection_accuracy?: number
  /** Enable hipfire mode */
  hipfire?: boolean
  /** Hotkey for hipfire when enabled */
  hipfire_key?: number
  /** Enable zoom mode */
  zoom?: boolean
  /** Hotkey for zoom when enabled */
  zoom_key?: number
  /** Optional map of weapon names to key codes */
  weapon_hotkeys?: Record<string, number>
  /** Optional map of scope names to key codes */
  scope_hotkeys?: Record<string, number>
  /** Optional map of barrel names to key codes */
  barrel_hotkeys?: Record<string, number>
  /** Whether auto detection is enabled */
  auto_detection?: boolean
  /** Whether the script should be enabled */
  script_on?: boolean
  /** Hotkey to toggle script on/off */
  script_toggle_key?: number
  /** Hotkey to toggle auto detection */
  auto_detection_toggle_key?: number
  /** Amount of randomness to apply */
  randomness?: number
  /** Whether the backend should persist the configuration */
  save_config?: boolean
  /** Selected theme for the dashboard */
  selected_theme?: string
  /** Whether sound feedback is enabled */
  sound_enabled?: boolean
  /** Whether voice announcements are enabled */
  voices_enabled?: boolean
  /** Selected voice identifier */
  selected_voice?: string
}

export interface SubmitResult {
  success: boolean
  error?: string
}
