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
