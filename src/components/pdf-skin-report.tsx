"use client"

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666666", marginBottom: 10 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#1A1A1A", borderBottomWidth: 1, borderBottomColor: "#88B078", paddingBottom: 5 },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 120, fontSize: 10, color: "#666666" },
  value: { flex: 1, fontSize: 10, color: "#1A1A1A" },
  badge: { backgroundColor: "#88B078", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 5 },
  badgeText: { fontSize: 9, color: "#1A1A1A" },
  listItem: { flexDirection: "row", marginBottom: 4, paddingLeft: 10 },
  bullet: { width: 8, fontSize: 10, color: "#88B078" },
  text: { fontSize: 10, color: "#1A1A1A", lineHeight: 1.5 },
  routineStep: { flexDirection: "row", marginBottom: 6, paddingLeft: 10 },
  stepNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#88B078", textAlign: "center", lineHeight: 20, fontSize: 10, color: "#1A1A1A", marginRight: 8 },
  stepText: { flex: 1, fontSize: 10, color: "#1A1A1A", lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#E8E8E8", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#666666", textAlign: "center" },
  comparisonRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2ECE0", paddingVertical: 4 },
  comparisonLabel: { width: 100, fontSize: 9, color: "#666666" },
  comparisonPrev: { width: 120, fontSize: 9, color: "#9BAA93" },
  comparisonCurrent: { flex: 1, fontSize: 9, color: "#1A1A1A" },
  noData: { fontSize: 10, color: "#9BAA93", fontStyle: "italic" },
})

interface AnalysisData {
  id: string
  createdAt: string
  skinType?: string | null
  observations: string[]
  recommendations: string[]
  routine?: string | null
  concerns?: string | null
}

interface ReportProps {
  userName: string
  analyses: AnalysisData[]
  evolution?: {
    trend: string
    summary: string
  } | null
  monthlyComparison?: {
    current: string
    previous: string
    changes: string[]
  } | null
  dynamicRoutine?: {
    morning: string[]
    evening: string[]
    weekly: string[]
    notes: string
  } | null
}

function SkinReport({ userName, analyses, evolution, monthlyComparison, dynamicRoutine }: ReportProps) {
  const latestAnalysis = analyses[0]
  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Informe de Evolución Cutánea</Text>
        <Text style={styles.subtitle}>{userName} — {formatDate(new Date().toISOString())}</Text>

        {latestAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Último Análisis</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{formatDate(latestAnalysis.createdAt)}</Text>
            </View>
            {latestAnalysis.skinType && (
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de piel:</Text>
                <Text style={styles.value}>{latestAnalysis.skinType}</Text>
              </View>
            )}
            {latestAnalysis.concerns && (
              <View style={styles.row}>
                <Text style={styles.label}>Preocupaciones:</Text>
                <Text style={styles.value}>{latestAnalysis.concerns}</Text>
              </View>
            )}
            {latestAnalysis.observations.length > 0 && (
              <View>
                <Text style={{ ...styles.label, marginBottom: 5 }}>Observaciones:</Text>
                {latestAnalysis.observations.map((obs, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.text}>{obs}</Text>
                  </View>
                ))}
              </View>
            )}
            {latestAnalysis.recommendations.length > 0 && (
              <View>
                <Text style={{ ...styles.label, marginBottom: 5, marginTop: 8 }}>Recomendaciones:</Text>
                {latestAnalysis.recommendations.map((rec, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.text}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {evolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolución</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Tendencia: {evolution.trend}</Text>
            </View>
            <Text style={styles.text}>{evolution.summary}</Text>
          </View>
        )}

        {monthlyComparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparativa Mensual</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Métrica</Text>
              <Text style={styles.comparisonPrev}>Mes anterior</Text>
              <Text style={styles.comparisonCurrent}>Mes actual</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Período</Text>
              <Text style={styles.comparisonPrev}>{monthlyComparison.previous}</Text>
              <Text style={styles.comparisonCurrent}>{monthlyComparison.current}</Text>
            </View>
            {monthlyComparison.changes.map((change, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.text}>{change}</Text>
              </View>
            ))}
          </View>
        )}

        {dynamicRoutine && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rutina Personalizada</Text>
            <Text style={{ ...styles.label, marginBottom: 5 }}>Mañana:</Text>
            {dynamicRoutine.morning.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <Text style={{ ...styles.label, marginBottom: 5, marginTop: 8 }}>Noche:</Text>
            {dynamicRoutine.evening.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            {dynamicRoutine.weekly.length > 0 && (
              <View>
                <Text style={{ ...styles.label, marginBottom: 5, marginTop: 8 }}>Semanal:</Text>
                {dynamicRoutine.weekly.map((step, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.text}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
            {dynamicRoutine.notes && (
              <Text style={{ ...styles.text, marginTop: 8, fontStyle: "italic" }}>{dynamicRoutine.notes}</Text>
            )}
          </View>
        )}

        {analyses.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial ({analyses.length} análisis)</Text>
            {analyses.slice(0, 10).map((a, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{formatDate(a.createdAt)}</Text>
                <Text style={styles.value}>{a.skinType || "Sin tipo"}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            The Serene Lens — Este informe es solo para fines informativos y no constituye diagnóstico médico.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export function SkinReportDownload({ userName, analyses, evolution, monthlyComparison, dynamicRoutine }: ReportProps) {
  const fileName = `the-serene-lens-informe-${new Date().toISOString().split("T")[0]}.pdf`

  return (
    <PDFDownloadLink
      document={
        <SkinReport
          userName={userName}
          analyses={analyses}
          evolution={evolution}
          monthlyComparison={monthlyComparison}
          dynamicRoutine={dynamicRoutine}
        />
      }
      fileName={fileName}
    >
      {({ blob, url, loading, error }) => (
        <Button
          variant="primary"
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Download className="w-4 h-4 animate-pulse" />
              Generando PDF...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Descargar Informe PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
