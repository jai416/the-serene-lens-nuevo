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
        "text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D]",
        "dark:text-[#9BAA93] dark:hover:bg-[#2A3228] dark:hover:text-[#E8EDE6]",
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
        "bg-[#F0F5EC] text-[#64705E] hover:bg-[#E0EDE0] hover:text-[#2F3A2D]",
        "dark:bg-[#2E3829] dark:text-[#9BAA93] dark:hover:bg-[#3A4536] dark:hover:text-[#E8EDE6]"
      )}
      aria-label="Cambiar tema"
    >
      {theme === "light" && <Sun className="w-4 h-4" />}
      {theme === "dark" && <Moon className="w-4 h-4" />}
      {theme === "system" && <Monitor className="w-4 h-4" />}
    </button>
  )
}
