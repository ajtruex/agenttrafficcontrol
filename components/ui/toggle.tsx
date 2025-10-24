"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-terminal-gray-darker focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=on]:bg-terminal-amber data-[state=on]:text-black",
  {
    variants: {
      variant: {
        default: "bg-terminal-gray-darker text-terminal-white",
        outline: "border border-terminal-amber text-terminal-amber",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-2",
        lg: "h-12 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={toggleVariants({ variant, size, className })}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
