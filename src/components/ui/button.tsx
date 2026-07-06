import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#88B078] text-white hover:bg-[#78A068] dark:hover:bg-[#78A068] shadow-[0_4px_12px_rgba(136,176,120,0.3)] dark:shadow-[0_4px_12px_rgba(136,176,120,0.2)] hover:shadow-[0_8px_20px_rgba(136,176,120,0.45)] dark:hover:shadow-[0_8px_20px_rgba(136,176,120,0.3)] rounded-full h-10 px-5 py-2",
        primary: "bg-[#88B078] text-white hover:bg-[#78A068] dark:hover:bg-[#78A068] shadow-[0_4px_12px_rgba(136,176,120,0.3)] dark:shadow-[0_4px_12px_rgba(136,176,120,0.2)] hover:shadow-[0_8px_20px_rgba(136,176,120,0.45)] dark:hover:shadow-[0_8px_20px_rgba(136,176,120,0.3)] rounded-full h-10 px-5 py-2",
        secondary: "bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-[#F0F0F0] font-semibold border border-[#88B078] dark:border-[#88B078] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] rounded-full h-10 px-5 py-2",
        outline: "border border-[#E8E8E8] dark:border-[#333333] bg-transparent text-[#666666] dark:text-[#999999] font-medium hover:border-[#88B078] dark:hover:border-[#88B078] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] rounded-full h-10 px-5 py-2",
        ghost: "hover:bg-[#E2ECE0] dark:hover:bg-[#2A3A2A] text-[#666666] dark:text-[#999999] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] rounded-full h-10 px-5 py-2",
        link: "text-[#666666] dark:text-[#999999] underline-offset-4 hover:underline hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0]",
        destructive: "bg-[#E07070] text-white hover:bg-[#D06060] rounded-full h-10 px-5 py-2",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-full px-3 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, "aria-label": ariaLabel, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} aria-label={ariaLabel} {...props} />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
