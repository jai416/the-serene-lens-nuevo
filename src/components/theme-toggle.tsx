"use client"

import { useTheme } from "@/components/theme-provider"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D] transition-all duration-200 w-full dark:hover:bg-[#2A3228] dark:text-[#9BAA93] dark:hover:text-[#E8EDE6]"
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
