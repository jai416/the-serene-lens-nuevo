"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, RefreshCw, Search, Clock, Filter } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface LogEntry {
  id: string
  action: string
  details: string | null
  ip: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

export default function AdminLogsPage() {
  const { data: session, status } = useSession()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState("")
  const [search, setSearch] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" })
      if (actionFilter) params.set("action", actionFilter)
      if (search.trim()) params.set("search", search.trim())

      const res = await fetch(`/api/admin/logs?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const body = data?.data || data
      setLogs(body.logs || [])
      setTotalPages(body.totalPages || 1)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (status === "loading") return <div />
  if (!session) redirect("/login?callbackUrl=/admin/logs")

  const actionColors: Record<string, string> = {
    activate_transfer: "bg-[#88B078]/20 text-[#88B078]",
    validate_transfer: "bg-[#D4A574]/20 text-[#D4A574]",
    cancel_transfer: "bg-[#E07070]/20 text-[#E07070]",
    admin_login: "bg-[#88B078]/20 text-[#88B078]",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#88B078]/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#88B078]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">Registros de Auditoría</h1>
            <p className="text-sm text-[#666666]">Acciones administrativas y eventos del sistema</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-1.5 text-xs text-[#666666] hover:bg-[#F0F0F0] px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Buscar por email o detalle..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E8] bg-white text-[#1A1A1A] placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#666666]" />
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
                className="text-xs rounded-lg border border-[#E8E8E8] bg-white text-[#1A1A1A] px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#88B078]"
              >
                <option value="">Todas las acciones</option>
                <option value="activate_transfer">Activar transferencia</option>
                <option value="validate_transfer">Validar transferencia</option>
                <option value="cancel_transfer">Cancelar transferencia</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-[#666666]">Cargando registros...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#666666]">No hay registros de auditoría</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E8E8E8]">
                    <th className="text-left py-2 px-3 font-medium text-[#666666]">Fecha</th>
                    <th className="text-left py-2 px-3 font-medium text-[#666666]">Acción</th>
                    <th className="text-left py-2 px-3 font-medium text-[#666666]">Usuario</th>
                    <th className="text-left py-2 px-3 font-medium text-[#666666]">Detalle</th>
                    <th className="text-left py-2 px-3 font-medium text-[#666666]">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#E8E8E8] hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#666666] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString("es-ES")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${actionColors[log.action] || "bg-[#E8E8E8] text-[#666666]"}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#1A1A1A] font-medium">
                        {log.user?.name || log.user?.email || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#666666] max-w-xs truncate">{log.details || "—"}</td>
                      <td className="py-2.5 px-3 text-[#666666] font-mono">{log.ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs text-[#666666] self-center">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
