import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-terminal-amber text-black hover:brightness-110",
        destructive:
          "bg-terminal-red text-white hover:bg-red-700",
        secondary:
          "bg-terminal-green text-black hover:brightness-110",
        outline:
          "border border-terminal-amber bg-terminal-black text-terminal-amber hover:bg-terminal-gray-darker",
        ghost:
          "hover:bg-terminal-gray-darker text-terminal-white",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
