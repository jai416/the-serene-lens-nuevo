"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User, Users, FileText, Settings, TrendingUp, Calendar,
  Search, Plus, ChevronRight, Clock, Activity, Building2,
  Edit2, Trash2, X, Loader2, Mail, Phone,
  Gift, Share2, Copy, Check, BadgeCheck,
} from "lucide-react"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import { getCsrfToken } from "@/lib/csrf-client"

interface ClientData {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string
  _count: { analyses: number }
}

interface ClinicProfile {
  id: string
  name: string
  logo: string | null
  address: string | null
  phone: string | null
  licenseNumber: string | null
  referralCode: string | null
}

interface ReferredUser {
  id: string
  name: string | null
  email: string
  createdAt: string
  plan: string
}

export default function EstheticianPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { locale } = useLocale()
  const user = session?.user
  const [clinic, setClinic] = useState<ClinicProfile | null>(null)
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", notes: "" })
  const [adding, setAdding] = useState(false)
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([])
  const [referredTotal, setReferredTotal] = useState(0)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search.trim()) params.set("search", search.trim())

      const [clinicRes, clientsRes, referredRes] = await Promise.all([
        fetch("/api/user/clinic"),
        fetch(`/api/esthetician/clients?${params}`),
        fetch("/api/esthetician/referred"),
      ])
      const clinicData = await clinicRes.json()
      const clientsData = await clientsRes.json()
      const referredData = await referredRes.json()
      setClinic(clinicData?.data?.clinic || clinicData?.clinic || null)
      const body = clientsData?.data || clientsData
      setClients(body.clients || [])
      setTotalPages(body.totalPages || 1)
      const refBody = referredData?.data || referredData
      setReferredUsers(refBody.users || [])
      setReferredTotal(refBody.total || 0)
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { if (session) fetchData() }, [fetchData, session])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClient.name.trim()) { toast.error("El nombre es obligatorio"); return }
    setAdding(true)
    try {
      const res = await fetch("/api/esthetician/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify(newClient),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al crear cliente")
      toast.success("Cliente añadido")
      setShowAddModal(false)
      setNewClient({ name: "", email: "", phone: "", notes: "" })
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/esthetician/clients/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": getCsrfToken() },
      })
      if (!res.ok) throw new Error()
      toast.success("Cliente eliminado")
      fetchData()
    } catch {
      toast.error("Error al eliminar cliente")
    }
  }

  if (status === "loading") return <div className="p-8 text-center text-[#666666]">{t("common.loading", locale)}</div>
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  if (user?.plan !== "ESTHETICIAN") redirect("/dashboard/profile")

  const totalAnalyses = clients.reduce((sum, c) => sum + c._count.analyses, 0)

  return (
    <div className="min-h-screen px-4 py-6 md:py-8 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              {t("esthetician.panelTitle", locale)}
            </h1>
            <p className="text-sm text-[#666666] mt-1">
              {clinic?.name || "—"} · {clients.length} {locale === "en" ? "patients" : "pacientes"}
              {clinic?.licenseNumber && ` · Lic. ${clinic.licenseNumber}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              {locale === "en" ? "Add Client" : "Añadir Cliente"}
            </Button>
            <Link href="/dashboard/report">
              <Button variant="secondary" size="sm">
                <FileText className="w-4 h-4 mr-1.5" />
                {t("esthetician.newReport", locale)}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: locale === "en" ? "Patients" : "Pacientes", value: clients.length, icon: Users, color: "#88B078" },
            { label: locale === "en" ? "Total Analyses" : "Total Análisis", value: totalAnalyses, icon: Activity, color: "#88B078" },
            { label: locale === "en" ? "Appointments" : "Citas", value: "—", icon: Calendar, color: "#D4A843" },
            { label: locale === "en" ? "Growth" : "Crecimiento", value: clients.length > 0 ? "+" + clients.length : "—", icon: TrendingUp, color: "#D4A843" },
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

        {/* Clinic Profile + Client List */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <h2 className="font-semibold text-sm text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D4A843]" />
                {locale === "en" ? "Clinic Profile" : "Perfil Profesional"}
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E2ECE0] flex items-center justify-center overflow-hidden">
                  {clinic?.logo ? (
                    <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-[#88B078]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{clinic?.name || "—"}</p>
                  <p className="text-xs text-[#666666]">{clinic?.licenseNumber ? `Lic. ${clinic.licenseNumber}` : "Sin licencia"}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {clinic?.address && <p className="text-[#666666]">📍 {clinic.address}</p>}
                {clinic?.phone && <p className="text-[#666666]">📞 {clinic.phone}</p>}
              </div>
              <Link href="/dashboard/clinic-settings">
                <Button variant="ghost" size="sm" className="text-xs mt-4 w-full justify-between">
                  <Edit2 className="w-3 h-3 mr-1.5" />
                  {locale === "en" ? "Edit Profile" : "Editar Perfil"} <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 p-5 border border-[#E8E8E8]/60">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4A843]" />
                  {locale === "en" ? "My Patients" : "Mis Pacientes"}
                  <Badge variant="secondary" className="text-[10px] ml-1">{clients.length}/200</Badge>
                </h2>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666666]" />
                  <input
                    type="text"
                    placeholder={locale === "en" ? "Search..." : "Buscar..."}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E8E8E8] bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#88B078]" /></div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto mb-3 text-[#666666]" />
                  <p className="text-sm text-[#666666] mb-2">
                    {locale === "en" ? "No patients yet" : "Aún no tienes pacientes"}
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    {locale === "en" ? "Add your first patient" : "Añadir tu primer paciente"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {clients.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FFF9E6] transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-[#E2ECE0] flex items-center justify-center text-sm font-medium text-[#88B078] shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{c.name}</p>
                          <div className="flex items-center gap-2 text-xs text-[#666666]">
                            {c.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{c.email}</span>}
                            {c.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                            <span>· {c._count.analyses} {locale === "en" ? "analyses" : "análisis"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteClient(c.id, c.name)}
                          className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#E07070] transition-colors"
                          aria-label={locale === "en" ? `Delete ${c.name}` : `Eliminar ${c.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#999999]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-[#E8E8E8]">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-xs rounded-lg border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
                  >Anterior</button>
                  <span className="text-xs text-[#666666] self-center">{page}/{totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 text-xs rounded-lg border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
                  >Siguiente</button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        {clinic?.referralCode && (
          <Card className="p-5 border border-[#E8E8E8]/60 bg-[#FFF9E6]">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FCEAA6] flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      {locale === "en" ? "Your Referral Code" : "Tu Código de Referido"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-lg font-bold text-[#88B078]">{clinic.referralCode}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(clinic.referralCode || "")
                          setCopied(true)
                          toast.success(locale === "en" ? "Copied!" : "¡Copiado!")
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="p-1.5 rounded-lg hover:bg-white transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-[#88B078]" /> : <Copy className="w-4 h-4 text-[#666666]" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#666666] mt-0.5">
                      {locale === "en"
                        ? `${referredTotal} clients have registered with your code`
                        : `${referredTotal} clientes se han registrado con tu código`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/esthetician/marketing">
                    <Button variant="primary" size="sm">
                      <Gift className="w-3.5 h-3.5 mr-1.5" />
                      {locale === "en" ? "Marketing Kit" : "Kit Marketing"}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tools */}
        <div>
          <h2 className="font-semibold text-base text-[#1A1A1A] mb-4">{t("esthetician.tools", locale)}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("esthetician.toolPDF", locale), icon: FileText, href: "/dashboard/report", desc: t("esthetician.toolPDFDesc", locale) },
              { label: t("esthetician.toolHistory", locale), icon: Clock, href: "/dashboard/history", desc: t("esthetician.toolHistoryDesc", locale) },
              { label: locale === "en" ? "Marketing Kit" : "Kit Marketing", icon: Gift, href: "/dashboard/esthetician/marketing", desc: locale === "en" ? "Grow your practice" : "Haz crecer tu práctica" },
              { label: t("esthetician.toolAnalysis", locale), icon: Activity, href: "/analysis", desc: t("esthetician.toolAnalysisDesc", locale) },
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
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  {locale === "en" ? "Add New Patient" : "Añadir Nuevo Paciente"}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-[#F0F0F0] transition-colors"
                  aria-label={locale === "en" ? "Close" : "Cerrar"}
                >
                  <X className="w-5 h-5 text-[#666666]" />
                </button>
              </div>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label htmlFor="modal-client-name" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    {locale === "en" ? "Name" : "Nombre"} <span className="text-[#E07070]">*</span>
                  </label>
                  <input id="modal-client-name" type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#88B078] text-[#1A1A1A]"
                    placeholder={locale === "en" ? "Patient name" : "Nombre del paciente"} required />
                </div>
                <div>
                  <label htmlFor="modal-client-email" className="block text-xs font-medium text-[#1A1A1A] mb-1">Email</label>
                  <input id="modal-client-email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#88B078] text-[#1A1A1A]"
                    placeholder="paciente@email.com" />
                </div>
                <div>
                  <label htmlFor="modal-client-phone" className="block text-xs font-medium text-[#1A1A1A] mb-1">Teléfono</label>
                  <input id="modal-client-phone" type="text" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#88B078] text-[#1A1A1A]"
                    placeholder="+53 5 1234567" />
                </div>
                <div>
                  <label htmlFor="modal-client-notes" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    {locale === "en" ? "Notes" : "Notas"}
                  </label>
                  <textarea id="modal-client-notes" value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} rows={3}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#88B078] text-[#1A1A1A] resize-none"
                    placeholder={locale === "en" ? "Skin type, concerns, treatments..." : "Tipo de piel, preocupaciones, tratamientos..."} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                    {locale === "en" ? "Cancel" : "Cancelar"}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={adding}>
                    {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                    {locale === "en" ? "Add" : "Añadir"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
