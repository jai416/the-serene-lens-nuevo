import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#88B078] text-white shadow-[0_2px_8px_rgba(136,176,120,0.3)] dark:shadow-[0_2px_8px_rgba(136,176,120,0.15)]",
        primary: "border-transparent bg-[#88B078] text-white shadow-[0_2px_8px_rgba(136,176,120,0.3)] dark:shadow-[0_2px_8px_rgba(136,176,120,0.15)]",
        secondary: "border-transparent bg-[#E2ECE0] dark:bg-[#2A3A2A] text-[#666666] dark:text-[#999999]",
        outline: "border-[#E8E8E8] dark:border-[#333333] text-[#666666] dark:text-[#999999]",
        success: "border-transparent bg-[#88B078] text-white shadow-[0_2px_8px_rgba(136,176,120,0.3)] dark:shadow-[0_2px_8px_rgba(136,176,120,0.15)]",
        tertiary: "border-transparent bg-[#FFF9E6] text-[#1A1A1A] shadow-[0_2px_8px_rgba(255,249,230,0.3)] dark:shadow-[0_2px_8px_rgba(255,249,230,0.15)]",
        mint: "border-transparent bg-[#E2ECE0] text-[#1A1A1A]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div role="status" className={cn(badgeVariants({ variant }), className)} {...props} />
}
