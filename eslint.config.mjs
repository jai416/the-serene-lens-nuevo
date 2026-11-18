import next from "eslint-config-next"
import nextTypescript from "eslint-config-next/typescript"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

/**
 * ESLint flat config (ESLint 9 + Next.js 16).
 *
 * Antes se usaba `next lint` + FlatCompat, pero Next 16 eliminó `next lint`
 * y el FlatCompat con "next/core-web-vitals" provocaba un error circular al
 * normalizar la config. Ahora se usan los exports planos de eslint-config-next.
 */
const eslintConfig = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "src/generated/**", "public/**", "next-env.d.ts"],
  },
  {
    // Next.js exige require() en instrumentation.ts (carga perezosa en el arranque)
    files: ["src/instrumentation.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // El patrón "useEffect(() => { fetchX().then(setState) }, [])" es el
      // idiomático de datos remotos en esta base y la regla lo marca como error
      // en ~28 sitios. Es aviso, no error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default eslintConfig
