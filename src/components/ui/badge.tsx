import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        primary: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-[#F0F5EC] text-[#64705E]",
        outline: "border-[#DDE7D3] text-[#64705E]",
        success: "border-transparent bg-[#C2E09D] text-[#2F3A2D]",
        tertiary: "border-transparent bg-[#FFF6AD] text-[#2F3A2D]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div role="status" className={cn(badgeVariants({ variant }), className)} {...props} />
}
