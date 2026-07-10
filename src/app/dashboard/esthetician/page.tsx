"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User, Users, FileText, Settings, TrendingUp, Calendar,
  Search, Plus, ChevronRight, Clock, Activity,
} from "lucide-react"
import { toast } from "sonner"

interface Patient {
  id: string
  name: string | null
  email: string
  plan: string
  _count: { analyses: number }
  analyses: { createdAt: string }[]
}

interface ClinicProfile {
  name: string | null
  phone: string | null
  address: string | null
  licenseNumber: string | null
}

export default function EstheticianPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as any
  const [patients, setPatients] = useState<Patient[]>([])
  const [clinic, setClinic] = useState<ClinicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch("/api/user/clinic").then((r) => (r.ok ? r.json() : { data: null })),
      fetch("/api/admin/users?role=patient").then((r) => (r.ok ? r.json() : { data: { users: [] } })),
    ])
      .then(([clinicRes, usersRes]) => {
        setClinic(clinicRes?.data?.clinic || clinicRes?.clinic || null)
        setPatients(usersRes?.data?.users || usersRes?.users || [])
      })
      .catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false))
  }, [session])

  if (status === "loading") return <div className="p-8 text-center text-[#666666]">Cargando...</div>
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  if (user?.plan !== "ESTHETICIAN") redirect("/dashboard/profile")

  const totalAnalyses = patients.reduce((sum, p) => sum + p._count.analyses, 0)
  const recentPatients = patients.slice(0, 5)

  return (
    <div className="min-h-screen px-4 py-6 md:py-8 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Panel Esteticista
            </h1>
            <p className="text-sm text-[#666666] mt-1">
              {clinic?.name || "Tu clínica"} · {patients.length} pacientes
            </p>
          </div>
          <Link href="/dashboard/report">
            <Button variant="primary" size="sm">
              <FileText className="w-4 h-4 mr-1.5" />
              Nuevo informe
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pacientes", value: patients.length, icon: Users, color: "#88B078" },
            { label: "Análisis totales", value: totalAnalyses, icon: Activity, color: "#88B078" },
            { label: "Consultas hoy", value: "—", icon: Calendar, color: "#D4A843" },
            { label: "Crecimiento", value: "—", icon: TrendingUp, color: "#D4A843" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 border border-[#E8E8E8]/60">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#666666]">{stat.label}</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clinic Profile + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#D4A843]" />
                Perfil profesional
              </h3>
              {clinic ? (
                <div className="space-y-2 text-sm">
                  <p className="text-[#1A1A1A]"><span className="text-[#666666]">Clínica:</span> {clinic.name || "—"}</p>
                  <p className="text-[#1A1A1A]"><span className="text-[#666666]">Teléfono:</span> {clinic.phone || "—"}</p>
                  <p className="text-[#1A1A1A]"><span className="text-[#666666]">Dirección:</span> {clinic.address || "—"}</p>
                  <p className="text-[#1A1A1A]"><span className="text-[#666666]">Licencia:</span> {clinic.licenseNumber || "—"}</p>
                </div>
              ) : (
                <p className="text-sm text-[#666666]">Completa tu perfil profesional.</p>
              )}
              <Link href="/dashboard/clinic-settings">
                <Button variant="ghost" size="sm" className="text-xs mt-4 w-full justify-between">
                  Editar perfil <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 p-5 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4A843]" />
                Pacientes recientes
              </h3>
              {recentPatients.length > 0 ? (
                <div className="space-y-2">
                  {recentPatients.map((p) => (
                    <Link key={p.id} href={`/admin/users/${p.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FFF9E6] transition-colors border border-transparent hover:border-[#FCEAA6]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#FFF9E6] flex items-center justify-center text-sm font-medium text-[#D4A843] shrink-0">
                            {(p.name || p.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A] truncate">{p.name || "Sin nombre"}</p>
                            <p className="text-xs text-[#666666]">{p.email} · {p._count.analyses} análisis</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#999999] shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto mb-3 text-[#666666]" />
                  <p className="text-sm text-[#666666]">Aún no tienes pacientes vinculados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid */}
        <div>
          <h2 className="font-semibold text-base text-[#1A1A1A] mb-4">Herramientas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Informes PDF", icon: FileText, href: "/dashboard/report", desc: "Genera informes profesionales con tu marca" },
              { label: "Historial clínico", icon: Clock, href: "/dashboard/history", desc: "Historial completo de análisis" },
              { label: "Buscar paciente", icon: Search, href: "/admin/users", desc: "Encuentra pacientes registrados" },
              { label: "Análisis rápido", icon: Activity, href: "/analysis", desc: "Nuevo análisis para paciente" },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="p-4 hover:-translate-y-0.5 transition-all duration-200 border border-[#E8E8E8]/60 cursor-pointer h-full">
                  <CardContent className="p-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] flex items-center justify-center mb-3">
                      <tool.icon className="w-5 h-5 text-[#D4A843]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-0.5">{tool.label}</p>
                    <p className="text-xs text-[#666666]">{tool.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* All Patients Table */}
        {patients.length > 0 && (
          <Card className="p-5 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Todos los pacientes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E8E8]">
                      <th className="text-left py-2 px-3 text-[#666666] font-medium">Paciente</th>
                      <th className="text-left py-2 px-3 text-[#666666] font-medium">Email</th>
                      <th className="text-center py-2 px-3 text-[#666666] font-medium">Análisis</th>
                      <th className="text-right py-2 px-3 text-[#666666] font-medium">Último</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id} className="border-b border-[#E8E8E8]/50 hover:bg-[#FFF9E6]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#1A1A1A]">{p.name || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#666666]">{p.email}</td>
                        <td className="py-2.5 px-3 text-center text-[#1A1A1A]">{p._count.analyses}</td>
                        <td className="py-2.5 px-3 text-right text-[#666666]">
                          {p.analyses?.[0]?.createdAt
                            ? new Date(p.analyses[0].createdAt).toLocaleDateString("es-ES")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
