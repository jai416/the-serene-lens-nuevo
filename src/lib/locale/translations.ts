export type Locale = "en" | "es"

type TranslationKey =
  | "app.name"
  | "app.tagline"
  | "nav.analysis"
  | "nav.history"
  | "nav.profile"
  | "nav.subscription"
  | "nav.diary"
  | "nav.challenges"
  | "nav.products"
  | "nav.ingredients"
  | "nav.guides"
  | "nav.blog"
  | "nav.pricing"
  | "nav.esthetician"
  | "nav.admin"
  | "nav.logout"
  | "nav.support"
  | "profile.title"
  | "profile.name"
  | "profile.email"
  | "profile.plan"
  | "profile.registered"
  | "profile.analyses"
  | "profile.language"
  | "profile.save"
  | "profile.saving"
  | "profile.saved"
  | "profile.deleteAccount"
  | "profile.deleteWarning"
  | "profile.confirmDelete"
  | "profile.cancel"
  | "analysis.title"
  | "analysis.new"
  | "analysis.results"
  | "plan.essential"
  | "plan.premium"
  | "plan.pro"
  | "plan.proPlus"
  | "plan.esthetician"
  | "plan.manage"
  | "plan.upgrade"
  | "plan.features.essential"
  | "plan.features.premium"
  | "plan.features.pro"
  | "plan.features.proPlus"
  | "plan.features.esthetician"
  | "common.loading"
  | "common.error"
  | "common.success"
  | "common.back"
  | "common.save"

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    "app.name": "The Serene Lens",
    "app.tagline": "AI-Powered Skin Observation",
    "nav.analysis": "New Analysis",
    "nav.history": "History",
    "nav.profile": "My Account",
    "nav.subscription": "Subscription",
    "nav.diary": "Skin Diary",
    "nav.challenges": "Challenges",
    "nav.products": "Products",
    "nav.ingredients": "Ingredients",
    "nav.guides": "Guides",
    "nav.blog": "Blog",
    "nav.pricing": "Pricing",
    "nav.esthetician": "Esthetician",
    "nav.admin": "Admin",
    "nav.logout": "Sign Out",
    "nav.support": "Support",
    "profile.title": "My Account",
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.plan": "Plan",
    "profile.registered": "Registered",
    "profile.analyses": "Analyses",
    "profile.language": "Language",
    "profile.save": "Save Changes",
    "profile.saving": "Saving...",
    "profile.saved": "Profile updated",
    "profile.deleteAccount": "Delete Account",
    "profile.deleteWarning": "This permanently deletes your account and all data. This cannot be undone.",
    "profile.confirmDelete": "Confirm Deletion",
    "profile.cancel": "Cancel",
    "analysis.title": "Skin Analysis",
    "analysis.new": "New Analysis",
    "analysis.results": "Results",
    "plan.essential": "Essential",
    "plan.premium": "Premium",
    "plan.pro": "Pro",
    "plan.proPlus": "Pro+",
    "plan.esthetician": "Esthetician",
    "plan.manage": "Manage",
    "plan.upgrade": "Upgrade Plan",
    "plan.features.essential": "1 free analysis per month",
    "plan.features.premium": "3 analyses per month",
    "plan.features.pro": "5 analyses per month + dynamic routine",
    "plan.features.proPlus": "Unlimited analyses + PDF reports",
    "plan.features.esthetician": "Unlimited professional access",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.back": "Back",
    "common.save": "Save",
  },
  es: {
    "app.name": "The Serene Lens",
    "app.tagline": "Observación de Piel con IA",
    "nav.analysis": "Nuevo Análisis",
    "nav.history": "Historial",
    "nav.profile": "Mi Cuenta",
    "nav.subscription": "Suscripción",
    "nav.diary": "Diario",
    "nav.challenges": "Desafíos",
    "nav.products": "Productos",
    "nav.ingredients": "Ingredientes",
    "nav.guides": "Guías",
    "nav.blog": "Blog",
    "nav.pricing": "Precios",
    "nav.esthetician": "Esteticista",
    "nav.admin": "Admin",
    "nav.logout": "Cerrar Sesión",
    "nav.support": "Soporte",
    "profile.title": "Mi Cuenta",
    "profile.name": "Nombre",
    "profile.email": "Email",
    "profile.plan": "Plan",
    "profile.registered": "Registrado",
    "profile.analyses": "Análisis",
    "profile.language": "Idioma",
    "profile.save": "Guardar Cambios",
    "profile.saving": "Guardando...",
    "profile.saved": "Perfil actualizado",
    "profile.deleteAccount": "Eliminar Cuenta",
    "profile.deleteWarning": "Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.",
    "profile.confirmDelete": "Confirmar Eliminación",
    "profile.cancel": "Cancelar",
    "analysis.title": "Análisis de Piel",
    "analysis.new": "Nuevo Análisis",
    "analysis.results": "Resultados",
    "plan.essential": "Essential",
    "plan.premium": "Premium",
    "plan.pro": "Pro",
    "plan.proPlus": "Pro+",
    "plan.esthetician": "Esteticista",
    "plan.manage": "Gestionar",
    "plan.upgrade": "Mejorar Plan",
    "plan.features.essential": "1 análisis gratis por mes",
    "plan.features.premium": "3 análisis por mes",
    "plan.features.pro": "5 análisis por mes + rutina dinámica",
    "plan.features.proPlus": "Análisis ilimitados + informes PDF",
    "plan.features.esthetician": "Acceso profesional ilimitado",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.back": "Volver",
    "common.save": "Guardar",
  },
}

export function t(key: TranslationKey, locale: Locale): string {
  return translations[locale]?.[key] || translations.en[key] || key
}

export function detectLocale(acceptLanguage?: string): Locale {
  if (acceptLanguage) {
    const langs = acceptLanguage.split(",").map((l) => l.split(";")[0].trim().toLowerCase())
    if (langs.some((l) => l.startsWith("en"))) return "en"
    if (langs.some((l) => l.startsWith("es"))) return "es"
  }
  return "es"
}

export function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "es"
  const lang = navigator.language?.toLowerCase() || ""
  if (lang.startsWith("es")) return "es"
  return "en"
}
