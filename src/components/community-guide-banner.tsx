"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, BookOpen } from "lucide-react";

interface Guide {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  price: number;
  category: string;
}

interface MatchedGuide {
  guide: Guide;
  reason: string;
}

const KEYWORD_MAP: Record<string, { slugs: string[]; reason: string }> = {
  acné: { slugs: ["guia-piel-grasa"], reason: "tratar el acné" },
  acnee: { slugs: ["guia-piel-grasa"], reason: "tratar el acné" },
  brotes: { slugs: ["guia-piel-grasa"], reason: "controlar brotes" },
  granos: { slugs: ["guia-piel-grasa"], reason: "tratar granos" },
  "puntos negros": { slugs: ["guia-piel-grasa"], reason: "eliminar puntos negros" },
  manchas: { slugs: ["eliminar-manchas-30-dias"], reason: "eliminar manchas" },
  pigmentación: { slugs: ["eliminar-manchas-30-dias"], reason: "unificar el tono" },
  hiperpigmentación: { slugs: ["eliminar-manchas-30-dias"], reason: "reducir hiperpigmentación" },
  melasma: { slugs: ["eliminar-manchas-30-dias"], reason: "tratar el melasma" },
  "protección solar": { slugs: ["proteccion-solar-anual"], reason: "proteger tu piel del sol" },
  spf: { slugs: ["proteccion-solar-anual"], reason: "elegir tu protector solar" },
  protector: { slugs: ["proteccion-solar-anual"], reason: "protección solar" },
  quemadura: { slugs: ["proteccion-solar-anual"], reason: "prevenir quemaduras solares" },
  sol: { slugs: ["proteccion-solar-anual"], reason: "protección solar" },
  arrugas: { slugs: ["rutina-antiedad-40"], reason: "reducir arrugas" },
  líneas: { slugs: ["rutina-antiedad-40"], reason: "suavizar líneas de expresión" },
  envejecimiento: { slugs: ["rutina-antiedad-40"], reason: "prevenir el envejecimiento" },
  "edad": { slugs: ["rutina-antiedad-40"], reason: "cuidado antiedad" },
  madura: { slugs: ["rutina-antiedad-40"], reason: "cuidado para pieles maduras" },
  poros: { slugs: ["guia-piel-grasa"], reason: "minimizar poros" },
  grasa: { slugs: ["guia-piel-grasa"], reason: "controlar la grasa" },
  brillo: { slugs: ["guia-piel-grasa"], reason: "controlar el brillo" },
  sebo: { slugs: ["guia-piel-grasa"], reason: "regular el sebo" },
  "piel grasa": { slugs: ["guia-piel-grasa"], reason: "cuidar tu piel grasa" },
  exfoliación: { slugs: ["ingredientes-evitar"], reason: "elegir exfoliantes seguros" },
  ingredientes: { slugs: ["ingredientes-evitar"], reason: "conocer tus ingredientes" },
};

function matchWithGuides(content: string, guides: Guide[]): MatchedGuide | null {
  const lower = content.toLowerCase();
  let bestMatch: MatchedGuide | null = null;
  let bestPriority = Infinity;

  for (const [keyword, { slugs, reason }] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      const slug = slugs[0];
      const guide = guides.find((g) => g.slug === slug);
      if (!guide) continue;

      if (!bestMatch || keyword.length < bestPriority) {
        bestMatch = { guide, reason };
        bestPriority = keyword.length;
      }
    }
  }

  return bestMatch;
}

export default function CommunityGuideBanner({ content }: { content: string }) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [matched, setMatched] = useState<MatchedGuide | null>(null);

  useEffect(() => {
    if (!session) return;

    fetch("/api/guides")
      .then((res) => res.json())
      .then((d) => {
        const list: Guide[] = d?.data?.guides || d?.guides || [];
        setMatched(matchWithGuides(content, list));
      })
      .catch(() => {});
  }, [content, session]);

  if (!session || dismissed || !matched) return null;

  const { guide, reason } = matched;

  return (
    <div className="mt-3 rounded-lg bg-[#F0F7E6] dark:bg-[#1E2A1A] border border-[#D4E8B8] dark:border-[#2E3E28] px-4 py-3 flex items-start gap-3 text-sm">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-[#88B078]/30 dark:bg-[#88B078]/20 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-[#5A7A3A] dark:text-[#88B078]" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#1A1A1A] dark:text-[#E8EDE6] font-medium leading-snug">
          ¿Te interesa {reason}?
        </p>
        <p className="text-[#666666] dark:text-[#9BAA93] mt-0.5">
          {guide.title} — <span className="font-semibold">${guide.price}</span>
        </p>
        <a
          href={`/api/payments/create-guide?slug=${guide.slug}`}
          className="inline-block mt-2 px-3 py-1 rounded-md bg-[#88B078] hover:bg-[#78A068] text-[#1A1A1A] font-medium text-xs transition-colors"
        >
          Ver guía
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded hover:bg-[#D4E8B8] dark:hover:bg-[#2E3E28] text-[#999999] dark:text-[#7A8A72] transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
