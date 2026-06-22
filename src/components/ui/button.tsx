import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#B0D48E] shadow-sm rounded-xl h-10 px-5 py-2",
        primary: "bg-primary text-primary-foreground hover:bg-[#B0D48E] rounded-xl h-10 px-5 py-2",
        secondary: "bg-white border border-[#C2E09D] text-[#2F3A2D] hover:bg-[#F8FAF5] rounded-xl h-10 px-5 py-2",
        outline: "border border-[#DDE7D3] bg-white hover:bg-[#F8FAF5] rounded-xl h-10 px-5 py-2",
        ghost: "hover:bg-[#F0F5EC] rounded-xl h-10 px-5 py-2",
        link: "text-[#64705E] underline-offset-4 hover:underline hover:text-[#2F3A2D]",
        destructive: "bg-[#E07070] text-white hover:bg-[#D06060] rounded-xl h-10 px-5 py-2",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
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
