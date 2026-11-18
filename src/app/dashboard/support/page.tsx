import { redirect } from "next/navigation"

/**
 * El formulario de tickets se unificó con el chat en vivo.
 *
 * Ambos escribían para el usuario logueado en el mismo destino que el
 * admin ya veía, así que había 3 formas de escribir (contacto, tickets,
 * chat). Ahora quedan 2: /contact (público) y /dashboard/chat (logueados).
 */
export default function SupportRedirectPage() {
  redirect("/dashboard/chat")
}
