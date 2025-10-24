import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-terminal-amber text-black",
        secondary: "bg-terminal-green text-black",
        destructive: "bg-terminal-red text-white",
        outline: "border border-terminal-amber text-terminal-amber",
        cyan: "bg-terminal-cyan text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  );
}

export { Badge, badgeVariants };
