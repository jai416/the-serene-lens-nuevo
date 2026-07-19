"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardSkeleton } from "@/components/ui/skeleton"
import { Building2, Save, ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

export default function ClinicSettingsPage() {
  const pathname = usePathname()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (!session) return
    const fetchClinic = async () => {
      try {
        const res = await fetch("/api/user/clinic")
        const d = await res.json()
        const body = d?.data || d
        const clinic = body?.clinic
        if (clinic) {
          setName(clinic.name || "")
          setAddress(clinic.address || "")
          setPhone(clinic.phone || "")
          setLicenseNumber(clinic.licenseNumber || "")
          setLogo(clinic.logo || null)
        }
      } catch {}
      setLoading(false)
    }
    fetchClinic()
  }, [session, status])

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><CardSkeleton /></div>
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)
    try {
      const body: any = { name, address, phone, licenseNumber }
      if (logoFile) {
        body.logo = logo
      }
      const res = await fetch("/api/user/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || t("clinic.saveError", locale))
      }
      setSuccess(true)
      toast.success(t("clinic.saved", locale))
    } catch (e: any) {
      setError(e.message || t("clinic.saveError", locale))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <Link href="/dashboard/esthetician" className="text-xs text-[#666666] hover:text-[#1A1A1A] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> {t("clinic.back", locale)}
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-5 h-5 text-[#88B078]" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{t("clinic.title", locale)}</h1>
        </div>
        <p className="text-sm text-[#666666]">Actualiza la información profesional de tu clínica o consultorio.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[#E2ECE0] text-[#6F9A5E] text-sm mb-6">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t("clinic.saved", locale)}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#E2ECE0] flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#88B078]" />
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm text-[#88B078] hover:text-[#6F9A5E] font-medium">
                    {logo ? "Cambiar imagen" : "Subir imagen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    aria-label="Seleccionar logo"
                  />
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="clinic-name" className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">
                {t("clinic.name", locale)}
              </label>
              <Input
                id="clinic-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clínica Serenity"
                required
              />
            </div>

            <div>
              <label htmlFor="license-number" className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">
                {t("clinic.license", locale)}
              </label>
              <Input
                id="license-number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Ej: 12345"
              />
            </div>

            <div>
              <label htmlFor="clinic-address" className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">
                {t("clinic.address", locale)}
              </label>
              <Input
                id="clinic-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Calle 123, Ciudad"
              />
            </div>

            <div>
              <label htmlFor="clinic-phone" className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">
                {t("clinic.phone", locale)}
              </label>
              <Input
                id="clinic-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +53 5 1234567"
              />
            </div>

            <Button type="submit" disabled={saving} className="rounded-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? t("common.saving", locale) : t("clinic.save", locale)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
