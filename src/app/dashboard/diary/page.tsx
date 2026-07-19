"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "sonner"
import { CardSkeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/lib/locale/locale-context"
import { t, Locale } from "@/lib/locale/translations"

interface DiaryEntry {
  id: string
  date: string
  feeling: number
  notes: string | null
  createdAt: string
}

const FEELING_COLORS: Record<number, string> = {
  1: "#E07070",
  2: "#E89B5E",
  3: "#E8D45E",
  4: "#A8D88E",
  5: "#88B078",
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isSameWeek(a: Date, b: Date) {
  const startOfWeek = (d: Date) => {
    const day = d.getDay()
    return addDays(d, -day)
  }
  const ws = startOfWeek(a)
  const we = addDays(ws, 6)
  return b >= ws && b <= we
}

function getWeekdayLabels(locale: Locale) {
  return [
    t("common.sunday", locale),
    t("common.monday", locale),
    t("common.tuesday", locale),
    t("common.wednesday", locale),
    t("common.thursday", locale),
    t("common.friday", locale),
    t("common.saturday", locale),
  ]
}

function getMonthLabels(locale: Locale) {
  return [
    t("common.january", locale),
    t("common.february", locale),
    t("common.march", locale),
    t("common.april", locale),
    t("common.may", locale),
    t("common.june", locale),
    t("common.july", locale),
    t("common.august", locale),
    t("common.september", locale),
    t("common.october", locale),
    t("common.november", locale),
    t("common.december", locale),
  ]
}

export default function DiaryPage() {
  const { locale } = useLocale()
  const WEEKDAY_LABELS = getWeekdayLabels(locale)
  const MONTH_LABELS = getMonthLabels(locale)
  const FEELING_LABELS: Record<number, string> = {
    1: t("diary.poor", locale),
    2: t("diary.poor", locale),
    3: t("diary.fair", locale),
    4: t("diary.good", locale),
    5: t("diary.good", locale),
  }
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [weekSummary, setWeekSummary] = useState<{ trend: "up" | "down" | "stable"; avg: number } | null>(null)

  const fetchEntries = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/skin-diary", { signal })
      if (!res.ok) throw new Error("Error al cargar")
      const json = await res.json()
      setEntries(json.data || [])
    } catch {
      toast.error("No se pudieron cargar las entradas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchEntries(controller.signal)
    return () => controller.abort()
  }, [fetchEntries])

  useEffect(() => {
    if (entries.length < 2) {
      setWeekSummary(null)
      return
    }
    const now = new Date()
    const thisWeek = entries.filter((e) => isSameWeek(now, new Date(e.date)))
    const lastWeek = entries.filter((e) => isSameWeek(addDays(now, -7), new Date(e.date)))

    if (thisWeek.length === 0) {
      setWeekSummary(null)
      return
    }

    const thisAvg = thisWeek.reduce((s, e) => s + e.feeling, 0) / thisWeek.length

    if (lastWeek.length === 0) {
      setWeekSummary({ trend: "stable", avg: thisAvg })
      return
    }

    const lastAvg = lastWeek.reduce((s, e) => s + e.feeling, 0) / lastWeek.length
    const diff = thisAvg - lastAvg

    setWeekSummary({
      trend: diff > 0.3 ? "up" : diff < -0.3 ? "down" : "stable",
      avg: thisAvg,
    })
  }, [entries])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const entryMap = new Map<string, DiaryEntry>()
  entries.forEach((e) => {
    entryMap.set(formatDateISO(new Date(e.date)), e)
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDay = monthStart.getDay()
  const totalDays = monthEnd.getDate()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < startDay; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))
  }

  const today = new Date()
  const todayStr = formatDateISO(today)
  const todayEntry = entryMap.get(todayStr)

  const handleSave = async () => {
    if (!selectedFeeling) {
      alert("Selecciona cómo se siente tu piel")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/skin-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          feeling: selectedFeeling,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      toast.success("Entrada guardada")
      setSelectedFeeling(null)
      setNotes("")
      fetchEntries()
    } catch {
      toast.error("No se pudo guardar la entrada")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 flex items-center gap-2 rounded-full px-4 py-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {t("diary.title", locale)}
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            {t("diary.subtitle", locale)}
          </h1>
          <p className="text-[#666666] mt-2 text-sm">
            Registra cómo se siente tu piel cada día
          </p>
        </div>

        {/* Weekly Summary */}
        {weekSummary && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                {weekSummary.trend === "up" && <TrendingUp className="w-5 h-5 text-[#6BAF3D]" />}
                {weekSummary.trend === "down" && <TrendingDown className="w-5 h-5 text-[#E07070]" />}
                {weekSummary.trend === "stable" && <Minus className="w-5 h-5 text-[#E8D45E]" />}
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {weekSummary.trend === "up" && t("diary.weekSummary", locale).replace("{trend}", t("diary.improved", locale))}
                    {weekSummary.trend === "down" && t("diary.weekSummary", locale).replace("{trend}", t("diary.worsened", locale))}
                    {weekSummary.trend === "stable" && t("diary.weekSummary", locale).replace("{trend}", t("diary.stable", locale))}
                  </p>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Promedio: {weekSummary.avg.toFixed(1)} / 5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="text-[#666666] hover:text-[#1A1A1A] px-2 py-1 rounded-lg hover:bg-[#E2ECE0] transition-colors text-sm"
              >
                ← {t("common.previous", locale)}
              </button>
              <CardTitle className="text-lg text-[#1A1A1A]">
                {MONTH_LABELS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </CardTitle>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="text-[#666666] hover:text-[#1A1A1A] px-2 py-1 rounded-lg hover:bg-[#E2ECE0] transition-colors text-sm"
              >
                {t("common.next", locale)} →
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-[#666666] py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const key = formatDateISO(day)
                const entry = entryMap.get(key)
                const isToday = sameDay(day, today)
                const isFuture = day > today

                return (
                  <div
                    key={key}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl py-2 min-h-[52px] transition-colors
                      ${isToday ? "ring-2 ring-[#88B078] bg-[#E2ECE0]" : "bg-white"}
                      ${isFuture ? "opacity-40" : ""}
                    `}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-[#1A1A1A]" : "text-[#666666]"}`}>
                      {day.getDate()}
                    </span>
                    {entry && (
                      <div
                        className="w-3 h-3 rounded-full mt-1"
                        style={{ backgroundColor: FEELING_COLORS[entry.feeling] }}
                        title={`${FEELING_LABELS[entry.feeling]}${entry.notes ? ` — ${entry.notes}` : ""}`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#666666] mb-2">{t("diary.legend", locale)}</p>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FEELING_COLORS[f] }} />
                  <span className="text-xs text-[#666666]">{f} — {FEELING_LABELS[f]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Entry Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A1A1A]">
              {t("diary.formTitle", locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                {t("diary.formFeeling", locale)}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFeeling(f)}
                    className={`
                      flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all text-xs font-medium
                      ${selectedFeeling === f
                        ? "border-[#88B078] bg-[#E2ECE0] text-[#1A1A1A]"
                        : "border-[#E8E8E8] bg-white text-[#666666] hover:border-[#88B078]"
                      }
                    `}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: FEELING_COLORS[f] }}
                    />
                    <span>{f}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                {t("diary.formNotes", locale)}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="¿Usaste algún producto nuevo? ¿Algún factor externo?"
                className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] text-[#1A1A1A] placeholder:text-[#666666]/50 resize-none"
              />
            </div>

            {todayEntry && (
              <p className="text-xs text-[#666666]">
                Ya tienes una entrada para hoy. Guardarla sobreescribirá la anterior.
              </p>
            )}

            <Button onClick={handleSave} disabled={saving || !selectedFeeling} variant="primary">
              {saving ? t("common.saving", locale) : todayEntry ? "Actualizar entrada" : t("diary.formSave", locale)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
