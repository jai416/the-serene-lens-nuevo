import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(194,224,157,0.3)]",
        primary: "border-transparent bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(194,224,157,0.3)]",
        secondary: "border-transparent bg-[#F0F5EC] text-[#64705E]",
        outline: "border-[#DDE7D3] text-[#64705E]",
        success: "border-transparent bg-[#C2E09D] text-[#2F3A2D] shadow-[0_2px_8px_rgba(194,224,157,0.3)]",
        tertiary: "border-transparent bg-[#FFF6AD] text-[#2F3A2D] shadow-[0_2px_8px_rgba(255,246,173,0.3)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div role="status" className={cn(badgeVariants({ variant }), className)} {...props} />
}
