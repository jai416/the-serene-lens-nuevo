"use client"

import { useTheme } from "@/components/theme-provider"
import { Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm rounded-xl",
      "text-[#666666]",
      className
    )}>
      <Sun className="w-4.5 h-4.5 shrink-0" />
      Claro
    </div>
  )
}

export function ThemeToggleCompact() {
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      "bg-[#E2ECE0] text-[#666666]"
    )}>
      <Sun className="w-4 h-4" />
    </div>
  )
}
