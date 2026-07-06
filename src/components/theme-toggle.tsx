"use client"

import { useTheme } from "@/components/theme-provider"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      onClick={cycle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all duration-200 w-full",
        "text-[#666666] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]",
        "dark:text-[#999999] dark:hover:bg-[#2A2A2A] dark:hover:text-[#F0F0F0]",
        className
      )}
      aria-label="Cambiar tema"
    >
      {theme === "light" && <Sun className="w-4.5 h-4.5 shrink-0" />}
      {theme === "dark" && <Moon className="w-4.5 h-4.5 shrink-0" />}
      {theme === "system" && <Monitor className="w-4.5 h-4.5 shrink-0" />}
      {theme === "light" && "Claro"}
      {theme === "dark" && "Oscuro"}
      {theme === "system" && "Sistema"}
    </button>
  )
}

export function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      onClick={cycle}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
        "bg-[#E2ECE0] text-[#666666] hover:bg-[#D0E0D0] hover:text-[#1A1A1A]",
        "dark:bg-[#2A3A2A] dark:text-[#999999] dark:hover:bg-[#3A4A3A] dark:hover:text-[#F0F0F0]"
      )}
      aria-label="Cambiar tema"
    >
      {theme === "light" && <Sun className="w-4 h-4" />}
      {theme === "dark" && <Moon className="w-4 h-4" />}
      {theme === "system" && <Monitor className="w-4 h-4" />}
    </button>
  )
}
