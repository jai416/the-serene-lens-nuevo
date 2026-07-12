export type Locale = "en" | "es"

export type TranslationKey =
  | "app.name"
  | "app.tagline"
  | "nav.home"
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
  | "nav.login"
  | "sidebar.tagline"
  | "sidebar.premiumVersion"
  | "sidebar.premiumDesc"
  | "sidebar.upgradeNow"
  | "sidebar.login"
  | "sidebar.copyright"
  | "sidebar.menuLabel"
  | "sidebar.plan"
  | "sidebar.report"
  | "sidebar.myGuides"
  | "topHeader.premiumUser"
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
  | "profile.saveError"
  | "profile.accountDeleted"
  | "profile.deleteError"
  | "profile.deleteAccount"
  | "profile.deleteWarning"
  | "profile.confirmDelete"
  | "profile.cancel"
  | "profile.viewHistory"
  | "profile.namePlaceholder"
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
  | "common.user"
  | "common.retry"
  | "common.saving"
  | "common.all"
  | "common.previous"
  | "common.next"
  | "common.download"
  | "common.see"
  | "common.select"
  | "common.gotIt"
  | "common.somethingWentWrong"
  | "common.disclaimer"
  | "esthetician.panelTitle"
  | "esthetician.clinicSummary"
  | "esthetician.newReport"
  | "esthetician.patients"
  | "esthetician.totalAnalyses"
  | "esthetician.todayConsultations"
  | "esthetician.growth"
  | "esthetician.professionalProfile"
  | "esthetician.clinicLabel"
  | "esthetician.phoneLabel"
  | "esthetician.addressLabel"
  | "esthetician.licenseLabel"
  | "esthetician.completeProfile"
  | "esthetician.editProfile"
  | "esthetician.recentPatients"
  | "esthetician.noName"
  | "esthetician.noPatients"
  | "esthetician.tools"
  | "esthetician.toolPDF"
  | "esthetician.toolHistory"
  | "esthetician.toolSearch"
  | "esthetician.toolAnalysis"
  | "esthetician.toolPDFDesc"
  | "esthetician.toolHistoryDesc"
  | "esthetician.toolSearchDesc"
  | "esthetician.toolAnalysisDesc"
  | "esthetician.allPatients"
  | "esthetician.patient"
  | "esthetician.emailCol"
  | "esthetician.analysesCol"
  | "esthetician.lastCol"
  | "dashboard.greeting"
  | "dashboard.heroTitle"
  | "dashboard.heroDesc"
  | "dashboard.startAnalysis"
  | "dashboard.seeHow"
  | "dashboard.whatToDo"
  | "dashboard.card1Title"
  | "dashboard.card1Desc"
  | "dashboard.card2Title"
  | "dashboard.card2Desc"
  | "dashboard.card3Title"
  | "dashboard.card3Desc"
  | "dashboard.card4Title"
  | "dashboard.card4Desc"
  | "dashboard.yourProgress"
  | "dashboard.progressDesc"
  | "dashboard.goodStatus"
  | "dashboard.unlimited"
  | "dashboard.remainingMonthly"
  | "dashboard.viewPlan"
  | "dashboard.latestAnalysis"
  | "dashboard.viewResults"
  | "dashboard.noAnalysis"
  | "dashboard.startNow"
  | "dashboard.reminders"
  | "dashboard.reminder1"
  | "dashboard.reminder2"
  | "dashboard.reminder3"
  | "dashboard.viewRoutine"
  | "dashboard.sunProtection"
  | "dashboard.spfReminder"
  | "dashboard.recentAnalyses"
  | "dashboard.analysisLabel"
  | "dashboard.errorLoading"

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    "app.name": "The Serene Lens",
    "app.tagline": "AI-Powered Skin Observation",
    "nav.home": "Home",
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
    "nav.login": "Sign In",
    "sidebar.tagline": "Know your skin better",
    "sidebar.premiumVersion": "Premium Version",
    "sidebar.premiumDesc": "Unlock unlimited analyses and full history",
    "sidebar.upgradeNow": "Upgrade now",
    "sidebar.login": "Sign In",
    "sidebar.copyright": "The Serene Lens",
    "sidebar.menuLabel": "Menu",
    "sidebar.plan": "Plan",
    "sidebar.report": "Report",
    "sidebar.myGuides": "My Guides",
    "topHeader.premiumUser": "Premium User",
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
    "profile.saveError": "Error saving changes",
    "profile.accountDeleted": "Account deleted",
    "profile.deleteError": "Could not delete account",
    "profile.deleteAccount": "Delete Account",
    "profile.deleteWarning": "This permanently deletes your account and all data. This cannot be undone.",
    "profile.confirmDelete": "Confirm Deletion",
    "profile.cancel": "Cancel",
    "profile.viewHistory": "View history",
    "profile.namePlaceholder": "Your name",
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
    "common.user": "User",
    "common.retry": "Retry",
    "common.saving": "Saving...",
    "common.all": "All",
    "common.previous": "Previous",
    "common.next": "Next",
    "common.download": "Download",
    "common.see": "See",
    "common.select": "Select",
    "common.gotIt": "Got it",
    "common.somethingWentWrong": "Something went wrong",
    "common.disclaimer": "This analysis is for informational purposes only and does not constitute a medical diagnosis. Always consult a healthcare professional for skin concerns.",
    "esthetician.panelTitle": "Esthetician Panel",
    "esthetician.clinicSummary": "{name} · {n} patients",
    "esthetician.newReport": "New Report",
    "esthetician.patients": "Patients",
    "esthetician.totalAnalyses": "Total Analyses",
    "esthetician.todayConsultations": "Today",
    "esthetician.growth": "Growth",
    "esthetician.professionalProfile": "Professional Profile",
    "esthetician.clinicLabel": "Clinic:",
    "esthetician.phoneLabel": "Phone:",
    "esthetician.addressLabel": "Address:",
    "esthetician.licenseLabel": "License:",
    "esthetician.completeProfile": "Complete your professional profile.",
    "esthetician.editProfile": "Edit profile",
    "esthetician.recentPatients": "Recent Patients",
    "esthetician.noName": "No name",
    "esthetician.noPatients": "You don't have linked patients yet.",
    "esthetician.tools": "Tools",
    "esthetician.toolPDF": "PDF Reports",
    "esthetician.toolHistory": "Clinical History",
    "esthetician.toolSearch": "Search Patient",
    "esthetician.toolAnalysis": "Quick Analysis",
    "esthetician.toolPDFDesc": "Generate branded professional reports",
    "esthetician.toolHistoryDesc": "Full analysis history",
    "esthetician.toolSearchDesc": "Find registered patients",
    "esthetician.toolAnalysisDesc": "New analysis for patient",
    "esthetician.allPatients": "All Patients",
    "esthetician.patient": "Patient",
    "esthetician.emailCol": "Email",
    "esthetician.analysesCol": "Analyses",
    "esthetician.lastCol": "Last",
    "dashboard.greeting": "Hi, {name}!",
    "dashboard.heroTitle": "Know your skin better",
    "dashboard.heroDesc": "Discover the visible characteristics of your skin with AI-powered cosmetic analysis. Observe, learn, and improve your personal care routine.",
    "dashboard.startAnalysis": "Start Analysis",
    "dashboard.seeHow": "See how it works",
    "dashboard.whatToDo": "What do you want to do today?",
    "dashboard.card1Title": "Skin Analysis",
    "dashboard.card1Desc": "Scan your face with AI",
    "dashboard.card2Title": "History",
    "dashboard.card2Desc": "{n} saved analyses",
    "dashboard.card3Title": "Routines",
    "dashboard.card3Desc": "Your daily care diary",
    "dashboard.card4Title": "Ingredients",
    "dashboard.card4Desc": "Analyze products and components",
    "dashboard.yourProgress": "Your Progress",
    "dashboard.progressDesc": "Your skincare evolution",
    "dashboard.goodStatus": "Good condition",
    "dashboard.unlimited": "Unlimited analyses",
    "dashboard.remainingMonthly": "{n} analyses remaining this month",
    "dashboard.viewPlan": "View plan",
    "dashboard.latestAnalysis": "Latest Analysis",
    "dashboard.viewResults": "View results",
    "dashboard.noAnalysis": "You haven't done any analyses yet.",
    "dashboard.startNow": "Start now",
    "dashboard.reminders": "Reminders",
    "dashboard.reminder1": "Apply sunscreen every 2 hours",
    "dashboard.reminder2": "Cleanse face morning and night",
    "dashboard.reminder3": "Moisturize after every cleanse",
    "dashboard.viewRoutine": "View routine",
    "dashboard.sunProtection": "Sun Protection",
    "dashboard.spfReminder": "Use SPF 50+ every day",
    "dashboard.recentAnalyses": "Recent Analyses",
    "dashboard.analysisLabel": "Analysis {type}",
    "dashboard.errorLoading": "Error loading analyses",
  },
  es: {
    "app.name": "The Serene Lens",
    "app.tagline": "Observación de Piel con IA",
    "nav.home": "Inicio",
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
    "nav.login": "Iniciar sesión",
    "sidebar.tagline": "Conoce mejor tu piel",
    "sidebar.premiumVersion": "Versión Premium",
    "sidebar.premiumDesc": "Desbloquea análisis ilimitados e historial completo",
    "sidebar.upgradeNow": "Mejorar ahora",
    "sidebar.login": "Iniciar sesión",
    "sidebar.copyright": "The Serene Lens",
    "sidebar.menuLabel": "Menú",
    "sidebar.plan": "Plan",
    "sidebar.report": "Informe",
    "sidebar.myGuides": "Mis Guías",
    "topHeader.premiumUser": "Usuario Premium",
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
    "profile.saveError": "Error al guardar los cambios",
    "profile.accountDeleted": "Cuenta eliminada",
    "profile.deleteError": "No se pudo eliminar la cuenta",
    "profile.deleteAccount": "Eliminar Cuenta",
    "profile.deleteWarning": "Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.",
    "profile.confirmDelete": "Confirmar Eliminación",
    "profile.cancel": "Cancelar",
    "profile.viewHistory": "Ver historial",
    "profile.namePlaceholder": "Tu nombre",
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
    "common.user": "Usuario",
    "common.retry": "Reintentar",
    "common.saving": "Guardando...",
    "common.all": "Todos",
    "common.previous": "Anterior",
    "common.next": "Siguiente",
    "common.download": "Descargar",
    "common.see": "Ver",
    "common.select": "Selecciona",
    "common.gotIt": "Entendido",
    "common.somethingWentWrong": "Algo salió mal",
    "common.disclaimer": "Este análisis es solo informativo y no constituye un diagnóstico médico. Consulta siempre a un profesional de la salud para problemas de la piel.",
    "esthetician.panelTitle": "Panel Esteticista",
    "esthetician.clinicSummary": "{name} · {n} pacientes",
    "esthetician.newReport": "Nuevo informe",
    "esthetician.patients": "Pacientes",
    "esthetician.totalAnalyses": "Análisis totales",
    "esthetician.todayConsultations": "Consultas hoy",
    "esthetician.growth": "Crecimiento",
    "esthetician.professionalProfile": "Perfil profesional",
    "esthetician.clinicLabel": "Clínica:",
    "esthetician.phoneLabel": "Teléfono:",
    "esthetician.addressLabel": "Dirección:",
    "esthetician.licenseLabel": "Licencia:",
    "esthetician.completeProfile": "Completa tu perfil profesional.",
    "esthetician.editProfile": "Editar perfil",
    "esthetician.recentPatients": "Pacientes recientes",
    "esthetician.noName": "Sin nombre",
    "esthetician.noPatients": "Aún no tienes pacientes vinculados.",
    "esthetician.tools": "Herramientas",
    "esthetician.toolPDF": "Informes PDF",
    "esthetician.toolHistory": "Historial clínico",
    "esthetician.toolSearch": "Buscar paciente",
    "esthetician.toolAnalysis": "Análisis rápido",
    "esthetician.toolPDFDesc": "Genera informes profesionales con tu marca",
    "esthetician.toolHistoryDesc": "Historial completo de análisis",
    "esthetician.toolSearchDesc": "Encuentra pacientes registrados",
    "esthetician.toolAnalysisDesc": "Nuevo análisis para paciente",
    "esthetician.allPatients": "Todos los pacientes",
    "esthetician.patient": "Paciente",
    "esthetician.emailCol": "Email",
    "esthetician.analysesCol": "Análisis",
    "esthetician.lastCol": "Último",
    "dashboard.greeting": "¡Hola, {name}!",
    "dashboard.heroTitle": "Conoce mejor tu piel",
    "dashboard.heroDesc": "Descubre las características visibles de tu piel con análisis cosmético por IA. Observa, aprende y mejora tu rutina de cuidado personal.",
    "dashboard.startAnalysis": "Comenzar análisis",
    "dashboard.seeHow": "Ver cómo funciona",
    "dashboard.whatToDo": "¿Qué quieres hacer hoy?",
    "dashboard.card1Title": "Análisis de piel",
    "dashboard.card1Desc": "Escanea tu rostro con IA",
    "dashboard.card2Title": "Historial",
    "dashboard.card2Desc": "{n} análisis guardados",
    "dashboard.card3Title": "Rutinas",
    "dashboard.card3Desc": "Tu diario de cuidado diario",
    "dashboard.card4Title": "Ingredientes",
    "dashboard.card4Desc": "Analiza productos y componentes",
    "dashboard.yourProgress": "Tu progreso",
    "dashboard.progressDesc": "Evolución de tu cuidado facial",
    "dashboard.goodStatus": "Buen estado",
    "dashboard.unlimited": "Análisis ilimitados",
    "dashboard.remainingMonthly": "{n} análisis restantes este mes",
    "dashboard.viewPlan": "Ver plan",
    "dashboard.latestAnalysis": "Último análisis",
    "dashboard.viewResults": "Ver resultados",
    "dashboard.noAnalysis": "Aún no has realizado ningún análisis.",
    "dashboard.startNow": "Comenzar ahora",
    "dashboard.reminders": "Recordatorios",
    "dashboard.reminder1": "Aplica protector solar cada 2 horas",
    "dashboard.reminder2": "Limpieza facial mañana y noche",
    "dashboard.reminder3": "Hidrata tu piel después de cada limpieza",
    "dashboard.viewRoutine": "Ver rutina",
    "dashboard.sunProtection": "Protección solar",
    "dashboard.spfReminder": "Usa SPF 50+ todos los días",
    "dashboard.recentAnalyses": "Análisis recientes",
    "dashboard.analysisLabel": "Análisis {type}",
    "dashboard.errorLoading": "Error al cargar análisis",
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
