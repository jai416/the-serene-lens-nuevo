import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm rounded-xl h-10 px-5 py-2",
        neon: "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(183,255,42,0.3)] hover:shadow-[0_0_30px_rgba(183,255,42,0.5)] hover:scale-[1.02] rounded-xl h-10 px-5 py-2",
        glass: "bg-[rgba(255,255,255,0.10)] backdrop-blur-[25px] border border-[rgba(255,255,255,0.25)] text-on-surface hover:bg-[rgba(255,255,255,0.15)] rounded-xl h-10 px-5 py-2",
        destructive: "bg-destructive text-white hover:opacity-90 rounded-xl h-10 px-5 py-2",
        outline: "border border-input bg-transparent hover:bg-muted rounded-xl h-10 px-5 py-2",
        secondary: "bg-[rgba(255,255,255,0.06)] text-on-surface hover:bg-[rgba(255,255,255,0.10)] rounded-xl h-10 px-5 py-2",
        ghost: "hover:bg-[rgba(255,255,255,0.06)] rounded-xl h-10 px-5 py-2",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "gradient-primary text-primary-foreground shadow-sm hover:opacity-90 hover:shadow-md rounded-xl h-10 px-5 py-2",
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
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
