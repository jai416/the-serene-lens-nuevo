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
  | "common.search"
  | "common.status"
  | "common.active"
  | "common.inactive"
  | "common.send"
  | "common.subject"
  | "common.message"
  | "common.noData"
  | "common.optional"
  | "common.cancel"
  | "common.monday"
  | "common.tuesday"
  | "common.wednesday"
  | "common.thursday"
  | "common.friday"
  | "common.saturday"
  | "common.sunday"
  | "common.january"
  | "common.february"
  | "common.march"
  | "common.april"
  | "common.may"
  | "common.june"
  | "common.july"
  | "common.august"
  | "common.september"
  | "common.october"
  | "common.november"
  | "common.december"
  | "sidebar.sectionMain"
  | "sidebar.sectionResources"
  | "sidebar.sectionStore"
  | "sidebar.sectionAccount"
  | "sidebar.sectionAdmin"
  | "sidebar.sectionProfessional"
  | "footer.observation"
  | "footer.product"
  | "footer.analysis"
  | "footer.products"
  | "footer.pricing"
  | "footer.info"
  | "footer.blog"
  | "footer.privacy"
  | "footer.terms"
  | "footer.security"
  | "footer.rights"
  | "footer.madeWith"
  | "history.title"
  | "history.subtitle"
  | "history.empty"
  | "history.startAnalysis"
  | "history.analysisLabel"
  | "history.skinType"
  | "history.date"
  | "subscription.title"
  | "subscription.currentPlan"
  | "subscription.active"
  | "subscription.free"
  | "subscription.manage"
  | "subscription.analysesAvailable"
  | "subscription.packs"
  | "subscription.paymentHistory"
  | "subscription.noPayments"
  | "subscription.amount"
  | "subscription.date"
  | "subscription.status"
  | "subscription.paid"
  | "subscription.pending"
  | "report.title"
  | "report.subtitle"
  | "report.monthlyComparison"
  | "report.dynamicRoutine"
  | "report.morning"
  | "report.night"
  | "report.weekly"
  | "report.lastAnalysis"
  | "report.pdfReport"
  | "report.pdfAvailable"
  | "report.availableWith"
  | "diary.title"
  | "diary.subtitle"
  | "diary.weekSummary"
  | "diary.improved"
  | "diary.stable"
  | "diary.worsened"
  | "diary.formTitle"
  | "diary.formFeeling"
  | "diary.formNotes"
  | "diary.formSave"
  | "diary.legend"
  | "diary.good"
  | "diary.fair"
  | "diary.poor"
  | "diary.empty"
  | "support.title"
  | "support.subtitle"
  | "support.sendMessage"
  | "support.subject"
  | "support.message"
  | "support.send"
  | "support.sent"
  | "support.myMessages"
  | "support.noMessages"
  | "support.reply"
  | "support.read"
  | "support.unread"
  | "guides.title"
  | "guides.subtitle"
  | "guides.empty"
  | "guides.browse"
  | "guides.download"
  | "challenges.title"
  | "challenges.comingSoon"
  | "referrals.title"
  | "referrals.comingSoon"
  | "social.title"
  | "social.comingSoon"
  | "clinic.title"
  | "clinic.back"
  | "clinic.name"
  | "clinic.license"
  | "clinic.address"
  | "clinic.phone"
  | "clinic.save"
  | "clinic.saved"
  | "clinic.saveError"
  | "b2b.title"
  | "b2b.notAvailable"
  | "b2b.exclusive"
  | "b2b.myClinic"
  | "b2b.analyses"
  | "b2b.esthetician"
  | "b2b.customization"
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
  | "esthetician.referralCode"
  | "esthetician.referredUsers"
  | "esthetician.marketingKit"
  | "esthetician.marketingDesc"
  | "esthetician.shareCode"
  | "esthetician.shareDesc"
  | "esthetician.discountCode"
  | "esthetician.discountDesc"
  | "esthetician.generateDiscount"
  | "esthetician.discountGenerated"
  | "esthetician.yourCodeIs"
  | "esthetician.copyCode"
  | "esthetician.copied"
  | "esthetician.flyerTitle"
  | "esthetician.emailTemplate"
  | "esthetician.emailSubject"
  | "esthetician.emailBody"
  | "esthetician.estheticianCodeLabel"
  | "esthetician.codePlaceholder"
  | "esthetician.codeHelp"
  | "esthetician.codeInvalid"
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
    "common.search": "Search",
    "common.status": "Status",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.send": "Send",
    "common.subject": "Subject",
    "common.message": "Message",
    "common.noData": "No data",
    "common.optional": "Optional",
    "common.cancel": "Cancel",
    "common.monday": "Monday",
    "common.tuesday": "Tuesday",
    "common.wednesday": "Wednesday",
    "common.thursday": "Thursday",
    "common.friday": "Friday",
    "common.saturday": "Saturday",
    "common.sunday": "Sunday",
    "common.january": "January",
    "common.february": "February",
    "common.march": "March",
    "common.april": "April",
    "common.may": "May",
    "common.june": "June",
    "common.july": "July",
    "common.august": "August",
    "common.september": "September",
    "common.october": "October",
    "common.november": "November",
    "common.december": "December",
    "sidebar.sectionMain": "Main",
    "sidebar.sectionResources": "Resources",
    "sidebar.sectionStore": "Store",
    "sidebar.sectionAccount": "Account",
    "sidebar.sectionAdmin": "Admin",
    "sidebar.sectionProfessional": "Professional",
    "footer.observation": "Cosmetic observation with AI",
    "footer.product": "Product",
    "footer.analysis": "Analysis",
    "footer.products": "Products",
    "footer.pricing": "Pricing",
    "footer.info": "Information",
    "footer.blog": "Blog",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.security": "Security",
    "footer.rights": "All rights reserved.",
    "footer.madeWith": "Made with love for your skin",
    "history.title": "My History",
    "history.subtitle": "All your skin analyses in one place",
    "history.empty": "You haven't saved any analyses yet.",
    "history.startAnalysis": "Do your first analysis",
    "history.analysisLabel": "Analysis - {type} Skin",
    "history.skinType": "Skin type",
    "history.date": "Date",
    "subscription.title": "My Subscription",
    "subscription.currentPlan": "Current Plan",
    "subscription.active": "Active",
    "subscription.free": "Free",
    "subscription.manage": "Manage",
    "subscription.analysesAvailable": "Analyses Available",
    "subscription.packs": "Packs",
    "subscription.paymentHistory": "Payment History",
    "subscription.noPayments": "No payments recorded",
    "subscription.amount": "Amount",
    "subscription.date": "Date",
    "subscription.status": "Status",
    "subscription.paid": "Paid",
    "subscription.pending": "Pending",
    "report.title": "Report & Routine",
    "report.subtitle": "Your Personalized Report",
    "report.monthlyComparison": "Monthly Comparison",
    "report.dynamicRoutine": "Dynamic Routine",
    "report.morning": "MORNING",
    "report.night": "NIGHT",
    "report.weekly": "WEEKLY",
    "report.lastAnalysis": "Last Analysis",
    "report.pdfReport": "Full PDF Report",
    "report.pdfAvailable": "Available with Pro+ or Esthetician plan",
    "report.availableWith": "Available with {plan} plan",
    "diary.title": "Skin Diary",
    "diary.subtitle": "My Skin Diary",
    "diary.weekSummary": "This week your skin has {trend}",
    "diary.improved": "improved",
    "diary.stable": "stayed stable",
    "diary.worsened": "worsened",
    "diary.formTitle": "How is your skin today?",
    "diary.formFeeling": "Feeling",
    "diary.formNotes": "Notes",
    "diary.formSave": "Save entry",
    "diary.legend": "Legend",
    "diary.good": "Good",
    "diary.fair": "Fair",
    "diary.poor": "Poor",
    "diary.empty": "No entries yet",
    "support.title": "Support",
    "support.subtitle": "Need help?",
    "support.sendMessage": "Send us a message",
    "support.subject": "Subject",
    "support.message": "Message",
    "support.send": "Send message",
    "support.sent": "Message sent. We'll reply soon.",
    "support.myMessages": "My Messages",
    "support.noMessages": "No messages",
    "support.reply": "Reply",
    "support.read": "Read",
    "support.unread": "Unread",
    "guides.title": "My Guides",
    "guides.subtitle": "Purchased Guides",
    "guides.empty": "You haven't purchased any guides yet",
    "guides.browse": "Browse guides",
    "guides.download": "Download",
    "challenges.title": "Challenges",
    "challenges.comingSoon": "We're preparing new challenges. Coming soon!",
    "referrals.title": "Referrals",
    "referrals.comingSoon": "Soon you'll be able to invite your friends and earn rewards.",
    "social.title": "Community",
    "social.comingSoon": "Soon you'll be able to compare results and share your progress.",
    "clinic.title": "Clinic Settings",
    "clinic.back": "Back to panel",
    "clinic.name": "Clinic Name",
    "clinic.license": "License Number",
    "clinic.address": "Address",
    "clinic.phone": "Phone",
    "clinic.save": "Save Changes",
    "clinic.saved": "Settings saved",
    "clinic.saveError": "Error saving settings",
    "b2b.title": "B2B Panel",
    "b2b.notAvailable": "Plan not available",
    "b2b.exclusive": "This panel is exclusive to B2B clients.",
    "b2b.myClinic": "My Clinic",
    "b2b.analyses": "Analyses performed",
    "b2b.esthetician": "Esthetician",
    "b2b.customization": "Customization",
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
    "esthetician.referralCode": "Your Referral Code",
    "esthetician.referredUsers": "Referred Clients",
    "esthetician.marketingKit": "Marketing Kit",
    "esthetician.marketingDesc": "Download resources to grow your practice",
    "esthetician.shareCode": "Share Your Code",
    "esthetician.shareDesc": "Give this code to your clients so they get a discount when registering",
    "esthetician.discountCode": "Discount Code",
    "esthetician.discountDesc": "Unique discount for referrals via your code",
    "esthetician.generateDiscount": "Generate Discount Code",
    "esthetician.discountGenerated": "Discount code generated!",
    "esthetician.yourCodeIs": "Your code is",
    "esthetician.copyCode": "Copy Code",
    "esthetician.copied": "Copied!",
    "esthetician.flyerTitle": "Digital Flyer",
    "esthetician.emailTemplate": "Email Template",
    "esthetician.emailSubject": "I invite you to discover your skin with AI",
    "esthetician.emailBody": "Hi! I'm using The Serene Lens with my clients. Use my code {code} when registering and get a special discount. It's an AI-powered skin analysis tool that helps us track your progress professionally.",
    "esthetician.estheticianCodeLabel": "Esthetician Code (optional)",
    "esthetician.codePlaceholder": "e.g. EST-ABC123",
    "esthetician.codeHelp": "If an esthetician gave you a code, enter it here to link your account",
    "esthetician.codeInvalid": "Invalid esthetician code",
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
    "common.search": "Buscar",
    "common.status": "Estado",
    "common.active": "Activo",
    "common.inactive": "Inactivo",
    "common.send": "Enviar",
    "common.subject": "Asunto",
    "common.message": "Mensaje",
    "common.noData": "Sin datos",
    "common.optional": "Opcional",
    "common.cancel": "Cancelar",
    "common.monday": "Lunes",
    "common.tuesday": "Martes",
    "common.wednesday": "Miércoles",
    "common.thursday": "Jueves",
    "common.friday": "Viernes",
    "common.saturday": "Sábado",
    "common.sunday": "Domingo",
    "common.january": "Enero",
    "common.february": "Febrero",
    "common.march": "Marzo",
    "common.april": "Abril",
    "common.may": "Mayo",
    "common.june": "Junio",
    "common.july": "Julio",
    "common.august": "Agosto",
    "common.september": "Septiembre",
    "common.october": "Octubre",
    "common.november": "Noviembre",
    "common.december": "Diciembre",
    "sidebar.sectionMain": "Principal",
    "sidebar.sectionResources": "Recursos",
    "sidebar.sectionStore": "Tienda",
    "sidebar.sectionAccount": "Cuenta",
    "sidebar.sectionAdmin": "Admin",
    "sidebar.sectionProfessional": "Profesional",
    "footer.observation": "Observación cosmética con IA",
    "footer.product": "Producto",
    "footer.analysis": "Análisis",
    "footer.products": "Productos",
    "footer.pricing": "Precios",
    "footer.info": "Información",
    "footer.blog": "Blog",
    "footer.privacy": "Privacidad",
    "footer.terms": "Términos",
    "footer.security": "Seguridad",
    "footer.rights": "Todos los derechos reservados.",
    "footer.madeWith": "Hecho con amor para tu piel",
    "history.title": "Mi Historial",
    "history.subtitle": "Todos tus análisis de piel en un solo lugar",
    "history.empty": "Aún no has guardado ningún análisis.",
    "history.startAnalysis": "Haz tu primer análisis",
    "history.analysisLabel": "Análisis - Piel {type}",
    "history.skinType": "Tipo de piel",
    "history.date": "Fecha",
    "subscription.title": "Mi Suscripción",
    "subscription.currentPlan": "Plan Actual",
    "subscription.active": "Activo",
    "subscription.free": "Gratuito",
    "subscription.manage": "Gestionar",
    "subscription.analysesAvailable": "Análisis Disponibles",
    "subscription.packs": "Paquetes",
    "subscription.paymentHistory": "Historial de Pagos",
    "subscription.noPayments": "Sin pagos registrados",
    "subscription.amount": "Monto",
    "subscription.date": "Fecha",
    "subscription.status": "Estado",
    "subscription.paid": "Pagado",
    "subscription.pending": "Pendiente",
    "report.title": "Informe y Rutina",
    "report.subtitle": "Tu Informe Personalizado",
    "report.monthlyComparison": "Comparativa Mensual",
    "report.dynamicRoutine": "Rutina Dinámica",
    "report.morning": "MAÑANA",
    "report.night": "NOCHE",
    "report.weekly": "SEMANAL",
    "report.lastAnalysis": "Último Análisis",
    "report.pdfReport": "Informe PDF Completo",
    "report.pdfAvailable": "Disponible con plan Pro+ o Esteticista",
    "report.availableWith": "Disponible con plan {plan}",
    "diary.title": "Diario de Piel",
    "diary.subtitle": "Mi Diario de Piel",
    "diary.weekSummary": "Esta semana tu piel ha {trend}",
    "diary.improved": "mejorado",
    "diary.stable": "se ha mantenido estable",
    "diary.worsened": "empeorado",
    "diary.formTitle": "¿Cómo está tu piel hoy?",
    "diary.formFeeling": "Sensación",
    "diary.formNotes": "Notas",
    "diary.formSave": "Guardar entrada",
    "diary.legend": "Leyenda",
    "diary.good": "Bien",
    "diary.fair": "Regular",
    "diary.poor": "Mal",
    "diary.empty": "Sin entradas aún",
    "support.title": "Soporte",
    "support.subtitle": "¿Necesitas ayuda?",
    "support.sendMessage": "Envíanos un mensaje",
    "support.subject": "Asunto",
    "support.message": "Mensaje",
    "support.send": "Enviar mensaje",
    "support.sent": "Mensaje enviado. Te responderemos pronto.",
    "support.myMessages": "Mis Mensajes",
    "support.noMessages": "Sin mensajes",
    "support.reply": "Responder",
    "support.read": "Leído",
    "support.unread": "No leído",
    "guides.title": "Mis Guías",
    "guides.subtitle": "Guías Compradas",
    "guides.empty": "Aún no has comprado guías",
    "guides.browse": "Explorar guías",
    "guides.download": "Descargar",
    "challenges.title": "Desafíos",
    "challenges.comingSoon": "Estamos preparando nuevos desafíos. ¡Pronto disponibles!",
    "referrals.title": "Referidos",
    "referrals.comingSoon": "Próximamente podrás invitar a tus amigos y ganar recompensas.",
    "social.title": "Comunidad",
    "social.comingSoon": "Próximamente podrás comparar resultados y compartir tu progreso.",
    "clinic.title": "Configuración de Clínica",
    "clinic.back": "Volver al panel",
    "clinic.name": "Nombre de la clínica",
    "clinic.license": "Número de licencia",
    "clinic.address": "Dirección",
    "clinic.phone": "Teléfono",
    "clinic.save": "Guardar cambios",
    "clinic.saved": "Configuración guardada",
    "clinic.saveError": "Error al guardar configuración",
    "b2b.title": "Panel B2B",
    "b2b.notAvailable": "Plan no disponible",
    "b2b.exclusive": "Este panel es exclusivo para clientes B2B.",
    "b2b.myClinic": "Mi Clínica",
    "b2b.analyses": "Análisis realizados",
    "b2b.esthetician": "Esteticista",
    "b2b.customization": "Personalización",
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
    "esthetician.referralCode": "Tu Código de Referido",
    "esthetician.referredUsers": "Clientes Referidos",
    "esthetician.marketingKit": "Kit de Marketing",
    "esthetician.marketingDesc": "Recursos para hacer crecer tu práctica",
    "esthetician.shareCode": "Comparte tu Código",
    "esthetician.shareDesc": "Entrega este código a tus clientes para que obtengan un descuento al registrarse",
    "esthetician.discountCode": "Código de Descuento",
    "esthetician.discountDesc": "Descuento único para referidos a través de tu código",
    "esthetician.generateDiscount": "Generar Código de Descuento",
    "esthetician.discountGenerated": "¡Código de descuento generado!",
    "esthetician.yourCodeIs": "Tu código es",
    "esthetician.copyCode": "Copiar Código",
    "esthetician.copied": "¡Copiado!",
    "esthetician.flyerTitle": "Flyer Digital",
    "esthetician.emailTemplate": "Plantilla de Email",
    "esthetician.emailSubject": "Te invito a descubrir tu piel con IA",
    "esthetician.emailBody": "¡Hola! Estoy usando The Serene Lens con mis clientes. Usa mi código {code} al registrarte y obtén un descuento especial. Es una herramienta de análisis de piel con IA que nos ayuda a dar seguimiento profesional a tu progreso.",
    "esthetician.estheticianCodeLabel": "Código de Esteticista (opcional)",
    "esthetician.codePlaceholder": "ej. EST-ABC123",
    "esthetician.codeHelp": "Si un esteticista te dio un código, ingrésalo aquí para vincular tu cuenta",
    "esthetician.codeInvalid": "Código de esteticista inválido",
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
