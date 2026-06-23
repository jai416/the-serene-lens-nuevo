import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#B0D48E] dark:hover:bg-[#A0C47E] shadow-[0_4px_12px_rgba(194,224,157,0.3)] dark:shadow-[0_4px_12px_rgba(194,224,157,0.2)] hover:shadow-[0_8px_20px_rgba(194,224,157,0.45)] dark:hover:shadow-[0_8px_20px_rgba(194,224,157,0.3)] rounded-full h-10 px-5 py-2",
        primary: "bg-primary text-primary-foreground hover:bg-[#B0D48E] dark:hover:bg-[#A0C47E] shadow-[0_4px_12px_rgba(194,224,157,0.3)] dark:shadow-[0_4px_12px_rgba(194,224,157,0.2)] hover:shadow-[0_8px_20px_rgba(194,224,157,0.45)] dark:hover:shadow-[0_8px_20px_rgba(194,224,157,0.3)] rounded-full h-10 px-5 py-2",
        secondary: "bg-white dark:bg-[#2A3228] text-[#2F3A2D] dark:text-[#E8EDE6] font-semibold border border-[#C2E09D] dark:border-[#3A5A2A] hover:bg-[#F8FAF5] dark:hover:bg-[#2E3829] rounded-full h-10 px-5 py-2",
        outline: "border border-[#DDE7D3] dark:border-[#3A4536] bg-transparent text-[#64705E] dark:text-[#9BAA93] font-medium hover:border-[#C2E09D] dark:hover:border-[#C2E09D] hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] rounded-full h-10 px-5 py-2",
        ghost: "hover:bg-[#F0F5EC] dark:hover:bg-[#2E3829] text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] rounded-full h-10 px-5 py-2",
        link: "text-[#64705E] dark:text-[#9BAA93] underline-offset-4 hover:underline hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6]",
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
