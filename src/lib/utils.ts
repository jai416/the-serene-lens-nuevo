import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price)
}

export function getPlanLabel(plan: string) {
  const labels: Record<string, string> = {
    FREE: "Essential",
    PREMIUM: "Premium",
    PREMIUM_ANNUAL: "Premium Anual",
    PRO: "Pro",
    PRO_ANNUAL: "Pro Anual",
    PRO_PLUS: "Pro+",
    PRO_PLUS_ANNUAL: "Pro+ Anual",
    ESTHETICIAN: "Esteticista",
    ESTHETICIAN_ANNUAL: "Esteticista Anual",
  }
  return labels[plan] || plan
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
