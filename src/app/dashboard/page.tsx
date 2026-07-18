"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Scan, History, Droplets, Beaker, ArrowRight, Sparkles, Sun, Clock, ChevronRight, TrendingUp, Shield, Bell, Crown, MessageSquare } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import { WhatsNewBanner } from "@/components/whats-new-banner"

interface Analysis {
  id: string
  skinType: string | null
  createdAt: string
}

interface Usage {
  plan: string
  isUnlimited: boolean
  monthlyLimit: number
  monthlyUsed: number
  monthlyRemaining: number
  totalRemaining: number | null
}

export default function DashboardPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { locale } = useLocale()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)

  useEffect(() => {
    if (session) {
      fetch("/api/analysis")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const raw = data?.data?.analyses ?? data.analyses
          setAnalyses(Array.isArray(raw) ? raw : [])
        })
        .catch(() => toast.error(t("dashboard.errorLoading", locale)))

      fetch("/api/user/usage")
        .then((res) => (res.ok ? res.json() : { usage: null }))
        .then((data) => setUsage(data?.data?.usage || data.usage))
        .catch(() => {})
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <CardSkeleton />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  }

  const latestAnalysis = analyses[0]
  const hasAnalyses = analyses.length > 0
  const progressScore = hasAnalyses ? Math.min(100, 70 + analyses.length * 2) : 0

  const user = session.user as any
  const isFree = user?.plan === "FREE" || user?.plan === "ESSENTIAL"

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* What's New Banner */}
        <WhatsNewBanner locale={locale} />

        {/* Premium Upgrade Banner for Free Users */}
        {isFree && (
          <Card className="p-5 border-0 bg-gradient-to-r from-[#FFF9E6] to-[#FEF6D7] shadow-sm">
            <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FCEAA6] flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-[#D4A843]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {locale === "en" ? "Unlock Unlimited Analyses" : "Desbloquea Análisis Ilimitados"}
                </p>
                <p className="text-xs text-[#666666]">
                  {locale === "en"
                    ? "Upgrade to Premium and get unlimited skin analyses, full history, and personalized routines."
                    : "Actualiza a Premium y obtén análisis ilimitados, historial completo y rutinas personalizadas."}
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="primary" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap">
                  <Crown className="w-3.5 h-3.5" />
                  {locale === "en" ? "Upgrade Now" : "Mejorar ahora"}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Hero Module */}
        <Card className="p-6 md:p-8 border-0 shadow-[0_2px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#E2ECE0]/40" />
          <div className="absolute -bottom-10 -right-8 w-32 h-32 rounded-full bg-[#E2ECE0]/30" />
          <div className="absolute top-20 right-24 w-20 h-20 rounded-full bg-[#E2ECE0]/20" />
          <CardContent className="p-0 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-[#666666] mb-2">
                  {t("dashboard.greeting", locale).replace("{name}", session.user.name || t("common.user", locale))} 👋
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3 leading-tight">
                  {hasAnalyses
                    ? locale === "en" ? "Your Skin Journey" : "Tu Viaje de Piel"
                    : t("dashboard.heroTitle", locale)}
                </h1>
                <p className="text-[#666666] text-sm leading-relaxed mb-6 max-w-lg">
                  {hasAnalyses
                    ? locale === "en"
                      ? `You've completed ${analyses.length} analysis${analyses.length > 1 ? "es" : ""}. Keep tracking your progress!`
                      : `Completaste ${analyses.length} análisis${analyses.length > 1 ? "" : ""}. ¡Sigue tu evolución!`
                    : t("dashboard.heroDesc", locale)}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/analysis">
                    <Button className="gap-2">
                      <Scan className="w-4 h-4" />
                      {hasAnalyses ? t("dashboard.startAnalysis", locale) : (locale === "en" ? "Start Your First Analysis" : "Comienza tu primer análisis")}
                    </Button>
                  </Link>
                  {!hasAnalyses && (
                    <Link href="/products?category=principiantes">
                      <Button variant="secondary" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        {locale === "en" ? "Beginner's Guide" : "Guía para principiantes"}
                      </Button>
                    </Link>
                  )}
                  {hasAnalyses && (
                    <Link href="/dashboard/diary">
                      <Button variant="secondary" className="gap-2">
                        <Droplets className="w-4 h-4" />
                        {t("dashboard.seeHow", locale)}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid Categories Block */}
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
            {t("dashboard.whatToDo", locale)}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: t("dashboard.card1Title", locale), desc: t("dashboard.card1Desc", locale), icon: Scan, href: "/analysis" },
              { title: t("dashboard.card2Title", locale), desc: t("dashboard.card2Desc", locale).replace("{n}", String(analyses.length)), icon: History, href: "/dashboard/history" },
              { title: t("dashboard.card3Title", locale), desc: t("dashboard.card3Desc", locale), icon: Droplets, href: "/dashboard/diary" },
              { title: t("dashboard.card4Title", locale), desc: t("dashboard.card4Desc", locale), icon: Beaker, href: "/ingredients-analyzer" },
            ].map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="p-5 hover:-translate-y-1 cursor-pointer border border-[#E8E8E8]/60">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-[#88B078]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1">{card.title}</h3>
                    <p className="text-xs text-[#666666]">{card.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-column layout: Progress + Right widgets */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Progress Module */}
          <Card className="lg:col-span-2 p-6 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#88B078]" />
                {t("dashboard.yourProgress", locale)}
              </h3>
              <p className="text-xs text-[#666666] mb-6">
                {t("dashboard.progressDesc", locale)}
              </p>

              <div className="flex items-center gap-8">
                {/* Mini chart area */}
                <div className="flex-1 h-24 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#88B078" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#88B078" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,60 C30,55 50,50 70,35 C90,20 110,30 130,25 C150,20 170,10 200,15"
                      fill="none"
                      stroke="#88B078"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,60 C30,55 50,50 70,35 C90,20 110,30 130,25 C150,20 170,10 200,15 L200,80 L0,80 Z"
                      fill="url(#chartGrad)"
                    />
                    <circle cx="70" cy="35" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                    <circle cx="130" cy="25" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                    <circle cx="200" cy="15" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                  </svg>
                </div>

                {/* Circular gauge */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E2ECE0" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="#88B078"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressScore / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#1A1A1A]">
                        {hasAnalyses ? progressScore : "—"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#666666] mt-2 font-medium">{t("dashboard.goodStatus", locale)}</p>
                </div>
              </div>

              {usage && (
                <div className="mt-6 pt-4 border-t border-[#E8E8E8] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <Shield className="w-3.5 h-3.5 text-[#88B078]" />
                    {usage.isUnlimited
                      ? t("dashboard.unlimited", locale)
                      : t("dashboard.remainingMonthly", locale).replace("{n}", String(usage.monthlyRemaining))
                    }
                  </div>
                  <Link href="/dashboard/subscription">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      {t("dashboard.viewPlan", locale)}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Widgets */}
          <div className="space-y-4">
            {/* Analysis Summary Widget */}
            <Card className="p-5 border border-[#E8E8E8]/60">
              <CardContent className="p-0">
                <h3 className="font-semibold text-sm text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-[#88B078]" />
                  {t("dashboard.latestAnalysis", locale)}
                </h3>
                {hasAnalyses && latestAnalysis ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#E2ECE0] flex items-center justify-center text-sm font-semibold text-[#88B078] shrink-0">
                        {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs text-[#666666]">{formatDate(latestAnalysis.createdAt)}</p>
                        {latestAnalysis.skinType && (
                          <Badge variant="mint" className="text-[10px] mt-1">
                            {locale === "en" ? "Skin" : "Piel"} {latestAnalysis.skinType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link href={`/analysis/results/${latestAnalysis.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 w-full justify-between">
                        {t("dashboard.viewResults", locale)}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#666666] mb-3">{t("dashboard.noAnalysis", locale)}</p>
                    <Link href="/analysis">
                      <Button size="sm" className="text-xs gap-1 w-full">
                        <Scan className="w-3 h-3" />
                        {t("dashboard.startNow", locale)}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reminders & Insights Widget */}
            <Card className="p-5 border border-[#E8E8E8]/60">
              <CardContent className="p-0">
                <h3 className="font-semibold text-sm text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#88B078]" />
                  {t("dashboard.reminders", locale)}
                </h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-xs text-[#666666]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    {t("dashboard.reminder1", locale)}
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#666666]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    {t("dashboard.reminder2", locale)}
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#666666]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    {t("dashboard.reminder3", locale)}
                  </li>
                </ul>
                <Link href="/dashboard/diary">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 w-full justify-between">
                    {t("dashboard.viewRoutine", locale)}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sunscreen Reminder */}
            <Card className="p-4 border-0 bg-[#FFF9E6]">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCEAA6] flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A]">{t("dashboard.sunProtection", locale)}</p>
                  <p className="text-xs text-[#666666]">{t("dashboard.spfReminder", locale)}</p>
                </div>
                <Link href="/products?category=proteccion-solar">
                  <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1">
                    {t("common.see", locale)}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Analyses */}
        {hasAnalyses && analyses.length > 1 && (
          <div>
            <h2 className="font-semibold text-base text-[#1A1A1A] mb-4">
              {t("dashboard.recentAnalyses", locale)}
            </h2>
            <div className="space-y-2">
              {analyses.slice(1, 4).map((a, i) => (
                <Link key={a.id} href={`/analysis/results/${a.id}`}>
                  <Card className="p-4 hover:-translate-y-0.5 transition-all duration-300 border border-[#E8E8E8]/60">
                    <CardContent className="p-0 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#E2ECE0] flex items-center justify-center shrink-0">
                          <Scan className="w-4 h-4 text-[#88B078]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">
                            {t("dashboard.analysisLabel", locale).replace("{type}", a.skinType ? `- ${a.skinType}` : `#${i + 2}`)}
                          </p>
                          <p className="text-xs text-[#666666]">
                            {formatDate(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#999999] shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
