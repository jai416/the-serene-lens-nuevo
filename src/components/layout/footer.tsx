import Link from "next/link"
import Image from "next/image"
import { MessageCircle } from "lucide-react"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""

export function Footer() {
  const { locale } = useLocale()
  return (
    <footer className="border-t border-[#E8E8E8] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#88B078] flex items-center justify-center overflow-hidden">
                <Image src="/logo.webp" alt="The Serene Lens" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-base font-semibold text-[#1A1A1A]">The Serene Lens</span>
            </Link>
            <p className="text-sm text-[#666666]">
              {t("footer.observation", locale)}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3 text-[#1A1A1A]">{t("footer.product", locale)}</h4>
            <div className="space-y-2">
              <Link href="/analysis" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.analysis", locale)}</Link>
              <Link href="/products" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.products", locale)}</Link>
              <Link href="/pricing" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.pricing", locale)}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3 text-[#1A1A1A]">{t("footer.info", locale)}</h4>
            <div className="space-y-2">
              <Link href="/blog" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.blog", locale)}</Link>
              <Link href="/privacy" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.privacy", locale)}</Link>
              <Link href="/terms" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.terms", locale)}</Link>
              <Link href="/security" className="block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">{t("footer.security", locale)}</Link>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#666666] hover:text-[#88B078] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E8E8E8] text-center text-xs text-[#999999]">
          <p>&copy; {new Date().getFullYear()} The Serene Lens. {t("footer.rights", locale)}</p>
          <p className="mt-1">
            {t("common.disclaimer", locale)}
          </p>
        </div>
      </div>
    </footer>
  )
}
