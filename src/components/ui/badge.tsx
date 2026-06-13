import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        neon: "border-transparent bg-primary text-primary-foreground shadow-[0_0_12px_rgba(183,255,42,0.25)]",
        secondary: "border-transparent bg-[rgba(255,255,255,0.08)] text-on-surface",
        outline: "border-[rgba(255,255,255,0.25)] text-muted-foreground",
        success: "border-transparent bg-[rgba(183,255,42,0.15)] text-primary",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
