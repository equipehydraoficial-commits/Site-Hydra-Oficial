import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex items-center justify-center font-normal text-foreground select-none shrink-0 overflow-hidden bg-secondary",
  {
    variants: {
      size: {
        default: "h-10 w-10 text-sm",
        sm: "h-8 w-8 text-xs",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  fallback?: React.ReactNode
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, shape, fallback, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, shape }), className)}
        {...props}
      >
        {fallback}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }