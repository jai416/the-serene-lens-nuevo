import { trackEvent } from "@/lib/analytics"

export function trackAnalysisStarted() {
  trackEvent("analysis_started", { step: 1 })
}

export function trackAnalysisPhotoUploaded(stepNumber: number, qualityPass: boolean) {
  trackEvent("analysis_photo_uploaded", { step_number: stepNumber, quality_pass: qualityPass })
}

export function trackAnalysisAbandoned(currentStep: number, photoCount: number) {
  trackEvent("analysis_abandoned", { current_step: currentStep, photos_taken: photoCount })
}

export function trackPaymentSuccess(provider: string, plan: string, amount: number) {
  trackEvent("payment_success", { provider, plan, amount })
}

export function trackPaymentFailed(provider: string, plan: string, error: string) {
  trackEvent("payment_failed", { provider, plan, error })
}

export function trackScannerShare(scannedProduct: string) {
  trackEvent("scanner_share", { product: scannedProduct })
}

export function trackAffiliateClick(provider: string, productName: string) {
  trackEvent("affiliate_click", { provider, product_name: productName })
}

export function trackB2bSignup(clinicName: string) {
  trackEvent("b2b_signup", { clinic_name: clinicName })
}

export function trackPdfGenerated(role: string) {
  trackEvent("pdf_generated", { role })
}

// ─── Embudo de conversión ────────────────────────────────────────
// Los 3 eventos que permiten medir guest → registro → pago.
// PostHog: ver el funnel con "insight: funnel" sobre estos nombres.

/** Un invitado completó su primer análisis (el paywall se le mostró). */
export function trackGuestAnalysisDone() {
  trackEvent("guest_analysis_done", { source: "web" })
}

/**
 * Alguien se registró después de haber hecho un análisis como invitado.
 * Se llama desde el registro; la marca se pone en `trackGuestAnalysisDone`.
 */
export function trackSignupFromGuest() {
  trackEvent("signup_from_guest", { source: "web" })
}

/**
 * Registro atribuido a una campaña (?from=... en /register: QR del one-pager,
 * Telegram, etc.). Permite medir qué canal trae registros.
 */
export function trackSignupFromSource(source: string) {
  trackEvent("signup_from_source", { source })
}

/**
 * Un usuario con prueba activa completó su primer pago real.
 * Se llama desde la página de éxito tras el cobro.
 */
export function trackTrialToPaid(provider: string, plan: string, amount: number) {
  trackEvent("trial_to_paid", { provider, plan, amount })
}
