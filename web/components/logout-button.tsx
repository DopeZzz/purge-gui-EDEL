"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Limpiar solo datos de licencia
    localStorage.removeItem('licenseType')
    localStorage.removeItem('licenseExpiresAt')

    // Redirigir a la página de login
    router.push('/')
  }

  return (
    <Button
      onClick={handleLogout}
      className="bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200 shadow-lg shadow-red-500/25 backdrop-blur-sm transition-all duration-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      Log out
    </Button>
  )
}